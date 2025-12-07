import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET /api/products
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/products
export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = await req.json();

  if (!body.name || !body.price || body.profit === undefined) {
    return NextResponse.json(
      { error: "name, price, dan profit wajib diisi" },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name: body.name,
        price: body.price,
        profit: body.profit,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
