"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createBill, addPayment } from "./bills-actions";
import { getBillPreviewData } from "./bill-preview-actions";
import { LedgerTable } from "./LedgerTable";
import { BillPreview } from "@/components/BillPreview";
import { formatCurrency } from "@/lib/formatCurrency";
import type { BillData } from "@/lib/generate-bill-data";

interface BillsLedgerProps {
  propertyId: string;
  tenancyId: string;
  currency?: string;
  bills: any[]; // serialized bill objects from page.tsx
}

export function BillsLedger({
  propertyId,
  tenancyId,
  currency = "INR",
  bills,
}: BillsLedgerProps) {
  const [previewBillId, setPreviewBillId] = useState<string | null>(null);
  const [previewBillData, setPreviewBillData] = useState<BillData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePreviewBill = async (billId: string) => {
    setIsLoadingPreview(true);
    setPreviewBillId(billId);

    const result = await getBillPreviewData(billId);

    if (result.success && result.data) {
      setPreviewBillData(result.data);
    } else {
      console.error("Failed to load bill preview:", result.error);
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

      {/* BILLS LIST */}
      <div className="space-y-4">
        {bills.length === 0 ? (
          /* EMPTY STATE - No bills yet */
          <div className="bill-empty-state">
            <div className="mb-6">
              <p className="bill-empty-text">No bills yet for this tenancy</p>
              <p className="bill-empty-sub">
                Add your first entry below to automatically create a bill for
                this month
              </p>
            </div>

            {/* Show ledger table even with no bills - it will auto-create */}
            <LedgerTable
              tenancyId={tenancyId}
              billId="" // Empty for now, will auto-create on first entry
              entries={[]}
              isLandlord={true}
            />
          </div>
        ) : (
          /* EXISTING BILLS */
          bills.map((bill) => (
            <div key={bill.id} className="bill-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {new Date(bill.month).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="bill-due">
                    Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    bill.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : bill.status === "partial"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {bill.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="bill-field-label">Rent</p>
                  <p className="bill-field-value">
                    {formatCurrency(bill.rent, currency)}
                  </p>
                </div>
                <div>
                  <p className="bill-field-label">Electricity</p>
                  <p className="bill-field-value">
                    {bill.electricityUnits ?? 0} units ×{" "}
                    {formatCurrency(bill.electricityRate ?? 0, currency)} ={" "}
                    {formatCurrency(bill.electricityTotal ?? 0, currency)}
                  </p>
                </div>
                <div>
                  <p className="bill-field-label">Water</p>
                  <p className="bill-field-value">
                    {formatCurrency(bill.waterBill ?? 0, currency)}
                  </p>
                </div>
                <div>
                  <p className="bill-field-label">
                    {bill.carryForward > 0
                      ? "⚠ Debt Carried"
                      : bill.carryForward < 0
                        ? "✓ Credit Carried"
                        : "Carry Forward"}
                  </p>
                  <p
                    className="bill-field-value"
                    style={{
                      color:
                        bill.carryForward > 0
                          ? "#f87171"
                          : bill.carryForward < 0
                            ? "#4ade80"
                            : undefined,
                    }}
                  >
                    {bill.carryForward > 0 ? "+" : ""}
                    {formatCurrency(bill.carryForward, currency)}
                  </p>
                </div>
              </div>

              <div className="bill-totals-row">
                <div>
                  <p className="bill-field-label">Total</p>
                  <p className="bill-total-value">
                    {formatCurrency(bill.totalBill, currency)}
                  </p>
                </div>
                <div>
                  <p className="bill-field-label">Paid</p>
                  <p className="bill-total-value bill-total-value--paid">
                    {formatCurrency(bill.paidAmount, currency)}
                  </p>
                </div>
                <div>
                  <p className="bill-field-label">Remaining</p>
                  <p
                    className={`bill-total-value ${
                      bill.remainingAmount < 0
                        ? "bill-total-value--paid" // green — overpaid
                        : bill.remainingAmount > 0
                          ? "bill-total-value--remaining" // red   — underpaid
                          : "" // white — exactly paid
                    }`}
                  >
                    {bill.remainingAmount < 0 && "Overpaid: "}
                    {formatCurrency(bill.remainingAmount, currency)}
                  </p>
                </div>
              </div>

              {/* PAYMENTS LIST */}
              {bill.payments && bill.payments.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Payments:</h4>
                  {bill.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center py-2"
                    >
                      <div>
                        <span className="font-medium">
                          {new Date(payment.paidAt).toLocaleDateString("en-IN")}
                        </span>
                        {" - "}₹{payment.amount.toLocaleString()} (
                        {payment.paymentMethod})
                        {payment.verifiedByTenant && (
                          <span className="ml-2 text-green-600 text-sm">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      {payment.paymentProof && (
                        <a
                          href={payment.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Screenshot
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* LEDGER TABLE — horizontal scroll for many columns */}
              <div className="bill-ledger-wrap">
                <LedgerTable
                  tenancyId={tenancyId}
                  billId={bill.id}
                  entries={bill.ledgerEntries || []}
                  isLandlord={true}
                  currency={currency}
                />
              </div>

              {/* PREVIEW BILL BUTTON */}
              <button
                onClick={() => handlePreviewBill(bill.id)}
                disabled={isLoadingPreview && previewBillId === bill.id}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoadingPreview && previewBillId === bill.id
                  ? "Loading..."
                  : "📄 Preview Bill"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* BILL PREVIEW MODAL */}
      {previewBillId && previewBillData && (
        <BillPreview
          billId={previewBillId}
          billData={previewBillData}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
