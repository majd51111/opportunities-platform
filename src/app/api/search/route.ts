import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Search API placeholder." },
    { status: 501 },
  );
}
