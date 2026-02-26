import db from "@/lib/prisma";
import "./DashboardStats.css";

interface Props {
  landlordId: string;
}

export async function DashboardStats({ landlordId }: Props) {
  const now = new Date();
  const in90Days = new Date();
  in90Days.setDate(now.getDate() + 90);

  const [propertyCount, activeLeaseCount, endingSoonCount, delinquencyCount] =
    await Promise.all([
      // 1. Total properties
      db.property.count({ where: { landlordId } }),

      // 2. Active leases
      db.tenancy.count({
        where: { landlordId, status: "active" },
      }),

      // 3. Active leases ending within 90 days
      db.tenancy.count({
        where: {
          landlordId,
          status: "active",
          leaseEnd: { gte: now, lte: in90Days },
        },
      }),

      // 4. Tenants with outstanding balance (remainingAmount > 0)
      db.bill.count({
        where: {
          landlordId,
          remainingAmount: { gt: 0 },
        },
      }),
    ]);

  const stats = [
    {
      id: "properties",
      icon: "🏠",
      iconBg: "#dbeafe",
      label: "Properties",
      value: propertyCount,
      sub: "Total Active Properties",
    },
    {
      id: "leases",
      icon: "📋",
      iconBg: "#dcfce7",
      label: "Active Leases",
      value: activeLeaseCount,
      sub: "Total Active Leases",
    },
    {
      id: "ending",
      icon: "⏳",
      iconBg: "#fef9c3",
      label: "Ending Leases",
      value: endingSoonCount,
      sub: "Ending Leases <90 days",
    },
    {
      id: "delinquencies",
      icon: "⚠️",
      iconBg: "#ede9fe",
      label: "Delinquencies",
      value: delinquencyCount,
      sub: "Tenant Bills with Balance",
    },
  ];

  return (
    <div className="dstats">
      {stats.map((s) => (
        <div key={s.id} className="dstats-card">
          <div className="dstats-icon" style={{ background: s.iconBg }}>
            {s.icon}
          </div>
          <div className="dstats-info">
            <p className="dstats-label">{s.label}</p>
            <p className="dstats-value">{s.value}</p>
            <p className="dstats-sub">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
