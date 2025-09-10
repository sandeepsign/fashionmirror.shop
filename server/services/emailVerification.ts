import crypto from 'crypto';
import { sendEmail, type SmtpMessage } from '../utils/replitmail.js';

export interface VerificationTokenData {
  token: string;
  hashedToken: string;
  expiresAt: Date;
}

/**
 * Generates a cryptographically secure verification token
 * Returns both the plain token (for email) and hashed token (for database)
 */
export function generateVerificationToken(): VerificationTokenData {
  // Generate 32 random bytes (256 bits) for security
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash the token before storing in database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Set expiration to 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return {
    token,
    hashedToken,
    expiresAt
  };
}

/**
 * Hashes a verification token for database comparison
 */
export function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sends email verification email to user
 */
export async function sendVerificationEmail(
  email: string, 
  username: string, 
  verificationToken: string
): Promise<void> {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_URL || 'https://your-app.replit.app'
    : 'http://localhost:5000';
    
  const verificationUrl = `${baseUrl}/verify-email/${verificationToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { padding: 30px 0; }
        .button { 
          display: inline-block; 
          padding: 15px 30px; 
          background-color: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: bold;
          margin: 20px 0;
        }
        .footer { 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #f0f0f0; 
          font-size: 14px; 
          color: #666; 
        }
        .security { 
          background-color: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🪞 FashionMirror</div>
        </div>
        
        <div class="content">
          <h2>Welcome to FashionMirror, ${username}!</h2>
          
          <p>Thank you for joining FashionMirror, the AI-powered virtual fashion try-on experience. To complete your registration and start exploring fashion with AI, please verify your email address.</p>
          
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Email Address</a>
          </p>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
          </p>
          
          <div class="security">
            <strong>🔒 Security Note:</strong><br>
            This verification link expires in 24 hours for your security. If you didn't create an account with FashionMirror, you can safely ignore this email.
          </div>
          
          <p>Once verified, you'll be able to:</p>
          <ul>
            <li>✨ Try on fashion items virtually using AI</li>
            <li>👗 Upload and manage your fashion collection</li>
            <li>🎯 Experience step-by-step fashion transformations</li>
            <li>🤖 Get AI-powered fashion recommendations</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The FashionMirror Team</p>
          <p><em>Powered by Google Gemini 2.5 Flash Image AI</em></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to FashionMirror, ${username}!

Thank you for joining FashionMirror, the AI-powered virtual fashion try-on experience. To complete your registration and start exploring fashion with AI, please verify your email address.

Click this link to verify your email:
${verificationUrl}

This verification link expires in 24 hours for your security. If you didn't create an account with FashionMirror, you can safely ignore this email.

Once verified, you'll be able to:
• Try on fashion items virtually using AI
• Upload and manage your fashion collection  
• Experience step-by-step fashion transformations
• Get AI-powered fashion recommendations

Best regards,
The FashionMirror Team

Powered by Google Gemini 2.5 Flash Image AI
  `;

  const message: SmtpMessage = {
    to: email,
    subject: '🪞 Welcome to FashionMirror - Verify Your Email',
    html: htmlContent,
    text: textContent,
  };

  try {
    const result = await sendEmail(message);
    console.log(`Verification email sent successfully to ${email}:`, result.accepted);
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw new Error('Failed to send verification email. Please try again.');
  }
}

/**
 * Sends welcome email after successful verification
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { padding: 30px 0; }
        .feature { 
          background-color: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 10px 0; 
        }
        .footer { 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #f0f0f0; 
          font-size: 14px; 
          color: #666; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🪞 FashionMirror</div>
        </div>
        
        <div class="content">
          <h2>🎉 Welcome to FashionMirror, ${username}!</h2>
          
          <p>Your email has been verified successfully! You're now ready to explore the future of fashion with AI-powered virtual try-ons.</p>
          
          <h3>🚀 Get Started:</h3>
          
          <div class="feature">
            <strong>1. Upload Your Photo</strong><br>
            Start by uploading a clear photo of yourself to see how different outfits look on you.
          </div>
          
          <div class="feature">
            <strong>2. Browse Fashion Collection</strong><br>
            Explore our curated collection or upload your own fashion items with AI auto-categorization.
          </div>
          
          <div class="feature">
            <strong>3. Experience AI Try-On</strong><br>
            Watch as AI progressively applies fashion items with real-time status updates.
          </div>
          
          <p>Your FashionMirror account is now active and ready to use. Log in anytime to continue your fashion journey!</p>
        </div>
        
        <div class="footer">
          <p>Happy styling!<br>The FashionMirror Team</p>
          <p><em>Powered by Google Gemini 2.5 Flash Image AI</em></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
🎉 Welcome to FashionMirror, ${username}!

Your email has been verified successfully! You're now ready to explore the future of fashion with AI-powered virtual try-ons.

🚀 Get Started:

1. Upload Your Photo
   Start by uploading a clear photo of yourself to see how different outfits look on you.

2. Browse Fashion Collection  
   Explore our curated collection or upload your own fashion items with AI auto-categorization.

3. Experience AI Try-On
   Watch as AI progressively applies fashion items with real-time status updates.

Your FashionMirror account is now active and ready to use. Log in anytime to continue your fashion journey!

Happy styling!
The FashionMirror Team

Powered by Google Gemini 2.5 Flash Image AI
  `;

  const message: SmtpMessage = {
    to: email,
    subject: '🎉 Welcome to FashionMirror - You\'re All Set!',
    html: htmlContent,
    text: textContent,
  };

  try {
    const result = await sendEmail(message);
    console.log(`Welcome email sent successfully to ${email}:`, result.accepted);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    // Don't throw error for welcome email - verification is complete
  }
}