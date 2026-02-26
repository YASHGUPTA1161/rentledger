// d:/rentledger/app/dashboard/layout.tsx
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import db from "@/lib/prisma";
import { DashboardNav } from "./components/DashboardNav";
import { withCache, CacheKeys, TTL } from "@/lib/cache";

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
  const userImage = (payload.image as string | null) ?? null;

  // ── Cached queries (falls back to DB if Redis is down) ───────────────────
  const user = await withCache(CacheKeys.user(userId), TTL.user, () =>
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
  );

  const unreadCount = await withCache(
    CacheKeys.unread(userId),
    TTL.unread,
    () => db.notification.count({ where: { userId, read: false } }),
  );

  // Only fetch tenants for landlord — used in notification popup
  let tenants: { id: string; fullName: string }[] = [];
  let defaultCurrency = "INR";
  if (role === "landlord") {
    const landlordId = payload.landlordId as string;
    tenants = await withCache(CacheKeys.tenants(landlordId), TTL.tenants, () =>
      db.tenant.findMany({
        where: { landlordId },
        select: { id: true, fullName: true },
      }),
    );
    const landlord = await db.landlord.findUnique({
      where: { id: landlordId },
      select: { defaultCurrency: true },
    });
    defaultCurrency = landlord?.defaultCurrency ?? "INR";
  }

  return (
    <div className="page-background">
      <DashboardNav
        userName={user?.name ?? user?.email ?? "User"}
        userEmail={user?.email ?? undefined}
        userImage={userImage ?? undefined}
        role={role}
        unreadCount={unreadCount}
        tenants={tenants}
        currency={defaultCurrency}
      />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
