"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: number;
  member_id: number | null;
  date: string;
  total: number;
  members?: { name: string; whatsapp_number?: string } | null;
  payment_records?: { id: number; method: string; amount: number }[];
};

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    setError(null);

    try {
      //   const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const url = `/api/orders`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load orders");
      } else {
        setOrders(data || []);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this order?")) return;

    try {
      const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const url = `/api/orders/${id}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete order");
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      }
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Orders</h2>
        <Link
          href="/orders/create"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Order
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-zinc-500">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-zinc-500">No orders found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  ID
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Payment
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Member
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Date / Time
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-600">
                  Total
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-6 py-3">#{order.id}</td>
                  <td className="px-6 py-3">
                    {order.payment_records && order.payment_records.length > 0
                      ? order.payment_records.length === 1
                        ? order.payment_records[0].method
                        : "Split"
                      : "-"}
                  </td>
                  <td className="px-6 py-3">
                    {order.members?.name ?? "Walk-in"}
                  </td>
                  <td className="px-6 py-3">
                    {new Date(order.date).toLocaleString([], {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-3 text-right font-medium">
                    Rp {order.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 flex gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
