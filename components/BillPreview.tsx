"use client";

import { useEffect, useState, useRef } from "react";
import { activeBillTemplate } from "@/config/bill-template";
import type { BillData } from "@/lib/generate-bill-data";

interface BillPreviewProps {
  billId: string;
  billData: BillData;
  onClose: () => void;
}

export function BillPreview({ billId, billData, onClose }: BillPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);
  const template = activeBillTemplate;

  // Format value based on type
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return "-";

    switch (format) {
      case "currency":
        return `₹${value.toLocaleString("en-IN")}`;
      case "date":
        return new Date(value).toLocaleDateString("en-IN");
      case "phone":
        return value || "-";
      case "email":
        return value || "-";
      default:
        return value || "-";
    }
  };

  // Get nested value from object using path
  const getValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Download as PDF
  const handleDownload = async () => {
    if (!billRef.current) return;

    setIsDownloading(true);

    try {
      // Dynamically import libraries
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Convert to canvas
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      // Convert to PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Download
      const fileName = `bill-${billData.bill.period.replace(" ", "-")}-${billData.property.address.substring(0, 20)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Bill Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Bill Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <div
            ref={billRef}
            style={{
              fontFamily: template.styling.fonts.body,
              color: template.styling.colors.text,
              padding: template.styling.spacing.padding,
              backgroundColor: "#ffffff",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                textAlign: "center",
                marginBottom: template.styling.spacing.gap,
              }}
            >
              {template.header.showReceiptNumber && (
                <div
                  style={{
                    fontSize: template.styling.fonts.size.body,
                    color: template.styling.colors.secondary,
                  }}
                >
                  Receipt {billData.bill.receiptNumber}
                </div>
              )}
              <h1
                style={{
                  fontFamily: template.styling.fonts.title,
                  fontSize: template.styling.fonts.size.title,
                  color: template.styling.colors.primary,
                  margin: "8px 0",
                }}
              >
                {template.header.title}
              </h1>
              {template.header.showDate && (
                <div
                  style={{
                    fontSize: template.styling.fonts.size.body,
                    color: template.styling.colors.secondary,
                  }}
                >
                  {billData.bill.date}
                </div>
              )}
            </div>

            {/* SECTIONS */}
            {template.sections.map((section) => (
              <div
                key={section.id}
                style={{
                  marginBottom: template.styling.spacing.gap,
                  paddingBottom: section.showDivider ? "12px" : "0",
                  borderBottom: section.showDivider
                    ? `1px solid ${template.styling.colors.border}`
                    : "none",
                }}
              >
                {section.title && (
                  <h2
                    style={{
                      fontSize: template.styling.fonts.size.heading,
                      fontWeight: "bold",
                      marginBottom: "8px",
                      color: template.styling.colors.primary,
                    }}
                  >
                    {section.title}
                  </h2>
                )}

                {section.fields.map((field) => {
                  const value = getValue(billData, field.dataKey);
                  const formattedValue = formatValue(value, field.format);

                  return (
                    <div
                      key={field.dataKey}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0",
                        fontSize: template.styling.fonts.size.body,
                      }}
                    >
                      {field.showLabel && (
                        <span
                          style={{ color: template.styling.colors.secondary }}
                        >
                          {field.label}:
                        </span>
                      )}
                      <span
                        style={{
                          fontWeight:
                            field.format === "currency" ? "600" : "normal",
                        }}
                      >
                        {formattedValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* FOOTER */}
            {template.footer.showSignature && (
              <div
                style={{
                  marginTop: "32px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${template.styling.colors.border}`,
                }}
              >
                <div
                  style={{
                    textAlign: "right",
                    fontSize: template.styling.fonts.size.body,
                  }}
                >
                  <div style={{ marginBottom: "40px" }}>Landlord Signature</div>
                  <div
                    style={{
                      borderBottom: `1px solid ${template.styling.colors.text}`,
                      width: "200px",
                      marginLeft: "auto",
                    }}
                  ></div>
                </div>
              </div>
            )}

            {template.footer.customText && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "16px",
                  fontSize: template.styling.fonts.size.small,
                  color: template.styling.colors.secondary,
                }}
              >
                {template.footer.customText}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isDownloading ? "Downloading..." : "📄 Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
