import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Auth API placeholder. Implement authentication handlers here." },
    { status: 501 },
  );
}
