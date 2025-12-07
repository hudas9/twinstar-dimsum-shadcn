import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = supabaseServer();
  const { id } = await params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

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
        amount,
        created_at
      )
    `
    )
    .eq("id", orderId)
    .single(); // memastikan hasil tunggal

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = supabaseServer();
  const { id } = await params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();

  const { member_id, date, items, payments } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Items is required" }, { status: 400 });
  }

  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return NextResponse.json(
      { error: "Payments is required" },
      { status: 400 }
    );
  }

  // hitung total dari items
  const total = items.reduce(
    (acc: number, item: any) => acc + item.price * item.quantity,
    0
  );

  // hitung total payment
  const totalPayment = payments.reduce(
    (acc: number, p: any) => acc + p.amount,
    0
  );

  if (totalPayment !== total) {
    return NextResponse.json(
      { error: "Total payment tidak sama dengan total order" },
      { status: 400 }
    );
  }

  // 1. Update order
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      member_id: member_id ?? null,
      date,
      total,
      updated_at: new Date(),
    })
    .eq("id", orderId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 2. Hapus items lama
  const { error: deleteItemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (deleteItemsError) {
    return NextResponse.json(
      { error: deleteItemsError.message },
      { status: 500 }
    );
  }

  // 3. Insert items baru
  const itemsPayload = items.map((item: any) => ({
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }));

  const { error: insertItemsError } = await supabase
    .from("order_items")
    .insert(itemsPayload);

  if (insertItemsError) {
    return NextResponse.json(
      { error: insertItemsError.message },
      { status: 500 }
    );
  }

  // 4. Hapus payment lama
  const { error: deletePaymentsError } = await supabase
    .from("payment_records")
    .delete()
    .eq("order_id", orderId);

  if (deletePaymentsError) {
    return NextResponse.json(
      { error: deletePaymentsError.message },
      { status: 500 }
    );
  }

  // 5. Insert payment baru
  const paymentPayload = payments.map((p: any) => ({
    order_id: orderId,
    method: p.method,
    amount: p.amount,
  }));

  const { error: insertPaymentError } = await supabase
    .from("payment_records")
    .insert(paymentPayload);

  if (insertPaymentError) {
    return NextResponse.json(
      { error: insertPaymentError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Order updated successfully" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = supabaseServer();
  const { id } = await params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Order deleted successfully" },
    { status: 200 }
  );
}
