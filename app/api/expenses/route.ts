import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET /api/expenses
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/expenses
export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = await req.json();

  const { title, amount, date, payment_method, notes } = body;

  if (!title || !amount || !date) {
    return NextResponse.json(
      { error: "title, amount, and date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert([
      {
        title,
        amount,
        date,
        payment_method: payment_method ?? "cash",
        notes: notes ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
