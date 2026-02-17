"use client";

import { useState } from "react";
import { Overview } from "./Overview";
import { Tenancy } from "./Tenancy";
import { BillsLedger } from "./BillsLedger";
import { Documents } from "./Documents";
import { Maintenance } from "./Maintenance";
import { ActivityLog } from "./ActivityLog";

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

interface PropertyTabsProps {
  propertyId: string;
  activeTenancy: Record<string, unknown> | null;
  bills: Record<string, unknown>[];
  documents: Document[];
  tenancies: Tenancy[];
}

export function PropertyTabs({
  propertyId,
  activeTenancy,
  bills,
  documents,
  tenancies,
}: PropertyTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "tenancy", label: "Tenancy", icon: "👤" },
    { id: "bills", label: "Bills & Ledger", icon: "💰" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "maintenance", label: "Maintenance", icon: "🔧" },
    { id: "activity", label: "Activity Log", icon: "📝" },
  ];

  return (
    <div className="flex gap-6" style={{ marginTop: "2rem" }}>
      {/* Sidebar */}
      <div className="w-64 border-r pr-6">
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
        {activeTab === "overview" && <Overview propertyId={propertyId} />}
        {activeTab === "tenancy" && (
          <Tenancy propertyId={propertyId} activeTenancy={activeTenancy} />
        )}
        {activeTab === "bills" && (
          <BillsLedger
            propertyId={propertyId}
            tenancyId={(activeTenancy?.id as string) || ""}
            bills={bills}
          />
        )}
        {activeTab === "documents" && (
          <Documents
            propertyId={propertyId}
            initialDocuments={documents}
            tenancies={tenancies}
          />
        )}
        {activeTab === "maintenance" && <Maintenance propertyId={propertyId} />}
        {activeTab === "activity" && <ActivityLog propertyId={propertyId} />}
      </div>
    </div>
  );
}
