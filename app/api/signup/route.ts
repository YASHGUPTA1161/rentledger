import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { SignupFormSchema } from "@/app/lib/definitions";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const body = await request.json();
  const validation = SignupFormSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const { name, email, password } = validation.data;
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    },
    { status: 201 },
  );
}
