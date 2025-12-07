"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
};

type Member = {
  id: number;
  name: string;
  whatsapp_number?: string;
};

type OrderItem = {
  product_id: number;
  quantity: number;
  price: number;
};

interface OrderFormProps {
  initialData?: {
    id: number;
    member_id: number | null;
    date: string;
    total: number;
    order_items?: any[];
    payment_records?: any[];
  };
  isEdit?: boolean;
}

export default function OrderForm({
  initialData,
  isEdit = false,
}: OrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [memberId, setMemberId] = useState<number | null>(
    initialData?.member_id ?? null
  );
  // store `date` as an ISO string (UTC) so we send full timestamp to the API
  const [date, setDate] = useState<string>(
    initialData?.date ?? new Date().toISOString()
  );
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<
    { method: string; amount: number }[]
  >([{ method: "cash", amount: 0 }]);
  const [newItemProductId, setNewItemProductId] = useState<number>(0);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);

  // Fetch products and members on mount, and existing items when editing
  useEffect(() => {
    async function fetchData() {
      //   const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

      try {
        const [productsRes, membersRes] = await Promise.all([
          fetch(`/api/products`),
          fetch(`/api/members`),
        ]);

        if (productsRes.ok) setProducts(await productsRes.json());
        if (membersRes.ok) setMembers(await membersRes.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }
    fetchData();
  }, []);

  // Helper to convert ISO string (UTC) -> value for <input type="datetime-local"> (local)
  function isoToLocalDatetimeInput(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    // get timezone offset in minutes and shift to local
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  }

  // When reading from datetime-local input, convert local value to ISO UTC
  function localDatetimeInputToIso(localValue: string) {
    if (!localValue) return new Date().toISOString();
    const dt = new Date(localValue);
    return dt.toISOString();
  }

  // Load existing items when editing
  useEffect(() => {
    if (isEdit && initialData?.order_items) {
      const existingItems = initialData.order_items.map((oi: any) => ({
        product_id: oi.product_id,
        quantity: oi.quantity,
        price: oi.price,
      }));
      setItems(existingItems);

      // Load existing payments if available
      if (
        initialData?.payment_records &&
        initialData.payment_records.length > 0
      ) {
        setPayments(
          initialData.payment_records.map((pr: any) => ({
            method: pr.method,
            amount: pr.amount,
          }))
        );
      }
    }
  }, [isEdit, initialData]);

  // Add item to order
  const handleAddItem = () => {
    if (!newItemProductId || newItemQuantity <= 0) {
      alert("Select product and quantity");
      return;
    }

    const product = products.find((p) => p.id === newItemProductId);
    if (!product) return;

    setItems([
      ...items,
      {
        product_id: newItemProductId,
        quantity: newItemQuantity,
        price: product.price,
      },
    ]);
    setNewItemProductId(0);
    setNewItemQuantity(1);
  };

  // Remove item from order
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate total
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (items.length === 0) {
      setError("At least one item required");
      setLoading(false);
      return;
    }

    try {
      const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const url = isEdit
        ? `${BASE}/api/orders/${initialData?.id}`
        : `${BASE}/api/orders`;
      const method = isEdit ? "PUT" : "POST";

      // Validate payments
      const totalPayment = payments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );
      if (totalPayment !== total) {
        setError(
          `Total payment (Rp ${totalPayment.toLocaleString()}) must equal total order (Rp ${total.toLocaleString()})`
        );
        setLoading(false);
        return;
      }

      const payload = {
        member_id: memberId,
        date,
        items,
        payments,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save order");
      } else {
        router.push("/orders");
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
    >
      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Member Selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Member (Optional)
        </label>
        <select
          value={memberId ?? ""}
          onChange={(e) =>
            setMemberId(e.target.value ? parseInt(e.target.value) : null)
          }
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        >
          <option value="">Walk-in Customer</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.whatsapp_number ?? "-"})
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Date & Time
        </label>
        <input
          type="datetime-local"
          value={isoToLocalDatetimeInput(date)}
          onChange={(e) => setDate(localDatetimeInputToIso(e.target.value))}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          required
        />
      </div>

      {/* Add Items */}
      <div className="space-y-3 rounded-md bg-zinc-50 p-4">
        <h3 className="font-semibold text-zinc-900">Add Items</h3>
        <div className="flex gap-2">
          <select
            value={newItemProductId}
            onChange={(e) => setNewItemProductId(parseInt(e.target.value))}
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value={0}>Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Rp {p.price.toLocaleString()})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 0)}
            min="1"
            className="w-24 rounded-md border border-zinc-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-2 text-left font-medium text-zinc-600">
                  Product
                </th>
                <th className="px-4 py-2 text-right font-medium text-zinc-600">
                  Price
                </th>
                <th className="px-4 py-2 text-right font-medium text-zinc-600">
                  Qty
                </th>
                <th className="px-4 py-2 text-right font-medium text-zinc-600">
                  Subtotal
                </th>
                <th className="px-4 py-2 text-center font-medium text-zinc-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const product = products.find((p) => p.id === item.product_id);
                return (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-4 py-2">{product?.name}</td>
                    <td className="px-4 py-2 text-right">
                      Rp {item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      Rp {(item.price * item.quantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-600 hover:text-rose-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Methods (Split Payments) */}
      {items.length > 0 && (
        <div className="space-y-3 rounded-md bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Payment Methods</h3>
            <button
              type="button"
              onClick={() =>
                setPayments([...payments, { method: "cash", amount: 0 }])
              }
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Add Payment
            </button>
          </div>
          <div className="space-y-2">
            {payments.map((payment, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  value={payment.method}
                  onChange={(e) => {
                    const newPayments = [...payments];
                    newPayments[idx].method = e.target.value;
                    setPayments(newPayments);
                  }}
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="qris">Qris</option>
                </select>
                <input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => {
                    const newPayments = [...payments];
                    newPayments[idx].amount = parseInt(e.target.value) || 0;
                    setPayments(newPayments);
                  }}
                  placeholder="Amount"
                  className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                {payments.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPayments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="rounded-md bg-rose-100 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 text-sm">
            <div className="flex-1">
              Total Payment:{" "}
              <span className="font-semibold">
                Rp{" "}
                {payments
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
                  .toLocaleString()}
              </span>
            </div>
            <div>
              Order Total:{" "}
              <span className="font-semibold">Rp {total.toLocaleString()}</span>
            </div>
            {payments.reduce((sum, p) => sum + (p.amount || 0), 0) !==
              total && (
              <div className="text-rose-600 font-semibold">⚠ Mismatch</div>
            )}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="text-right">
        <div className="text-lg font-bold text-zinc-900">
          Total: Rp {total.toLocaleString()}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Order" : "Create Order"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
