import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getRequestUrl } from "@/lib/getRequestUrl";

export async function GET(req: Request) {
  const url = getRequestUrl(req);
  const date = url.searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Query parameter ?date=YYYY-MM-DD is required" },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  // --- 1. GET payments in orders (multi-payment)
  const { data: payments, error: paymentsError } = await supabase
    .from("payment_records")
    .select("amount, method, created_at, orders(date)")
    .gte("created_at", `${date} 00:00:00`)
    .lte("created_at", `${date} 23:59:59`);

  if (paymentsError) {
    return NextResponse.json({ error: paymentsError.message }, { status: 500 });
  }

  // group payments by method
  const paymentSummary: Record<string, number> = {};
  let totalOrderIncome = 0;

  payments.forEach((p: any) => {
    totalOrderIncome += p.amount;
    paymentSummary[p.method] = (paymentSummary[p.method] || 0) + p.amount;
  });

  // --- 2. GET expenses
  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("*")
    .eq("date", date);

  if (expensesError) {
    return NextResponse.json({ error: expensesError.message }, { status: 500 });
  }

  const totalExpenses = expenses.reduce(
    (acc: number, e: any) => acc + e.amount,
    0
  );

  // --- 3. GET extra incomes
  const { data: incomes, error: incomesError } = await supabase
    .from("incomes")
    .select("*")
    .eq("date", date);

  if (incomesError) {
    return NextResponse.json({ error: incomesError.message }, { status: 500 });
  }

  const totalIncomes = incomes.reduce(
    (acc: number, i: any) => acc + i.amount,
    0
  );

  // --- 4. FINAL REPORT
  const totalPendapatan = totalOrderIncome + totalIncomes;
  const profit = totalPendapatan - totalExpenses;

  return NextResponse.json({
    date,
    order_payments: {
      total: totalOrderIncome,
      per_method: paymentSummary,
    },
    incomes: {
      total: totalIncomes,
      list: incomes,
    },
    expenses: {
      total: totalExpenses,
      list: expenses,
    },
    summary: {
      total_pendapatan: totalPendapatan,
      total_pengeluaran: totalExpenses,
      profit: profit,
    },
  });
}
