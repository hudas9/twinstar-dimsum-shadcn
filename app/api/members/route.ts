import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // kalau @/src/lib/supabaseServer error

// GET all members
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// CREATE new member
export async function POST(request: Request) {
  const supabase = supabaseServer();
  const body = await request.json();

  const { name, whatsapp_number } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("members")
    .insert([{ name, whatsapp_number }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
