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

// Health check endpoints - lightweight and fast, no database dependencies
app.get("/health", (_req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "FashionMirror API"
  });
});

// API health check endpoint - for deployment health checks using /api path
app.get("/api/health", (_req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "FashionMirror API"
  });
});

app.head("/api/health", (_req, res) => {
  res.status(200).end();
});

// Catch-all API health check for HEAD requests to /api
app.head("/api", (_req, res) => {
  res.status(200).end();
});

// Catch-all API health check for GET requests to /api
app.get("/api", (_req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "FashionMirror API"
  });
});

// Root health check endpoint for deployment health checks
app.head("/", (_req, res) => {
  res.status(200).end();
});

app.get("/", (_req, res) => {
  res.status(200).json({ 
    message: "FashionMirror API is running",
    timestamp: new Date().toISOString()
  });
});

// Track session initialization status
let sessionInitialized = false;

// Setup session management function - to be called after basic server startup
async function setupSessionMiddleware() {
  try {
    const PgSession = connectPgSimple(session);
    
    const sessionMiddleware = session({
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
    });

    app.use(sessionMiddleware);
    sessionInitialized = true;
    log("Session middleware initialized successfully");
    return true;
  } catch (error) {
    log(`Warning: Failed to initialize session middleware: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Continue without sessions in case of database issues
    sessionInitialized = false;
    return false;
  }
}

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
  // Start the server first to respond to health checks quickly
  const port = parseInt(process.env.PORT || '5000', 10);
  const server = app.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`server started on port ${port} - health checks ready`);
  });

  // Now initialize database-dependent features after server is listening
  await setupSessionMiddleware();

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
  try {
    registerMediaRoutes(app);
    log("Media routes registered successfully");
  } catch (error) {
    log(`Warning: Failed to register media routes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Register main application routes
  try {
    await registerRoutes(app);
    log("Application routes registered successfully");
  } catch (error) {
    log(`Warning: Failed to register application routes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    log(`Error ${status}: ${message}`);
    // Don't throw err - this would crash the process after responding
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  log(`FashionMirror server fully initialized on port ${port}`);
})();
