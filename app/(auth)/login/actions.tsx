"use server";

import db from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { FormState, LoginFormSchema } from "@/app/lib/definitions";
import * as jose from "jose";

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

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return {
        errors: { email: ["Invalid email or password"] },
        fieldValues: { email, password: "" },
      };
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: "user",
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
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours (match JWT expiry)
    });

    return { message: "Login successful" };
  } catch (error) {
    console.error("Login error: ", error);
    return {
      errors: { email: ["An unexpected error occurred. Please try again."] },
      fieldValues: { email, password: "" },
    };
  }
}
