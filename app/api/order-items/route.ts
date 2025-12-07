import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getSearchParams } from "@/lib/getRequestUrl";

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const searchParams = getSearchParams(req);
  const order_id = searchParams.get("order_id");

  let query = supabase
    .from("order_items")
    .select(
      `
        id,
        order_id,
        product_id,
        quantity,
        price,
        subtotal,
        products(name)
      `
    )
    .order("id", { ascending: true });

  if (order_id) {
    query = query.eq("order_id", Number(order_id));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
