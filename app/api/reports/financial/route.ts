import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/* -----------------------------------------
   TYPES
-------------------------------------------- */

type PaymentMethod = "cash" | "qris";

interface PaymentRecord {
  id: number;
  order_id: number;
  method: PaymentMethod;
  amount: number;
  orders: {
    date: string | null;
  } | null;
}

interface IncomeRecord {
  id: number;
  date: string;
  amount: number;
  payment_method: PaymentMethod;
}

interface ExpenseRecord {
  id: number;
  date: string;
  amount: number;
  payment_method: PaymentMethod;
}

/* -----------------------------------------
   ROUTE HANDLER
-------------------------------------------- */

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end)
    return NextResponse.json({ error: "Missing date params" }, { status: 400 });

  const dateStart = `${start}T00:00:00`;
  const dateEnd = `${end}T23:59:59`;

  /* -----------------------------------------
     1. PAYMENT RECORDS (JOIN orders.date)
  -------------------------------------------- */
  const { data: payments, error: payErr } = await supabase
    .from("payment_records")
    .select(
      `
        id,
        order_id,
        method,
        amount,
        orders (
          date
        )
      `
    )
    .gte("orders.date", dateStart)
    .lte("orders.date", dateEnd);

  if (payErr) {
    console.error(payErr);
    return NextResponse.json(
      { error: "Failed to load payment records" },
      { status: 500 }
    );
  }

  const paymentsArr = (payments || []) as PaymentRecord[];

  /* -----------------------------------------
     2. INCOMES
  -------------------------------------------- */
  const { data: incomes, error: incErr } = await supabase
    .from("incomes")
    .select("*")
    .gte("date", dateStart)
    .lte("date", dateEnd);

  if (incErr) {
    console.error(incErr);
    return NextResponse.json(
      { error: "Failed to load incomes" },
      { status: 500 }
    );
  }

  const incomesArr = (incomes || []) as IncomeRecord[];

  /* -----------------------------------------
     3. EXPENSES
  -------------------------------------------- */
  const { data: expenses, error: expErr } = await supabase
    .from("expenses")
    .select("*")
    .gte("date", dateStart)
    .lte("date", dateEnd);

  if (expErr) {
    console.error(expErr);
    return NextResponse.json(
      { error: "Failed to load expenses" },
      { status: 500 }
    );
  }

  const expensesArr = (expenses || []) as ExpenseRecord[];

  /* -----------------------------------------
     4. SUMMARY
  -------------------------------------------- */
  let totalIncomes = 0;
  let totalExpenses = 0;

  const incomeByMethod = { cash: 0, qris: 0 };
  const expenseByMethod = { cash: 0, qris: 0 };

  paymentsArr.forEach((p) => {
    totalIncomes += p.amount;
    incomeByMethod[p.method] += p.amount;
  });

  incomesArr.forEach((i) => {
    totalIncomes += i.amount;
    incomeByMethod[i.payment_method] += i.amount;
  });

  expensesArr.forEach((e) => {
    totalExpenses += e.amount;
    expenseByMethod[e.payment_method] += e.amount;
  });

  /* -----------------------------------------
     5. income_rows
  -------------------------------------------- */
  const incomeMap: Record<string, number> = {};

  paymentsArr.forEach((p) => {
    const date = p.orders?.date?.slice(0, 10) ?? "unknown";
    const key = `${date}|${p.method}`;
    incomeMap[key] = (incomeMap[key] || 0) + p.amount;
  });

  incomesArr.forEach((i) => {
    const date = i.date.slice(0, 10);
    const key = `${date}|${i.payment_method}`;
    incomeMap[key] = (incomeMap[key] || 0) + i.amount;
  });

  const income_rows = Object.entries(incomeMap).map(([key, total]) => {
    const [date, method] = key.split("|");
    return {
      date,
      payment_method: method as PaymentMethod,
      total,
    };
  });

  /* -----------------------------------------
     6. expense_rows
  -------------------------------------------- */
  const expenseMap: Record<string, number> = {};

  expensesArr.forEach((e) => {
    const date = e.date.slice(0, 10);
    const key = `${date}|${e.payment_method}`;
    expenseMap[key] = (expenseMap[key] || 0) + e.amount;
  });

  const expense_rows = Object.entries(incomeMap).map(([key, total]) => {
    const [date, method] = key.split("|");
    return {
      date,
      payment_method: method as PaymentMethod,
      total,
    };
  });

  /* -----------------------------------------
     7. DAILY RECAP
  -------------------------------------------- */
  const dailyMap: Record<
    string,
    {
      income_cash: number;
      income_qris: number;
      expense_cash: number;
      expense_qris: number;
    }
  > = {};

  function ensureDay(d: string) {
    dailyMap[d] ??= {
      income_cash: 0,
      income_qris: 0,
      expense_cash: 0,
      expense_qris: 0,
    };
  }

  paymentsArr.forEach((p) => {
    const d = p.orders?.date?.slice(0, 10) ?? "unknown";
    ensureDay(d);
    dailyMap[d][`income_${p.method}`] += p.amount;
  });

  incomesArr.forEach((i) => {
    const d = i.date.slice(0, 10);
    ensureDay(d);
    dailyMap[d][`income_${i.payment_method}`] += i.amount;
  });

  expensesArr.forEach((e) => {
    const d = e.date.slice(0, 10);
    ensureDay(d);
    dailyMap[d][`expense_${e.payment_method}`] += e.amount;
  });

  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      income_cash: d.income_cash,
      income_qris: d.income_qris,
      total_income: d.income_cash + d.income_qris,
      expense_cash: d.expense_cash,
      expense_qris: d.expense_qris,
      total_expense: d.expense_cash + d.expense_qris,
      net: d.income_cash + d.income_qris - (d.expense_cash + d.expense_qris),
    }));

  /* -----------------------------------------
     8. FINAL RETURN
  -------------------------------------------- */
  return NextResponse.json({
    start,
    end,
    summary: {
      total_incomes: totalIncomes,
      total_expenses: totalExpenses,
      income_by_method: incomeByMethod,
      expense_by_method: expenseByMethod,
      final_balance: totalIncomes - totalExpenses,
    },
    income_rows,
    expense_rows,
    daily,
  });
}
