// d:/rentledger/app/dashboard/layout.tsx
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import db from "@/lib/prisma";
import { DashboardNav } from "./components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("session")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token!, secret);

  const userId = payload.userId as string;
  const role = payload.role as string;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const unreadCount = await db.notification.count({
    where: { userId, read: false },
  });

  // Only fetch tenants for landlord — used in notification popup
  let tenants: { id: string; fullName: string }[] = [];
  if (role === "landlord") {
    const landlordId = payload.landlordId as string;
    tenants = await db.tenant.findMany({
      where: { landlordId },
      select: { id: true, fullName: true },
    });
  }

  return (
    <div className="dashboard-shell">
      <DashboardNav
        userName={user?.name ?? user?.email ?? "User"}
        role={role}
        unreadCount={unreadCount}
        tenants={tenants}
      />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
