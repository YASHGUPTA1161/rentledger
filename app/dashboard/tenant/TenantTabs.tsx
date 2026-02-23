"use client";

import { useState } from "react";
import { TenantBills } from "./TenantBills";
import { TenantDocuments } from "./TenantDocuments";
import { TenantMaintenance } from "./TenantMaintenance";
// Reuse the landlord's ActivityLog — it's a pure read-only display component
import { ActivityLog } from "@/app/dashboard/landlord/properties/[id]/ActivityLog";

interface TenantTabsProps {
  propertyId: string;
  tenancyId: string;
  tenancy: Record<string, unknown>;
  bills: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  maintenanceRequests: Record<string, unknown>[];
  activityLogs: Record<string, unknown>[];
}

export function TenantTabs({
  propertyId,
  tenancyId,
  tenancy,
  bills,
  documents,
  maintenanceRequests,
  activityLogs,
}: TenantTabsProps) {
  const [activeTab, setActiveTab] = useState("bills");

  const tabs = [
    { id: "bills", label: "Bills & Ledger", icon: "💰" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "maintenance", label: "Issues", icon: "🔧" },
    { id: "activity", label: "Activity Log", icon: "📝" },
  ];

  return (
    <div className="flex gap-6" style={{ marginTop: "2rem" }}>
      {/* Sidebar */}
      <div className="w-64 border-r pr-6">
        {/* Tenancy Info Card */}
        <div
          style={{
            background: "#f0fdf4",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            border: "1px solid #bbf7d0",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "#15803d",
              fontWeight: 600,
            }}
          >
            ACTIVE TENANCY
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.875rem",
              color: "#166534",
            }}
          >
            Rent: ₹{(tenancy.monthlyRent as number).toLocaleString()}/mo
          </p>
        </div>

        {/* Tab Buttons */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-3 rounded mb-2 flex items-center gap-3 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "bills" && (
          <TenantBills
            propertyId={propertyId}
            tenancyId={tenancyId}
            bills={bills}
          />
        )}
        {activeTab === "documents" && (
          <TenantDocuments propertyId={propertyId} documents={documents} />
        )}
        {activeTab === "maintenance" && (
          <TenantMaintenance
            propertyId={propertyId}
            maintenanceRequests={maintenanceRequests as never[]}
          />
        )}
        {activeTab === "activity" && (
          <ActivityLog
            propertyId={propertyId}
            activityLogs={activityLogs as never[]}
          />
        )}
      </div>
    </div>
  );
}
