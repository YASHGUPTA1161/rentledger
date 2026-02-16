import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually from project root
const envPath = path.resolve(__dirname, "../.env");
console.log(`Loading .env from ${envPath}`);

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    // Handle lines with comments or multiple =
    if (!line.trim() || line.startsWith('#')) return;
    
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      // Join the rest back in case value contains =
      const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, ""); // Remove quotes
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
} else {
    console.warn(".env file not found!");
}

const client = new S3Client({
  region: "auto",
  endpoint: "https://t3.storage.dev",
  forcePathStyle: false,
});

const bucketName = "uploads-locale";
console.log(`Configuring CORS for bucket: ${bucketName}`);

const command = new PutBucketCorsCommand({
  Bucket: bucketName,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["PUT", "POST", "GET", "DELETE", "HEAD"],
        AllowedOrigins: ["http://localhost:3000"],
        MaxAgeSeconds: 3000,
        ExposeHeaders: ["ETag"]
      },
    ],
  },
});

try {
  const response = await client.send(command);
  console.log("CORS configuration updated successfully.");
} catch (error) {
  console.error("Error updating CORS configuration:", error);
}
