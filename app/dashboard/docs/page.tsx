import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { DocsContent } from "./DocsContent";
import { docsSections } from "./docsData";

export default async function DocsPage() {
  const token = (await cookies()).get("session")?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token!, secret);
  const role = payload.role as string;

  // Filter sections to those relevant to this user's role
  const sections = docsSections.filter(
    (s) => s.forRole === "both" || s.forRole === role,
  );

  return <DocsContent sections={sections} role={role} />;
}
