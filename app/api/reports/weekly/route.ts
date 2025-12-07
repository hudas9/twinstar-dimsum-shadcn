import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSearchParams } from "@/lib/getRequestUrl";

export async function GET(req: Request) {
  try {
    const searchParams = getSearchParams(req);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // ⭕ 1. Tentukan minggu
    const week = await sql`
      SELECT
        date_trunc('week', DATE(${date}))::date AS start_date,
        (date_trunc('week', DATE(${date}))::date + INTERVAL '6 days')::date AS end_date;
    `;

    const start = week.rows[0].start_date;
    const end = week.rows[0].end_date;

    // ⭕ 2. Revenue / Profit
    const rev = await sql`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(SUM(total_cost), 0) AS total_cost,
        COALESCE(SUM(total_profit), 0) AS total_profit
      FROM orders
      WHERE date::date BETWEEN ${start} AND ${end};
    `;

    // ⭕ 3. Payment method breakdown
    const pm = await sql`
      SELECT method, SUM(amount) AS total
      FROM payment_records
      WHERE created_at::date BETWEEN ${start} AND ${end}
      GROUP BY method;
    `;

    const paymentMethods: any = {};
    pm.rows.forEach((r) => (paymentMethods[r.method] = Number(r.total)));

    // ⭕ 4. Expenses
    const expenses = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE date BETWEEN ${start} AND ${end};
    `;

    // ⭕ 5. Incomes
    const incomes = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM incomes
      WHERE date BETWEEN ${start} AND ${end};
    `;

    const totalExpenses = Number(expenses.rows[0].total);
    const totalIncomes = Number(incomes.rows[0].total);

    // ⭕ 6. Daily breakdown
    const daily = await sql`
      SELECT
        d.date,
        COALESCE(o.order_count, 0) AS orders,
        COALESCE(o.revenue, 0) AS revenue,
        COALESCE(o.profit, 0) AS profit,
        COALESCE(e.expenses, 0) AS expenses,
        COALESCE(i.incomes, 0) AS incomes
      FROM generate_series(${start}::date, ${end}::date, '1 day') d(date)
      LEFT JOIN (
        SELECT date::date AS d,
               COUNT(*) AS order_count,
               SUM(total_amount) AS revenue,
               SUM(total_profit) AS profit
        FROM orders
        WHERE date::date BETWEEN ${start} AND ${end}
        GROUP BY date::date
      ) o ON o.d = d.date
      LEFT JOIN (
        SELECT date, SUM(amount) AS expenses
        FROM expenses
        WHERE date BETWEEN ${start} AND ${end}
        GROUP BY date
      ) e ON e.date = d.date
      LEFT JOIN (
        SELECT date, SUM(amount) AS incomes
        FROM incomes
        WHERE date BETWEEN ${start} AND ${end}
        GROUP BY date
      ) i ON i.date = d.date;
    `;

    return NextResponse.json({
      week_start: start,
      week_end: end,
      summary: {
        total_revenue: Number(rev.rows[0].total_revenue),
        total_cost: Number(rev.rows[0].total_cost),
        total_profit: Number(rev.rows[0].total_profit),
        total_incomes: totalIncomes,
        total_expenses: totalExpenses,
        net_profit:
          Number(rev.rows[0].total_profit) + totalIncomes - totalExpenses,
      },
      payment_methods: paymentMethods,
      daily: daily.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
