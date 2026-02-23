"use server";

import db from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { FormState, LoginFormSchema } from "@/app/lib/definitions";
import * as jose from "jose";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData): Promise<FormState> {
  const validationResult = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
      fieldValues: {
        email: formData.get("email") as string,
        password: "",
      },
    };
  }

  const { email, password } = validationResult.data;
  try {
    const user = await db.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return {
        errors: { email: ["Invalid email or password"] },
        fieldValues: { email, password: "" },
      };
    }

    const userRole = await db.userRole.findFirst({
      where: { userId: user.id },
      include: { landlord: true },
    });

    if (!userRole) {
      return {
        errors: {
          email: ["User role not found. Please contact support."],
        },
        fieldValues: { email, password: "" },
      };
    }

    // If tenant role, look up the Tenant record to get tenantId for JWT
    let tenantId: string | undefined;
    if (userRole.role === "tenant") {
      const tenant = await db.tenant.findFirst({
        where: { userId: user.id },
      });
      tenantId = tenant?.id;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: userRole.role,
      landlordId: userRole.landlordId,
      tenantId, // undefined for landlords, set for tenants
    };

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h") // Match this with route.ts
      .sign(secret);
    // Now store the JWT token (not user.id)
    (await cookies()).set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours (match JWT expiry)
    });
    if (userRole.role === "tenant") {
      redirect("/dashboard/tenant");
    }
    redirect("/dashboard/landlord");
  } catch (error) {
    // redirect() throws NEXT_REDIRECT — must re-throw so Next.js handles it
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Login error: ", error);
    return {
      errors: { email: ["An unexpected error occurred. Please try again."] },
      fieldValues: { email, password: "" },
    };
  }
}
