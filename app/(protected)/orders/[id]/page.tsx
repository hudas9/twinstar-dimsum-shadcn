"use server";
import OrderForm from "@/components/OrderForm";
import { supabaseServer } from "@/lib/supabaseServer";

interface OrderDetailPage {
  params: Promise<{ id: string }>;
}

async function getOrder(id: number) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      member_id,
      date,
      total,
      order_items (
        id,
        product_id,
        quantity,
        price,
        products(name)
      ),
      payment_records (
        id,
        method,
        amount
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error("Order not found");
  }
  return data;
}

export default async function OrderDetailPage({ params }: OrderDetailPage) {
  const { id } = await params;
  const order = await getOrder(parseInt(id));

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">Edit Order #{order.id}</h1>
        <OrderForm initialData={order} isEdit={true} />
      </div>
    </div>
  );
}
