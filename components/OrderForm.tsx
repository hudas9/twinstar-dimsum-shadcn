"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function OrderForm({ initialData, isEdit = false }: any) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<
    { method: string; amount: number }[]
  >([{ method: "cash", amount: 0 }]);

  const [memberId, setMemberId] = useState<number | null>(
    initialData?.member_id ?? null
  );

  const [date, setDate] = useState(
    initialData?.date ?? new Date().toISOString()
  );

  const [newItemProductId, setNewItemProductId] = useState<number>(0);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products & members
  useEffect(() => {
    Promise.all([fetch(`/api/products`), fetch(`/api/members`)]).then(
      async ([pRes, mRes]) => {
        if (pRes.ok) setProducts(await pRes.json());
        if (mRes.ok) setMembers(await mRes.json());
      }
    );
  }, []);

  // Convert ISO -> local input
  function isoToLocal(iso: string) {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  function localToIso(local: string) {
    return new Date(local).toISOString();
  }

  // Total
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Add item
  const handleAddItem = () => {
    if (!newItemProductId) return alert("Select product");

    const p = products.find((x) => x.id === newItemProductId);
    if (!p) return;

    setItems([
      ...items,
      { product_id: p.id, quantity: newItemQuantity, price: p.price },
    ]);
    setNewItemProductId(0);
    setNewItemQuantity(1);
  };

  const handleRemoveItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  // Submit
  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (items.length === 0) {
      setError("At least one item required");
      setLoading(false);
      return;
    }

    const paymentTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
    if (paymentTotal !== total) {
      setError("Total payment must equal total order");
      setLoading(false);
      return;
    }

    const payload = { member_id: memberId, date, items, payments };
    const url = isEdit ? `/api/orders/${initialData.id}` : `/api/orders`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to save order");
    else router.push("/orders");

    setLoading(false);
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Order" : "Create Order"}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ERROR */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* MEMBER */}
          <div className="space-y-2">
            <Label>Member (Optional)</Label>
            <Select
              value={memberId ? memberId.toString() : "none"}
              onValueChange={(v) =>
                setMemberId(v === "none" ? null : parseInt(v))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Walk-in Customer" />
              </SelectTrigger>

              <SelectContent>
                {/* Walk-in Customer */}
                <SelectItem value="none">Walk-in Customer</SelectItem>

                {/* Members */}
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DATE */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={isoToLocal(date)}
              onChange={(e) => setDate(localToIso(e.target.value))}
            />
          </div>

          {/* ADD ITEMS */}
          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-base">Add Items</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select
                  value={newItemProductId.toString()}
                  onValueChange={(v) => setNewItemProductId(parseInt(v))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} — Rp {p.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  className="w-24"
                  value={newItemQuantity}
                  min={1}
                  onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
                />

                <Button type="button" onClick={handleAddItem}>
                  Add
                </Button>
              </div>

              {/* TABLE ITEMS */}
              {items.length > 0 && (
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => {
                        const p = products.find(
                          (x) => x.id === item.product_id
                        );
                        return (
                          <TableRow key={idx}>
                            <TableCell>{p?.name}</TableCell>
                            <TableCell className="text-right">
                              Rp {item.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              Rp {(item.price * item.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PAYMENT METHODS */}
          {items.length > 0 && (
            <Card className="bg-muted/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Payment Methods</CardTitle>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setPayments([...payments, { method: "cash", amount: 0 }])
                  }
                >
                  Add Payment
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {payments.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Select
                      value={p.method}
                      onValueChange={(v) => {
                        const newList = [...payments];
                        newList[idx].method = v;
                        setPayments(newList);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      className="w-32"
                      value={p.amount}
                      onChange={(e) => {
                        const newList = [...payments];
                        newList[idx].amount = parseInt(e.target.value) || 0;
                        setPayments(newList);
                      }}
                    />

                    {payments.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setPayments(payments.filter((_, i) => i !== idx))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                {/* SUMMARY */}
                <div className="flex justify-between text-sm font-medium">
                  <div>
                    Payments: Rp{" "}
                    {payments
                      .reduce((s, p) => s + (p.amount || 0), 0)
                      .toLocaleString()}
                  </div>

                  <div>Order Total: Rp {total.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TOTAL */}
          <div className="text-right text-xl font-bold">
            Total: Rp {total.toLocaleString()}
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : isEdit ? "Update Order" : "Create Order"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/orders")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
