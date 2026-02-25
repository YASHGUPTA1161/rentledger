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
  currency?: string;
  activeTenancy: Record<string, unknown> | null;
  bills: Record<string, unknown>[];
  documents: Document[];
  tenancies: Tenancy[];
  maintenanceRequests: Record<string, unknown>[];
  activityLogs: Record<string, unknown>[];
}

export function PropertyTabs({
  propertyId,
  currency = "INR",
  activeTenancy,
  bills,
  documents,
  tenancies,
  maintenanceRequests,
  activityLogs,
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
    <div className="property-layout">
      {/* Sidebar */}
      <div className="property-sidebar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`property-tab ${
              activeTab === tab.id
                ? "property-tab--active"
                : "property-tab--idle"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="property-content">
        {activeTab === "overview" && (
          <Overview
            propertyId={propertyId}
            currency={currency}
            activeTenancy={activeTenancy}
            bills={bills}
            documents={documents as unknown as Record<string, unknown>[]}
            maintenanceRequests={maintenanceRequests}
            activityLogs={activityLogs}
          />
        )}
        {activeTab === "tenancy" && (
          <Tenancy propertyId={propertyId} activeTenancy={activeTenancy} />
        )}
        {activeTab === "bills" && (
          <BillsLedger
            propertyId={propertyId}
            tenancyId={(activeTenancy?.id as string) || ""}
            currency={currency}
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
        {activeTab === "maintenance" && (
          <Maintenance
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
