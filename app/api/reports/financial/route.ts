import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/* -----------------------------------------
   TYPES
-------------------------------------------- */

type PaymentMethod = "cash" | "qris";

// Tipe untuk hasil query payment records dengan order
interface PaymentWithOrder {
  id: number;
  order_id: number;
  method: PaymentMethod;
  amount: number;
  orders: {
    date: string | null;
  }[];
}

// Tipe untuk order dengan payment records
interface OrderWithPayments {
  id: number;
  total: number;
  date: string | null;
  payment_records: {
    method: PaymentMethod;
    amount: number;
  }[];
}

// Tipe yang sudah diformat untuk penggunaan internal
interface PaymentIncome {
  id: number;
  order_id: number;
  method: PaymentMethod;
  amount: number;
  date: string; // Tanggal dari order
}

interface ManualIncome {
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
     1. GET ORDERS WITH PAYMENT RECORDS
  -------------------------------------------- */
  // Query langsung dari orders dengan payment records
  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select(
      `
      id,
      total,
      date,
      payment_records (
        method,
        amount
      )
    `
    )
    .gte("date", dateStart)
    .lte("date", dateEnd)
    .not("date", "is", null);

  if (ordersErr) {
    console.error("Orders error:", ordersErr);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }

  console.log("Orders with payments:", orders?.length, "records");

  // Transform order data menjadi payment incomes
  const paymentIncomes: PaymentIncome[] = [];

  if (orders) {
    for (const order of orders as OrderWithPayments[]) {
      if (!order.date) continue; // Skip jika tidak ada tanggal

      // Jika order memiliki payment records
      if (order.payment_records && order.payment_records.length > 0) {
        for (const payment of order.payment_records) {
          paymentIncomes.push({
            id: order.id, // Gunakan order id sebagai reference
            order_id: order.id,
            method: payment.method,
            amount: payment.amount,
            date: order.date,
          });
        }
      }
      // Jika tidak ada payment records tapi order memiliki total
      else if (order.total && order.total > 0) {
        // Asumsikan pembayaran cash jika tidak ada payment record
        paymentIncomes.push({
          id: order.id,
          order_id: order.id,
          method: "cash",
          amount: order.total,
          date: order.date,
        });
      }
    }
  }

  console.log("Payment incomes:", paymentIncomes.length, "records");

  /* -----------------------------------------
     2. MANUAL INCOMES (from incomes table)
  -------------------------------------------- */
  const { data: manualIncomes, error: incErr } = await supabase
    .from("incomes")
    .select("*")
    .gte("date", dateStart)
    .lte("date", dateEnd);

  if (incErr) {
    console.error("Manual income error:", incErr);
    return NextResponse.json(
      { error: "Failed to load manual incomes" },
      { status: 500 }
    );
  }

  const manualIncomesArr = (manualIncomes || []) as ManualIncome[];

  /* -----------------------------------------
     3. EXPENSES
  -------------------------------------------- */
  const { data: expenses, error: expErr } = await supabase
    .from("expenses")
    .select("*")
    .gte("date", dateStart)
    .lte("date", dateEnd);

  if (expErr) {
    console.error("Expense error:", expErr);
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

  // Income dari payment records (orders)
  paymentIncomes.forEach((p) => {
    totalIncomes += p.amount;
    incomeByMethod[p.method] += p.amount;
  });

  // Income manual
  manualIncomesArr.forEach((i) => {
    totalIncomes += i.amount;
    incomeByMethod[i.payment_method] += i.amount;
  });

  // Expenses
  expensesArr.forEach((e) => {
    totalExpenses += e.amount;
    expenseByMethod[e.payment_method] += e.amount;
  });

  /* -----------------------------------------
     5. income_rows (gabungan payment income + manual income)
  -------------------------------------------- */
  const incomeMap: Record<string, number> = {};

  // Income dari orders (payment records)
  paymentIncomes.forEach((p) => {
    const date = new Date(p.date).toISOString().slice(0, 10);
    const key = `${date}|${p.method}`;
    incomeMap[key] = (incomeMap[key] || 0) + p.amount;
  });

  // Income manual
  manualIncomesArr.forEach((i) => {
    const date = i.date.slice(0, 10);
    const key = `${date}|${i.payment_method}`;
    incomeMap[key] = (incomeMap[key] || 0) + i.amount;
  });

  const income_rows = Object.entries(incomeMap)
    .map(([key, total]) => {
      const [date, method] = key.split("|");
      return {
        date,
        payment_method: method as PaymentMethod,
        total,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  /* -----------------------------------------
     6. expense_rows
  -------------------------------------------- */
  const expenseMap: Record<string, number> = {};

  expensesArr.forEach((e) => {
    const date = e.date.slice(0, 10);
    const key = `${date}|${e.payment_method}`;
    expenseMap[key] = (expenseMap[key] || 0) + e.amount;
  });

  const expense_rows = Object.entries(expenseMap)
    .map(([key, total]) => {
      const [date, method] = key.split("|");
      return {
        date,
        payment_method: method as PaymentMethod,
        total,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

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
    if (!dailyMap[d]) {
      dailyMap[d] = {
        income_cash: 0,
        income_qris: 0,
        expense_cash: 0,
        expense_qris: 0,
      };
    }
  }

  // Income dari orders
  paymentIncomes.forEach((p) => {
    const d = new Date(p.date).toISOString().slice(0, 10);
    ensureDay(d);
    dailyMap[d][`income_${p.method}`] += p.amount;
  });

  // Income manual
  manualIncomesArr.forEach((i) => {
    const d = i.date.slice(0, 10);
    ensureDay(d);
    dailyMap[d][`income_${i.payment_method}`] += i.amount;
  });

  // Expenses
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
     8. BREAKDOWN BY SOURCE (opsional, untuk informasi tambahan)
  -------------------------------------------- */
  const incomeBySource = {
    from_orders: paymentIncomes.reduce((sum, p) => sum + p.amount, 0),
    manual: manualIncomesArr.reduce((sum, i) => sum + i.amount, 0),
    total: totalIncomes,
  };

  /* -----------------------------------------
     9. FINAL RETURN
  -------------------------------------------- */
  return NextResponse.json({
    start,
    end,
    summary: {
      total_incomes: totalIncomes,
      total_expenses: totalExpenses,
      income_by_method: incomeByMethod,
      expense_by_method: expenseByMethod,
      income_by_source: incomeBySource,
      final_balance: totalIncomes - totalExpenses,
    },
    income_rows,
    expense_rows,
    daily,
    // Data mentah untuk debugging (opsional)
    _debug: {
      payment_incomes_count: paymentIncomes.length,
      manual_incomes_count: manualIncomesArr.length,
      expenses_count: expensesArr.length,
    },
  });
}
