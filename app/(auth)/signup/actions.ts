"use server";

import db from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { FormState, SignupFormSchema } from "@/app/lib/definitions";
import * as jose from "jose";

export async function signupAction(formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      fieldValues: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      },
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      return {
        errors: { email: ["User already exists"] },
        fieldValues: {
          name,
          email,
          password: "",
        },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { name, email, password: hashedPassword },
    });

    const landlord = await db.landlord.create({
      data: {
        userId: user.id,
        name: name,
      },
    });

    await db.userRole.create({
      data: {
        userId: user.id,
        role: "landlord",
        landlordId: landlord.id,
      },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new jose.SignJWT({
      userId: user.id,
      email: user.email,
      role: "landlord",
      landlordId: landlord.id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    (await cookies()).set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2,
    });

    
  } catch (error) {
    console.error("Database error:", error);
    return {
      errors: { email: ["Failed to create account. Please try again."] },
    };
  }
  redirect("/dashboard");
}
