import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 1️⃣ Create a single Postgres connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Neon pooler requires SSL with relaxed cert validation
  }
});

// 2️⃣ Attach Prisma to the pg pool via adapter
const adapter = new PrismaPg(pool);

// 3️⃣ Prisma client factory (singleton creator)
const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

// 4️⃣ Extend globalThis for hot-reload safety (DEV only)
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

// 5️⃣ Reuse existing client or create a new one
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;
// 6️⃣ Cache the client in development to avoid connection leaks
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
