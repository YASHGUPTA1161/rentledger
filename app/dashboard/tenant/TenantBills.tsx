"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { verifyPayment, verifyLedgerEntry } from "./tenant-actions";
// Reuse landlord's LedgerTable — it's a read-only display component
import {
  LedgerTable,
  SerializedLedgerEntry,
} from "@/app/dashboard/landlord/properties/[id]/LedgerTable";
import { BillPreview } from "@/components/BillPreview";
import { getBillPreviewData } from "@/app/dashboard/landlord/properties/[id]/bill-preview-actions";
import type { BillData } from "@/lib/generate-bill-data";

interface TenantBillsProps {
  propertyId: string;
  tenancyId: string;
  bills: Record<string, unknown>[];
}

export function TenantBills({
  propertyId,
  tenancyId,
  bills,
}: TenantBillsProps) {
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [previewBillId, setPreviewBillId] = useState<string | null>(null);
  const [previewBillData, setPreviewBillData] = useState<BillData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleVerify = async (paymentId: string) => {
    setVerifyingId(paymentId);
    const result = await verifyPayment(paymentId);
    if (result.success) {
      toast.success("Payment verified!", { position: "bottom-right" });
    } else {
      toast.error(result.error || "Failed to verify", {
        position: "bottom-right",
      });
    }
    setVerifyingId(null);
  };

  const handlePreviewBill = async (billId: string) => {
    setIsLoadingPreview(true);
    setPreviewBillId(billId);

    const result = await getBillPreviewData(billId);

    if (result.success && result.data) {
      setPreviewBillData(result.data);
    } else {
      toast.error("Could not load bill preview", { position: "bottom-right" });
      setPreviewBillId(null);
    }

    setIsLoadingPreview(false);
  };

  const handleClosePreview = () => {
    setPreviewBillId(null);
    setPreviewBillData(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bills & Ledger</h2>

      {/* Bill Preview Modal */}
      {previewBillId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleClosePreview}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              borderRadius: "12px",
            }}
          >
            {isLoadingPreview ? (
              <div
                style={{
                  background: "#fff",
                  padding: "40px",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                Loading preview...
              </div>
            ) : previewBillData ? (
              <BillPreview
                billId={previewBillId}
                billData={previewBillData}
                onClose={handleClosePreview}
              />
            ) : null}
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <div
          className="border rounded-lg p-8 bg-white shadow-sm text-center"
          style={{ color: "#6b7280" }}
        >
          <p className="text-lg mb-2">No bills yet</p>
          <p className="text-sm">
            Your landlord hasn&apos;t created any bills for your tenancy yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(bills as Record<string, unknown>[]).map((bill) => {
            const billId = bill.id as string;
            const isExpanded = expandedBillId === billId;
            const month = new Date(bill.month as string).toLocaleDateString(
              "en-IN",
              { month: "long", year: "numeric" },
            );
            const status = bill.status as string;
            const totalBill = bill.totalBill as number;
            const paidAmount = bill.paidAmount as number;
            const remainingAmount = bill.remainingAmount as number;
            const payments = bill.payments as Record<string, unknown>[];

            const statusColors: Record<
              string,
              { bg: string; text: string; label: string }
            > = {
              unpaid: { bg: "#fef2f2", text: "#dc2626", label: "Unpaid" },
              partial: {
                bg: "#fffbeb",
                text: "#d97706",
                label: "Partial",
              },
              paid: { bg: "#ecfdf5", text: "#059669", label: "Paid" },
              overdue: { bg: "#fef2f2", text: "#dc2626", label: "Overdue" },
            };
            const statusStyle = statusColors[status] || statusColors.unpaid;

            return (
              <div
                key={billId}
                className="border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                {/* Bill Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedBillId(isExpanded ? null : billId)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-lg">{month}</p>
                      <p className="text-sm text-gray-500">
                        Due:{" "}
                        {new Date(bill.dueDate as string).toLocaleDateString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                    <span
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold">₹{totalBill.toLocaleString()}</p>
                    </div>
                    {remainingAmount > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Due</p>
                        <p className="font-bold" style={{ color: "#dc2626" }}>
                          ₹{remainingAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewBill(billId);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      📄 Preview
                    </button>
                    <span style={{ fontSize: "1.2rem", color: "#9ca3af" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded: Payments + Ledger */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      padding: "16px",
                    }}
                  >
                    {/* Payments Section */}
                    {payments && payments.length > 0 && (
                      <div style={{ marginBottom: "20px" }}>
                        <h4
                          style={{
                            fontWeight: 600,
                            marginBottom: "8px",
                            fontSize: "0.9rem",
                          }}
                        >
                          💳 Payments ({payments.length})
                        </h4>
                        <div className="space-y-2">
                          {payments.map((payment) => {
                            const paymentId = payment.id as string;
                            const verified =
                              payment.verifiedByTenant as boolean;
                            return (
                              <div
                                key={paymentId}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 14px",
                                  background: "#f9fafb",
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                <div>
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      marginRight: "12px",
                                    }}
                                  >
                                    ₹
                                    {(
                                      payment.amount as number
                                    ).toLocaleString()}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#6b7280",
                                    }}
                                  >
                                    {new Date(
                                      payment.paidAt as string,
                                    ).toLocaleDateString("en-IN")}
                                    {payment.paymentMethod
                                      ? ` • ${String(payment.paymentMethod)}`
                                      : ""}
                                  </span>
                                </div>
                                <div>
                                  {verified ? (
                                    <span
                                      style={{
                                        color: "#059669",
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ✅ Verified
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleVerify(paymentId)}
                                      disabled={verifyingId === paymentId}
                                      style={{
                                        padding: "4px 12px",
                                        background: "#eff6ff",
                                        color: "#2563eb",
                                        border: "1px solid #93c5fd",
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {verifyingId === paymentId
                                        ? "Verifying..."
                                        : "✓ Verify"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Ledger Table — reused from landlord */}
                    <LedgerTable
                      tenancyId={tenancyId}
                      billId={billId}
                      entries={
                        bill.ledgerEntries as unknown as SerializedLedgerEntry[]
                      }
                      isLandlord={false}
                      onVerify={async (entryId: string) => {
                        const result = await verifyLedgerEntry(entryId);
                        if (result.success) {
                          toast.success(
                            "Entry verified! Landlord can no longer edit this.",
                          );
                        } else {
                          toast.error(result.error || "Failed to verify");
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
