import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

export interface MediaStorageOptions {
  visibility: 'public' | 'protected';
  type: 'model' | 'fashion' | 'result' | 'user';
  userId?: string;
  ext?: string;
}

export interface MediaStorageResult {
  url: string;
  paths: {
    original: string;
    thumb?: string;
    medium?: string;
  };
  meta: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface MediaStorage {
  saveImage(buffer: Buffer, options: MediaStorageOptions): Promise<MediaStorageResult>;
  deleteByUrl(url: string): Promise<void>;
  getFilePath(url: string): string;
  ensureThumb(url: string, size?: number): Promise<string>;
}

export class LocalFilesystemMediaStorage implements MediaStorage {
  private mediaRoot: string;
  private baseUrl: string;

  constructor() {
    this.mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.MEDIA_BASE_URL || '/media';
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o750 });
    } catch (error) {
      // Directory might already exist
    }
  }

  private generatePath(options: MediaStorageOptions, filename: string): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const shard = filename.substring(0, 2);

    // Include userId in path for protected content to enable proper authorization
    const pathParts: string[] = [
      options.visibility,
      options.type
    ];
    
    if (options.visibility === 'protected' && options.userId) {
      pathParts.push(options.userId);
    }
    
    pathParts.push(year, month, day, shard, filename);

    return path.join(...pathParts);
  }

  private async validateAndProcessImage(buffer: Buffer): Promise<{ 
    processed: Buffer; 
    meta: { width: number; height: number; format: string; size: number; } 
  }> {
    try {
      // Validate and process image with Sharp
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image metadata');
      }

      // Strip metadata and normalize to JPEG with quality optimization
      const processed = await image
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      return {
        processed,
        meta: {
          width: metadata.width,
          height: metadata.height,
          format: 'jpeg',
          size: processed.length
        }
      };
    } catch (error) {
      throw new Error(`Invalid image format: ${error}`);
    }
  }

  async saveImage(buffer: Buffer, options: MediaStorageOptions): Promise<MediaStorageResult> {
    // Validate and process image
    const { processed, meta } = await this.validateAndProcessImage(buffer);
    
    // Generate filename and paths
    const uuid = randomUUID();
    const ext = options.ext || 'jpg';
    const filename = `${uuid}.${ext}`;
    const relativePath = this.generatePath(options, filename);
    const fullPath = path.join(this.mediaRoot, relativePath);

    // Ensure directory exists
    await this.ensureDirectory(path.dirname(fullPath));

    // Save original file
    await fs.writeFile(fullPath, processed, { mode: 0o640 });

    // Generate thumbnail (256w)
    const thumbPath = path.join(path.dirname(fullPath), `${uuid}-thumb.${ext}`);
    const thumbBuffer = await sharp(processed)
      .resize(256, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    await fs.writeFile(thumbPath, thumbBuffer, { mode: 0o640 });

    // Generate medium size (1024w) 
    const mediumPath = path.join(path.dirname(fullPath), `${uuid}-medium.${ext}`);
    const mediumBuffer = await sharp(processed)
      .resize(1024, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    await fs.writeFile(mediumPath, mediumBuffer, { mode: 0o640 });

    // Generate URLs (fix: don't duplicate visibility in path)
    const urlPath = this.generatePath(options, filename).replace(/\\/g, '/');
    const baseUrl = `${this.baseUrl}/${urlPath}`;
    const thumbUrl = baseUrl.replace(`.${ext}`, `-thumb.${ext}`);
    const mediumUrl = baseUrl.replace(`.${ext}`, `-medium.${ext}`);

    return {
      url: baseUrl,
      paths: {
        original: fullPath,
        thumb: thumbPath,
        medium: mediumPath
      },
      meta
    };
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const filePath = this.getFilePath(url);
      
      // Delete original and derivatives
      const ext = path.extname(filePath);
      const basePath = filePath.replace(ext, '');
      
      const filesToDelete = [
        filePath,
        `${basePath}-thumb${ext}`,
        `${basePath}-medium${ext}`
      ];

      await Promise.allSettled(
        filesToDelete.map(file => fs.unlink(file))
      );
    } catch (error) {
      console.warn(`Failed to delete media file: ${url}`, error);
    }
  }

  getFilePath(url: string): string {
    // Convert URL back to filesystem path
    // Strip baseUrl and remove leading slashes to prevent absolute path issues
    const urlPath = url.replace(this.baseUrl, '').replace(/^\/+/, '');
    return path.join(this.mediaRoot, urlPath);
  }

  async ensureThumb(url: string, size = 256): Promise<string> {
    const ext = path.extname(url);
    const thumbUrl = url.replace(ext, `-thumb${ext}`);
    const thumbPath = this.getFilePath(thumbUrl);
    
    try {
      await fs.access(thumbPath);
      return thumbUrl;
    } catch {
      // Generate thumbnail if it doesn't exist
      const originalPath = this.getFilePath(url);
      const originalBuffer = await fs.readFile(originalPath);
      
      const thumbBuffer = await sharp(originalBuffer)
        .resize(size, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      await fs.writeFile(thumbPath, thumbBuffer, { mode: 0o640 });
      return thumbUrl;
    }
  }
}

// Export singleton instance
export const mediaStorage = new LocalFilesystemMediaStorage();