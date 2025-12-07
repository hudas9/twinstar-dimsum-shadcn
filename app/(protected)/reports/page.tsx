"use client";

import { useEffect, useState } from "react";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { IncomeTable } from "@/components/reports/IncomeTable";
import { ExpenseTable } from "@/components/reports/ExpenseTable";
import { DailyRecapTable } from "@/components/reports/DailyRecapTable";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function ReportsPage() {
  /** DATE FILTERS */
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  });

  /** DATA STATES */
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  /** UI FILTERS */
  const [incomeMethod, setIncomeMethod] = useState("all");
  const [expenseMethod, setExpenseMethod] = useState("all");
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);

  const perPage = 5;

  /** FORMAT RUPIAH */
  const formatRp = (n: number) =>
    Number(n || 0).toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });

  /** LOAD REPORT DATA */
  async function load() {
    setLoading(true);
    const res = await fetch(`/api/reports/financial?start=${start}&end=${end}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [start, end]);

  if (loading || !data) {
    return <div className="p-8 text-center">Memuat laporan...</div>;
  }

  /** FILTER RESULTS */
  /** FILTER RESULTS */
  const incomes = data.income_rows ?? [];
  const expenses = data.expense_rows ?? [];

  const filteredIncome = incomes.filter((i: any) =>
    incomeMethod === "all" ? true : i.payment_method === incomeMethod
  );

  const filteredExpense = expenses.filter((i: any) =>
    expenseMethod === "all" ? true : i.payment_method === expenseMethod
  );

  const incomeRows = filteredIncome.slice(
    (incomePage - 1) * perPage,
    incomePage * perPage
  );

  const expenseRows = filteredExpense.slice(
    (expensePage - 1) * perPage,
    expensePage * perPage
  );

  return (
    <div className="space-y-6 p-6">
      {/* FILTER */}
      <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded shadow">
        <div>
          <label className="text-xs">Dari tanggal</label>
          <input
            type="date"
            className="border rounded px-2 py-1 w-[160px]"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs">Sampai tanggal</label>
          <input
            type="date"
            className="border rounded px-2 py-1 w-[160px]"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <Button onClick={load} className="flex items-center gap-2">
          <Calendar className="size-4" /> Tampilkan
        </Button>
      </div>

      <SummaryCards data={data} formatRp={formatRp} />

      <IncomeTable
        rows={incomeRows}
        page={incomePage}
        totalRows={filteredIncome.length}
        perPage={perPage}
        method={incomeMethod}
        setMethod={setIncomeMethod}
        setPage={setIncomePage}
        formatRp={formatRp}
      />

      <ExpenseTable
        rows={expenseRows}
        page={expensePage}
        totalRows={filteredExpense.length}
        perPage={perPage}
        method={expenseMethod}
        setMethod={setExpenseMethod}
        setPage={setExpensePage}
        formatRp={formatRp}
      />

      <DailyRecapTable rows={data.daily ?? []} formatRp={formatRp} />
    </div>
  );
}
