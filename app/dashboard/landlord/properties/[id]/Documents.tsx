"use client";

import { useState } from "react";
import { uploadDocument, deleteDocument } from "./document-actions";
import { toast } from "react-hot-toast";
import { S3FileLink } from "./S3FileLink";

interface Tenant {
  id: string;
  fullName: string;
}

interface Tenancy {
  id: string;
  tenant: Tenant;
}

interface Document {
  id: string;
  documentName: string;
  category: string | null;
  description: string | null;
  fileUrl: string;
  fileSize: number | null;
  uploadedAt: Date;
  tenant?: { fullName: string } | null;
}

interface DocumentsProps {
  propertyId: string;
  initialDocuments: Document[];
  tenancies: Tenancy[];
}

export function Documents({
  propertyId,
  initialDocuments,
  tenancies,
}: DocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleFileUpload = async (file: File): Promise<string> => {
    // Sanitize filename
    const sanitizedFilename = file.name
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .substring(0, 200);

    // Step 1: Get presigned URL from API
    const response = await fetch("/api/s3/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: sanitizedFilename,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { presignedUrl, key } = await response.json();

    // Step 2: Upload file directly to S3
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to S3");
    }

    // Step 3: Construct public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_S3_URL || "https://t3.storage.dev"}/${process.env.NEXT_PUBLIC_S3_BUCKET || "rentledger"}/${key}`;

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const file = formData.get("file") as File;

      if (!file) {
        toast.error("Select a file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large (max 10MB)");
        return;
      }

      console.log("[DEBUG] handleSubmit fired", {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        propertyId,
      });

      toast.loading("Uploading...");
      console.log("[DEBUG] calling handleFileUpload...");
      const s3Url = await handleFileUpload(file);
      console.log("[DEBUG] handleFileUpload returned:", s3Url);

      formData.append("fileUrl", s3Url);
      formData.append("fileSize", file.size.toString());
      formData.append("mimeType", file.type);
      formData.append("propertyId", propertyId);

      console.log("[DEBUG] calling uploadDocument server action...", {
        propertyId,
        s3Url,
      });
      const result = await uploadDocument(formData);
      console.log("[DEBUG] uploadDocument result:", result);

      toast.dismiss();
      if (result.success) {
        toast.success("Uploaded!");
        setShowForm(false);
        window.location.reload();
      } else {
        console.error("[DEBUG] Server action returned error:", result.error);
        toast.error(result.error || "Failed");
      }
    } catch (error) {
      console.error("[DEBUG] CAUGHT ERROR in handleSubmit:", error);
      toast.dismiss();
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    toast(
      (t) => (
        <div>
          <p style={{ marginBottom: "8px", fontWeight: "500" }}>
            Delete &quot;{docName}&quot;?
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const result = await deleteDocument(docId);
                if (result.success) {
                  toast.success("Deleted!");
                  window.location.reload();
                } else {
                  toast.error("Failed");
                }
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000 },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documents</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Upload"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border rounded-lg p-4 bg-white"
        >
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Document Name *
              </label>
              <input
                type="text"
                name="documentName"
                placeholder="e.g., Aadhar Card"
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                placeholder="Optional notes"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">File *</label>
              <input
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {initialDocuments.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-gray-500 bg-white">
            No documents yet
          </div>
        ) : (
          initialDocuments.map((doc) => (
            <div
              key={doc.id}
              className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{doc.documentName}</h3>

                  {doc.category && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mt-1">
                      {doc.category}
                    </span>
                  )}

                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      📅 {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                    {doc.fileSize && (
                      <span>📦 {(doc.fileSize / 1024).toFixed(0)} KB</span>
                    )}
                    {doc.tenant && <span>👤 {doc.tenant.fullName}</span>}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <S3FileLink fileUrl={doc.fileUrl}>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 inline-block">
                      View
                    </span>
                  </S3FileLink>
                  <button
                    onClick={() => handleDelete(doc.id, doc.documentName)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
