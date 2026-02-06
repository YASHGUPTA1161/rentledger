"use server";

import db from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { FormState, SignupFormSchema } from "@/app/lib/definitions";

export async function signupAction(
  formData: FormData
): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors:
       validatedFields.error.flatten().fieldErrors,
       fieldValues: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
       }
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      return { errors: { email: ["User already exists"] },
      fieldValues: {
        name, 
        email,
        password: ""
      }
    };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { name, email, password: hashedPassword },
    });

    (await cookies()).set("session", String(user.id), {
      httpOnly: true,
      path: "/",
    });

    return { message: "Account created successfully!" };
  } catch (error) {
    console.error("Database error:", error);
    return {
      errors: { email: ["Failed to create account. Please try again."] },
    };
  }
}