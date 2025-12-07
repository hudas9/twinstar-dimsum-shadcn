"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
  profit: number;
  created_at?: string;
};

export default function ProductsList() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    setError(null);

    try {
      //   const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const url = `/api/products`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load products");
      } else {
        setProducts(data || []);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;

    try {
      //   const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const url = `/api/products/${id}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete product");
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <Link
          href="/products/create"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Product
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-zinc-500">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="text-sm text-zinc-500">No products found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Price
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Profit
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-6 py-3">{product.name}</td>
                  <td className="px-6 py-3">
                    Rp {product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    Rp {product.profit.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 flex gap-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
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
