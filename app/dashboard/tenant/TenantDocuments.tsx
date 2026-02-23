"use client";

import { useState } from "react";
import { uploadTenantDocument } from "./tenant-actions";
import { toast } from "react-hot-toast";

interface TenantDocumentsProps {
  propertyId: string;
  documents: Record<string, unknown>[];
}

export function TenantDocuments({
  propertyId,
  documents,
}: TenantDocumentsProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // S3 file upload handler — 2-step: get presigned URL → PUT to S3 directly
  const handleFileUpload = async (file: File): Promise<string> => {
    const sanitizedFilename = file.name
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .substring(0, 200);

    // Step 1: Get presigned PUT URL from our API
    const res = await fetch("/api/s3/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: sanitizedFilename,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!res.ok) throw new Error("Failed to get upload URL");

    const { presignedUrl, key } = await res.json();

    // Step 2: PUT file directly to S3 using the presigned URL
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) throw new Error("Failed to upload to S3");

    // Step 3: Return the public view URL via our signed view endpoint
    return `/api/s3/view?key=${encodeURIComponent(key)}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const form = e.currentTarget;
    const formDataObj = new FormData(form);
    const fileInput = form.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      toast.error("Please select a file", { position: "bottom-right" });
      setIsUploading(false);
      return;
    }

    try {
      // Upload file to S3 first
      const fileUrl = await handleFileUpload(file);

      // Then save document record
      const submitData = new FormData();
      submitData.set("propertyId", propertyId);
      submitData.set(
        "documentName",
        (formDataObj.get("documentName") as string) || file.name,
      );
      submitData.set("category", (formDataObj.get("category") as string) || "");
      submitData.set(
        "description",
        (formDataObj.get("description") as string) || "",
      );
      submitData.set("fileUrl", fileUrl);
      submitData.set("fileSize", file.size.toString());
      submitData.set("mimeType", file.type);

      const result = await uploadTenantDocument(submitData);

      if (result.success) {
        toast.success("Document uploaded!", { position: "bottom-right" });
        setShowUploadForm(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to upload", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file", { position: "bottom-right" });
    }

    setIsUploading(false);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documents</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          style={{
            padding: "8px 16px",
            background: showUploadForm ? "#f3f4f6" : "#2563eb",
            color: showUploadForm ? "#374151" : "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {showUploadForm ? "Cancel" : "📤 Upload Document"}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
          }}
          className="space-y-4"
        >
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Document Name *
            </label>
            <input
              name="documentName"
              required
              placeholder="e.g. Rent Receipt, ID Proof..."
              className="w-full border rounded-lg px-3 py-2"
              style={{ borderColor: "#d1d5db" }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Category
            </label>
            <select
              name="category"
              className="w-full border rounded-lg px-3 py-2"
              style={{ borderColor: "#d1d5db" }}
            >
              <option value="">Select category</option>
              <option value="ID Proof">ID Proof</option>
              <option value="Rent Receipt">Rent Receipt</option>
              <option value="Agreement">Agreement</option>
              <option value="Police Verification">Police Verification</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Description
            </label>
            <input
              name="description"
              placeholder="Optional description..."
              className="w-full border rounded-lg px-3 py-2"
              style={{ borderColor: "#d1d5db" }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              File *
            </label>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full border rounded-lg px-3 py-2"
              style={{ borderColor: "#d1d5db" }}
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            style={{
              padding: "10px 20px",
              background: isUploading ? "#9ca3af" : "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: isUploading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div
          className="border rounded-lg p-8 bg-white shadow-sm text-center"
          style={{ color: "#6b7280" }}
        >
          <p className="text-lg mb-2">No documents yet</p>
          <p className="text-sm">
            Upload documents like ID proof, rent receipts, or agreements.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id as string}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                  📄 {doc.documentName as string}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    margin: "2px 0 0",
                  }}
                >
                  {doc.category ? `${String(doc.category)} • ` : ""}
                  {formatFileSize(doc.fileSize as number | null)} •{" "}
                  {new Date(doc.uploadedAt as string).toLocaleDateString(
                    "en-IN",
                  )}
                </p>
              </div>
              <a
                href={doc.fileUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "6px 12px",
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  color: "#374151",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
