import OrderForm from "@/components/OrderForm";

export default function CreateOrderPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">Create Order</h1>
        <OrderForm />
      </div>
    </div>
  );
}
