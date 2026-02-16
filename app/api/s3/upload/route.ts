import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import { z } from "zod";

const uploeadRequestSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Filename can only contain letters, numbers, dots, underscores, and hyphens"
    ),
  contentType: z
    .string()
    .refine(
      (type) => [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
      ].includes(type),
      "Invalid file type. Only images, PDFs, and text files are allowed"
    ),
  size: z
    .number()
    .positive("File size must be positive")
    .max(10 * 1024 * 1024, "File size must be less than 10MB"),
});


export async function POST(request: Request) {
  
  try {
    const body = await request.json();
    const validation = uploeadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { filename, contentType, size } = validation.data;

    const uniqueKey = `${uuidv4()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME ?? "rentledger",
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(S3 as any, command as any, {
      expiresIn: 360, // URL expires in 6 minutes
    });

    return NextResponse.json({
      success: true,
      presignedUrl,
      key: uniqueKey,
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
