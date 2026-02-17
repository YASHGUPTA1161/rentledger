import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing key parameter" },
        { status: 400 },
      );
    }

    // Generate presigned GET URL for viewing the file
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME ?? "rentledger",
      Key: key,
    });

    const presignedUrl = await getSignedUrl(S3 as any, command as any, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    return NextResponse.json({
      success: true,
      url: presignedUrl,
    });
  } catch (error) {
    console.error("S3 Get URL Error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 },
    );
  }
}
