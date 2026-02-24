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
    const sanitizedFilename = file.name
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .substring(0, 200);

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

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload file to S3");

    return `${process.env.NEXT_PUBLIC_S3_URL || "https://t3.storage.dev"}/${
      process.env.NEXT_PUBLIC_S3_BUCKET || "rentledger"
    }/${key}`;
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

      toast.loading("Uploading...");
      const s3Url = await handleFileUpload(file);

      formData.append("fileUrl", s3Url);
      formData.append("fileSize", file.size.toString());
      formData.append("mimeType", file.type);
      formData.append("propertyId", propertyId);

      const result = await uploadDocument(formData);
      toast.dismiss();
      if (result.success) {
        toast.success("Uploaded!");
        setShowForm(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Failed");
      }
    } catch {
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
          <p className="ledger-delete-confirm-text">
            Delete &quot;{docName}&quot;?
          </p>
          <div className="ledger-delete-confirm-actions">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const result = await deleteDocument(docId);
                if (result.success) {
                  toast.success("Deleted!");
                  window.location.reload();
                } else toast.error("Failed");
              }}
              className="ledger-btn ledger-btn--delete-confirm"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ledger-btn ledger-btn--cancel"
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
    <div className="doc-section">
      {/* Header */}
      <div className="doc-header">
        <h2 className="doc-title">Documents</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ledger-btn ledger-btn--add"
        >
          {showForm ? "Cancel" : "+ Upload"}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="doc-upload-form">
          <div className="doc-form-row">
            <div className="doc-form-field">
              <label className="doc-label">Document Name *</label>
              <input
                type="text"
                name="documentName"
                placeholder="e.g., Aadhar Card"
                required
                className="doc-input"
              />
            </div>
            <div className="doc-form-field">
              <label className="doc-label">Description</label>
              <input
                type="text"
                name="description"
                placeholder="Optional notes"
                className="doc-input"
              />
            </div>
            <div className="doc-form-field">
              <label className="doc-label">File *</label>
              <input
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="doc-input doc-input--file"
              />
            </div>
            <button
              type="submit"
              disabled={isUploading}
              className="ledger-btn ledger-btn--save doc-submit-btn"
            >
              {isUploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      <div className="doc-list">
        {initialDocuments.length === 0 ? (
          <div className="bill-empty-state">
            <p className="bill-empty-text">No documents yet</p>
            <p className="bill-empty-sub">
              Upload a PDF or image using the button above
            </p>
          </div>
        ) : (
          initialDocuments.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-body">
                <div className="doc-card-info">
                  <h3 className="doc-name">{doc.documentName}</h3>

                  {doc.category && (
                    <span className="doc-category-badge">{doc.category}</span>
                  )}

                  {doc.description && (
                    <p className="doc-desc">{doc.description}</p>
                  )}

                  <div className="doc-meta">
                    <span>
                      📅 {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                    </span>
                    {doc.fileSize && (
                      <span>📦 {(doc.fileSize / 1024).toFixed(0)} KB</span>
                    )}
                    {doc.tenant && <span>👤 {doc.tenant.fullName}</span>}
                  </div>
                </div>

                <div className="doc-card-actions">
                  <S3FileLink fileUrl={doc.fileUrl}>
                    <span className="ledger-btn ledger-btn--verify">View</span>
                  </S3FileLink>
                  <button
                    onClick={() => handleDelete(doc.id, doc.documentName)}
                    className="ledger-btn ledger-btn--delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Used by upload form if tenancies available */}
      {tenancies.length > 0 && (
        <input type="hidden" name="tenancyCount" value={tenancies.length} />
      )}
    </div>
  );
}
