import { NextResponse } from "next/server";
import { getSearchParams } from "@/lib/getRequestUrl";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const searchParams = getSearchParams(req);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "start & end query parameters required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // -------------------------------------
    // GET STARTING BALANCE (previous month)
    // -------------------------------------
    const startDate = new Date(start);
    const prev = new Date(startDate);
    prev.setMonth(startDate.getMonth() - 1);

    const prevMonth = prev.getMonth() + 1;
    const prevYear = prev.getFullYear();

    const { data: startingData, error: sbError } = await supabase
      .from("starting_balances")
      .select("cash, qris")
      .eq("month", prevMonth)
      .eq("year", prevYear)
      .limit(1)
      .single();

    if (sbError && sbError.code !== "PGRST116") {
      return NextResponse.json({ error: sbError.message }, { status: 500 });
    }

    const starting = startingData || { cash: 0, qris: 0 };

    // -------------------------------------
    // DATA ORDERS
    // -------------------------------------
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total, date, payment_method")
      .gte("date", `${start} 00:00:00`)
      .lte("date", `${end} 23:59:59`);

    if (ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 });

    // -------------------------------------
    // PAYMENT RECORDS
    // -------------------------------------
    const { data: payments, error: paymentsError } = await supabase
      .from("payment_records")
      .select("method, amount, created_at")
      .gte("created_at", `${start} 00:00:00`)
      .lte("created_at", `${end} 23:59:59`);

    if (paymentsError)
      return NextResponse.json(
        { error: paymentsError.message },
        { status: 500 }
      );

    // -------------------------------------
    // EXPENSES & INCOMES
    // -------------------------------------
    const [{ data: expenses }, { data: incomes }] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, date, payment_method")
        .gte("date", `${start} 00:00:00`)
        .lte("date", `${end} 23:59:59`),

      supabase
        .from("incomes")
        .select("amount, date, payment_method")
        .gte("date", `${start} 00:00:00`)
        .lte("date", `${end} 23:59:59`),
    ]).catch(() => [{ data: [] }, { data: [] }]);

    // -------------------------------------
    // Normalized arrays
    // -------------------------------------
    const ordersArr = orders || [];
    const expensesArr = expenses || [];
    const incomesArr = incomes || [];

    // -------------------------------------
    // AGGREGATE TOTALS
    // -------------------------------------
    const totalRevenue = ordersArr.reduce((s, o) => s + (o.total || 0), 0);
    const totalExpenses = expensesArr.reduce((s, e) => s + (e.amount || 0), 0);
    const totalIncomes = incomesArr.reduce((s, i) => s + (i.amount || 0), 0);

    // -------------------------------------
    // PAYMENT METHODS SUMMARY
    // -------------------------------------
    const pm: Record<string, number> = {};
    (payments || []).forEach((p) => {
      pm[p.method] = (pm[p.method] || 0) + (p.amount || 0);
    });

    // -------------------------------------
    // BUILD INCOME_ROWS
    // -------------------------------------
    const incomeMap: Record<string, number> = {};
    ordersArr.forEach((o) => {
      const dateStr = (o.date || "").slice(0, 10);
      const key = `${dateStr}|${o.payment_method || "cash"}`;
      incomeMap[key] = (incomeMap[key] || 0) + (o.total || 0);
    });

    incomesArr.forEach((i) => {
      const dateStr = (i.date || "").slice(0, 10);
      const key = `${dateStr}|${i.payment_method || "cash"}`;
      incomeMap[key] = (incomeMap[key] || 0) + (i.amount || 0);
    });

    const income_rows = Object.entries(incomeMap)
      .map(([k, v]) => {
        const [date, method] = k.split("|");
        return { date, payment_method: method, total: v };
      })
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.payment_method.localeCompare(b.payment_method)
      );

    // -------------------------------------
    // BUILD EXPENSE_ROWS
    // -------------------------------------
    const expenseMap: Record<string, number> = {};
    expensesArr.forEach((e) => {
      const dateStr = (e.date || "").slice(0, 10);
      const key = `${dateStr}|${e.payment_method || "cash"}`;
      expenseMap[key] = (expenseMap[key] || 0) + (e.amount || 0);
    });

    const expense_rows = Object.entries(expenseMap)
      .map(([k, v]) => {
        const [date, method] = k.split("|");
        return { date, payment_method: method, total: v };
      })
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.payment_method.localeCompare(b.payment_method)
      );

    // -------------------------------------
    // DAILY SUMMARY
    // -------------------------------------
    const daily: Array<any> = [];
    const dateRange = generateDateRange(start, end);

    for (const dateStr of dateRange) {
      const revenue = ordersArr
        .filter((o) => (o.date || "").slice(0, 10) === dateStr)
        .reduce((s, o) => s + (o.total || 0), 0);

      const inc = incomesArr
        .filter((i) => (i.date || "").slice(0, 10) === dateStr)
        .reduce((s, i) => s + (i.amount || 0), 0);

      const exp = expensesArr
        .filter((e) => (e.date || "").slice(0, 10) === dateStr)
        .reduce((s, e) => s + (e.amount || 0), 0);

      daily.push({ date: dateStr, revenue, incomes: inc, expenses: exp });
    }

    // -------------------------------------
    // FINAL BALANCE
    // -------------------------------------
    const finalBalance =
      Number(starting.cash || 0) +
      Number(starting.qris || 0) +
      (totalRevenue + totalIncomes) -
      totalExpenses;

    // -------------------------------------
    // FINAL RETURN
    // -------------------------------------
    return NextResponse.json({
      start,
      end,
      starting: {
        cash: Number(starting.cash || 0),
        qris: Number(starting.qris || 0),
      },
      summary: {
        total_revenue: totalRevenue,
        total_incomes: totalIncomes,
        total_expenses: totalExpenses,
        final_balance: finalBalance,
      },
      payment_methods: pm,
      income_rows,
      expense_rows,
      daily,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Helper: generate list of YYYY-MM-DD
function generateDateRange(start: string, end: string): string[] {
  const arr: string[] = [];
  let cur = new Date(start);
  const last = new Date(end);

  while (cur <= last) {
    arr.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }

  return arr;
}
