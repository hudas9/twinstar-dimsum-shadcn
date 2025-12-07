import { NextResponse } from "next/server";

// User management via Supabase dashboard. Keep this route minimal and
// return a 404 to discourage use of in-app user creation.
export async function GET() {
  return NextResponse.json({ error: "Not available" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Not available" }, { status: 404 });
}
