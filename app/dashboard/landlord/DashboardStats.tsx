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
      icon: "fi fi-rr-house-building",
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      label: "Properties",
      value: propertyCount,
      sub: "Total Active Properties",
    },
    {
      id: "leases",
      icon: "fi fi-rr-document",
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      label: "Active Leases",
      value: activeLeaseCount,
      sub: "Total Active Leases",
    },
    {
      id: "ending",
      icon: "fi fi-sr-hourglass-end",
      iconBg: "#fef9c3",
      iconColor: "#ca8a04",
      label: "Ending Leases",
      value: endingSoonCount,
      sub: "Ending Leases <90 days",
    },
    {
      id: "delinquencies",
      icon: "fi fi-sr-triangle-warning",
      iconBg: "#ede9fe",
      iconColor: "#7c3aed",
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
            <i
              className={s.icon}
              style={{ fontSize: "22px", color: s.iconColor }}
            ></i>
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
