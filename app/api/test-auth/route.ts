import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Get the headers that middleware adds
  const userId = request.headers.get("X-user-id");
  const userEmail = request.headers.get("x-user-email");

  return NextResponse.json({
    message: "Middleware is working!",
    userId,
    userEmail,
    timestamp: new Date().toISOString(),
  });
}
