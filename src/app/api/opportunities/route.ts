import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Opportunities API placeholder." },
    { status: 501 },
  );
}
