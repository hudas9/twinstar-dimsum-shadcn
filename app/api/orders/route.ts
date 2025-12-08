import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      member_id,
      date,
      total,
      created_at,
      updated_at,
      members(name, whatsapp_number),
      order_items (
        id,
        product_id,
        quantity,
        price,
        subtotal,
        products(name)
      ),
      payment_records (
        id,
        method,
        amount
      )
    `
    )
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = supabaseServer();
  const body = await request.json();

  const { member_id, date: dateFromBody, items, payments } = body;
  // If client didn't provide a date, use server current time (UTC)
  const date = dateFromBody ?? new Date().toISOString();

  if (!items || !items.length) {
    return NextResponse.json({ error: "Items is required" }, { status: 400 });
  }

  if (!payments || !payments.length) {
    return NextResponse.json(
      { error: "Payments is required" },
      { status: 400 }
    );
  }

  // Hitung total dari items
  const total = items.reduce(
    (acc: number, item: any) => acc + item.price * item.quantity,
    0
  );

  // Validasi total payment
  const totalPaid = payments.reduce((acc: number, p: any) => acc + p.amount, 0);

  if (totalPaid !== total) {
    return NextResponse.json(
      { error: "Total payments must equal items total" },
      { status: 400 }
    );
  }

  // Insert ORDER
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        member_id: member_id ?? null,
        date,
        total,
      },
    ])
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Insert ORDER ITEMS
  const orderItemsPayload = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  // Insert PAYMENT RECORDS
  const paymentPayload = payments.map((p: any) => ({
    order_id: order.id,
    method: p.method,
    amount: p.amount,
  }));

  const { error: payError } = await supabase
    .from("payment_records")
    .insert(paymentPayload);

  if (payError) {
    return NextResponse.json({ error: payError.message }, { status: 500 });
  }

  return NextResponse.json(order, { status: 201 });
}
