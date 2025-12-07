"use client";

import { useState } from "react";
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

type Props = {
  initialData?: {
    id: number;
    amount: number;
    title?: string;
    date: string;
    payment_method?: string;
    notes?: string;
  };
  isEdit?: boolean;
};

export default function ExpenseForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();

  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [date, setDate] = useState(
    initialData?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.payment_method ?? "cash"
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/expenses/${initialData?.id}` : `/api/expenses`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: parseInt(amount),
          payment_method: paymentMethod,
          notes,
          date,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save expense");
        setLoading(false);
        return;
      }

      router.push("/expenses");
      router.refresh();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {/* ERROR ALERT */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* AMOUNT */}
      <div className="space-y-2">
        <Label>Amount (Rp)</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      {/* TITLE */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* DATE */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* PAYMENT METHOD */}
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="qris">QRIS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NOTES */}
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any additional notes..."
        />
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? isEdit
              ? "Updating…"
              : "Creating…"
            : isEdit
            ? "Update Expense"
            : "Create Expense"}
        </Button>

        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
