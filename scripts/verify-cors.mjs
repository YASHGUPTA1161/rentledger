import { S3Client, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    if (!line.trim() || line.startsWith('#')) return;
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
      if (key && value) process.env[key] = value;
    }
  });
}

const client = new S3Client({
  region: "auto",
  endpoint: "https://t3.storage.dev",
  forcePathStyle: false,
});

const bucketName = process.env.S3_BUCKET_NAME || "rentledger";
console.log(`Checking CORS for bucket: ${bucketName}`);

try {
  const command = new GetBucketCorsCommand({ Bucket: bucketName });
  const response = await client.send(command);
  
  const rules = response.CORSRules || [];
  const allowed = rules.some(r => r.AllowedOrigins && r.AllowedOrigins.includes("http://localhost:3000"));
  
  if (allowed) {
      console.log(`VERIFICATION SUCCESS: localhost:3000 is allowed on ${bucketName}.`);
  } else {
      console.log(`VERIFICATION FAILED: localhost:3000 strictly NOT found on ${bucketName}.`);
      console.log("Rules found:", JSON.stringify(rules));
  }
} catch (error) {
    if (error.name === "NoSuchCORSConfiguration") {
        console.log(`VERIFICATION FAILED: No CORS configuration found on ${bucketName}.`);
    } else {
        console.error("VERIFICATION ERROR:", error.message);
    }
}
