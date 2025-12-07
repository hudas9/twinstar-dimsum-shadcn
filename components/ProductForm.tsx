"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData?: {
    id: number;
    name: string;
    price: number;
    profit: number;
  };
  isEdit?: boolean;
};

export default function ProductForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  //   const [price, setPrice] = useState(initialData?.price ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  //   const [profit, setProfit] = useState(initialData?.profit ?? "");
  const [profit, setProfit] = useState(initialData?.profit?.toString() ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      //   const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const url = isEdit ? `/api/products/${initialData?.id}` : `/api/products`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseInt(price),
          profit: parseInt(profit),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save product");
        setLoading(false);
        return;
      }

      router.push("/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Product Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Price (Rp)
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Profit (Rp)
        </label>
        <input
          type="number"
          value={profit}
          onChange={(e) => setProfit(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          required
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? isEdit
              ? "Updating…"
              : "Creating…"
            : isEdit
            ? "Update Product"
            : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
