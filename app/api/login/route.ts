import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import bcrypt from "bcrypt";
import { LoginFormSchema } from "@/app/lib/definitions";
import * as jose from "jose";

export async function POST(request: Request) {
  try {
    // ----------------------------------
    // -----------------------
    // 1. RECEIVE: Read the JSON envelope
    // ---------------------------------------------------------
    // 'request.json()' parses the incoming body text into a JS object.
    const body = await request.json();

    // ---------------------------------------------------------
    // 2. VALIDATE: Ensure data is clean (Using Zod)
    // ---------------------------------------------------------
    const validation = LoginFormSchema.safeParse(body);

    if (!validation.success) {
      // NextResponse.json() creates a structured HTTP response
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }, // 400 = Bad Request (Client's fault)
      );
    }

    const { email, password } = validation.data;

    // ---------------------------------------------------------
    // 3. LOOKUP: Does this user exist?
    // ---------------------------------------------------------
    const user = await db.user.findUnique({
      where: { email },
    });

    // ---------------------------------------------------------
    // 4. VERIFY: Check password hash
    // ---------------------------------------------------------
    // We check BOTH:
    // A) Does user exist? (!user)
    // B) Does password match? (bcrypt.compare)
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }, // 401 = Unauthorized
      );
    }
    // 1. Prepare the Payload (What's inside the wristband)
    const payload = {
      userId: user.id,
      email: user.email,
      role: "user", // Optional
    };
    // 2. Prepare the Secret (Convert string to Bytes)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    // 3. Sign it! (The Magic)
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" }) // Use Standard Algorithm
      .setIssuedAt() // "Created Now"
      .setExpirationTime("2h") // "Valid for 2 hours"
      .sign(secret);

    // ---------------------------------------------------------
    // 5. RESPOND: Success!
    // ---------------------------------------------------------
    // In a real app, 'token' would be a generated JWT string.
    // For learning, we return a hardcoded string.
    return NextResponse.json(
      {
        success: true,
        message: "Logged in successfully",
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
      { status: 200 }, // 200 = OK
    );
  } catch (error) {
    console.error("API Error:", error);
    // ---------------------------------------------------------
    // 6. ERROR: Something exploded
    // ---------------------------------------------------------
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }, // 500 = Server's fault
    );
  }
}
