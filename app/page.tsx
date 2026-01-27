import prisma from "@/lib/db";

export default async function Home() {
  const properties = await prisma.property.findMany();
  return <pre>{JSON.stringify(properties, null, 2)}</pre>;
}
