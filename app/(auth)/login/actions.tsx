"use server";

import db from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { FormState, LoginFormSchema } from "@/app/lib/definitions";

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
    (await cookies()).set("session", String(user.id), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
