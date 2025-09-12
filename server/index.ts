import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { registerRoutes } from "./routes";
import { registerMediaRoutes } from "./routes/media";
import { setupVite, serveStatic, log } from "./vite";
import "./types/session"; // Import session type definitions

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoints - must be before session middleware
// Simple health check for deployment health checks
app.get("/health", (_req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "FashionMirror API"
  });
});

// Root health check endpoint
app.head("/", (_req, res) => {
  res.status(200).end();
});

app.get("/", (_req, res) => {
  res.status(200).json({ 
    message: "FashionMirror API is running",
    timestamp: new Date().toISOString()
  });
});

// Setup session management with PostgreSQL store
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
    },
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Allow non-HTTPS in Replit deployment
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax', // Less restrictive for deployment compatibility
  },
  name: 'fashionmirror.sid',
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup static serving for public media files
  const mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), 'uploads');
  app.use('/media/public', express.static(path.join(mediaRoot, 'public'), {
    maxAge: '7d',
    etag: true,
    setHeaders: (res) => {
      res.set('X-Content-Type-Options', 'nosniff');
    }
  }));

  // Register media routes for protected content
  registerMediaRoutes(app);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
