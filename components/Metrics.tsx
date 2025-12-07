import React from "react";

type Props = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
};

export default function Metrics({
  totalRevenue,
  totalExpenses,
  profit,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-500">Pendapatan</div>
        <div className="mt-2 text-2xl font-semibold">
          Rp {totalRevenue.toLocaleString()}
        </div>
      </div>
      <div className="rounded-lg border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-500">Pengeluaran</div>
        <div className="mt-2 text-2xl font-semibold">
          Rp {totalExpenses.toLocaleString()}
        </div>
      </div>
      <div className="rounded-lg border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-500">Laba / Rugi</div>
        <div
          className={`mt-2 text-2xl font-semibold ${
            profit >= 0 ? "text-green-600" : "text-rose-600"
          }`}
        >
          Rp {profit.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
