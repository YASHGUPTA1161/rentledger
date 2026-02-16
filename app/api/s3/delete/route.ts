import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";
import { z } from "zod";

const deleteRequestSchema = z.object({
  key: z.string(),
});

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const validation = deleteRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { key } = validation.data;

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME ?? "rentledger",
      Key: key,
    });

    await S3.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
