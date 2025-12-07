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
    name: string;
    whatsapp_number: string;
  };
  isEdit?: boolean;
};

export default function IncomeForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name);
  const [whatsapp_number, setWhatsappNumber] = useState(
    initialData?.whatsapp_number
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/members/${initialData?.id}` : `/api/members`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp_number,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save member.");
        setLoading(false);
        return;
      }

      router.push("/members");
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

      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Whatsapp Number */}
      <div className="space-y-2">
        <Label>Whatsapp Number</Label>
        <Input
          value={whatsapp_number}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          required
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
            ? "Update Member"
            : "Create Member"}
        </Button>

        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
