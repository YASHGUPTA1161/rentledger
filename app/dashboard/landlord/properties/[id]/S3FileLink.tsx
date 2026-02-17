"use client";

import { useState } from "react";

/**
 * S3FileLink Component
 *
 * Handles viewing S3 files with presigned URLs
 * WHY: S3 bucket is private, need signed URLs for access
 *
 * FLOW:
 *   User clicks link
 *     ↓
 *   Fetch presigned URL from /api/s3/view
 *     ↓
 *   Open presigned URL in new tab
 */
export function S3FileLink({
  fileUrl,
  children = "📷 View",
}: {
  fileUrl: string;
  children?: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Extract key from S3 URL
    // URL format: https://t3.storage.dev/rentledger/key-here.pdf
    const urlParts = fileUrl.split("/");
    const key = urlParts[urlParts.length - 1];

    if (!key) {
      alert("Invalid file URL");
      return;
    }

    setIsLoading(true);

    try {
      // Get presigned URL for viewing
      const response = await fetch(
        `/api/s3/view?key=${encodeURIComponent(key)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to get view URL");
      }

      const { url } = await response.json();

      // Open file in new tab
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error viewing file:", error);
      alert("Failed to open file");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      style={{
        cursor: isLoading ? "wait" : "pointer",
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? "Loading..." : children}
    </a>
  );
}
