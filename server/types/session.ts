import { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: User;
    // Merchant authentication
    merchantId?: number;
    merchantEmail?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};