import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { generateMerchantKeys, generateWebhookSecret, hashPassword } from "../server/services/merchantService";

// Load environment variables
config();

const sql = neon(process.env.DATABASE_URL!);

async function createTestMerchant() {
  console.log("Creating test merchant...\n");

  const { liveKey, testKey } = generateMerchantKeys();
  const webhookSecret = generateWebhookSecret();
  const passwordHash = await hashPassword("TestPassword123!");

  try {
    // Check if test merchant already exists
    const existing = await sql`SELECT id FROM merchants WHERE email = 'test@example.com'`;

    if (existing.length > 0) {
      console.log("Test merchant already exists. Updating keys...\n");

      await sql`
        UPDATE merchants
        SET live_key = ${liveKey}, test_key = ${testKey}, webhook_secret = ${webhookSecret}
        WHERE email = 'test@example.com'
      `;
    } else {
      await sql`
        INSERT INTO merchants (
          name, email, password_hash, live_key, test_key,
          allowed_domains, plan, monthly_quota, quota_used,
          webhook_secret, status
        ) VALUES (
          'Test Merchant',
          'test@example.com',
          ${passwordHash},
          ${liveKey},
          ${testKey},
          '["localhost", "127.0.0.1"]'::jsonb,
          'free',
          100,
          0,
          ${webhookSecret},
          'active'
        )
      `;
    }

    console.log("✅ Test merchant created/updated successfully!\n");
    console.log("=".repeat(50));
    console.log("MERCHANT CREDENTIALS");
    console.log("=".repeat(50));
    console.log(`Email:       test@example.com`);
    console.log(`Password:    TestPassword123!`);
    console.log(`Live Key:    ${liveKey}`);
    console.log(`Test Key:    ${testKey}`);
    console.log(`Webhook:     ${webhookSecret}`);
    console.log("=".repeat(50));
    console.log("\nUse these keys in X-Merchant-Key header for API testing.\n");

  } catch (error) {
    console.error("Error creating test merchant:", error);
    process.exit(1);
  }
}

createTestMerchant();
