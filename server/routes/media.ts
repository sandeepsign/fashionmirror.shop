import type { Express, Request, Response } from "express";
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { requireAuth } from "../middleware/auth";

// Security helper to prevent path traversal attacks
function sanitizePath(inputPath: string, baseDir: string): string | null {
  try {
    const normalized = path.normalize(inputPath);
    const resolved = path.resolve(baseDir, normalized);
    
    // Ensure the resolved path is within the base directory
    if (!resolved.startsWith(path.resolve(baseDir))) {
      return null;
    }
    
    return resolved;
  } catch {
    return null;
  }
}

// Get MIME type from file extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export function registerMediaRoutes(app: Express): void {
  const mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), 'uploads');

  // Protected media endpoint - requires authentication and ownership validation
  app.get('/media/protected/*', requireAuth, async (req: Request, res: Response) => {
    try {
      const filePath = req.params[0]; // Get the path after /media/protected/
      const fullPath = sanitizePath(filePath, path.join(mediaRoot, 'protected'));
      
      if (!fullPath) {
        return res.status(400).json({ error: 'Invalid file path' });
      }

      // Extract userId from path and validate ownership
      const pathParts = filePath.split('/');
      if (pathParts.length < 3) {
        return res.status(400).json({ error: 'Invalid protected file path' });
      }
      
      const [type, pathUserId] = pathParts;
      const currentUserId = (req as any).user?.id;
      
      if (!currentUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Verify the user can only access their own files
      if (pathUserId !== currentUserId) {
        return res.status(403).json({ error: 'Access denied: You can only access your own files' });
      }

      // Check if file exists
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Set security headers
      res.set({
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Type': getMimeType(fullPath),
        'Content-Length': stats.size.toString()
      });

      // Handle Range requests for better performance
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;

        res.status(206).set({
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString()
        });

        const stream = createReadStream(fullPath, { start, end });
        stream.pipe(res);
      } else {
        // Stream the entire file
        const stream = createReadStream(fullPath);
        stream.pipe(res);
      }

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      console.error('Error serving protected media:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}