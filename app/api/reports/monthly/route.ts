import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres"; // atau pg Pool kamu sendiri
import { getSearchParams } from "@/lib/getRequestUrl";

export async function GET(req: Request) {
  try {
    const searchParams = getSearchParams(req);
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!year || !month) {
      return NextResponse.json(
        { error: "year & month required" },
        { status: 400 }
      );
    }

    // 1. Revenue & profit
    const revenueQuery = await sql`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(SUM(total_cost), 0) AS total_cost,
        COALESCE(SUM(total_profit), 0) AS total_profit
      FROM orders
      WHERE EXTRACT(YEAR FROM date) = ${year}
        AND EXTRACT(MONTH FROM date) = ${month};
    `;

    // 2. Payment method
    const pmQuery = await sql`
      SELECT method, SUM(amount) AS total
      FROM payment_records
      WHERE EXTRACT(YEAR FROM created_at) = ${year}
        AND EXTRACT(MONTH FROM created_at) = ${month}
      GROUP BY method;
    `;

    // 3. Expenses
    const expensesQuery = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total_expenses
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = ${year}
        AND EXTRACT(MONTH FROM date) = ${month};
    `;

    // 4. Incomes
    const incomesQuery = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total_incomes
      FROM incomes
      WHERE EXTRACT(YEAR FROM date) = ${year}
        AND EXTRACT(MONTH FROM date) = ${month};
    `;

    // 5. Daily breakdown
    const dailyQuery = await sql`
      SELECT
        d.date,
        COALESCE(o.order_count, 0) AS orders,
        COALESCE(o.revenue, 0) AS revenue,
        COALESCE(o.profit, 0) AS profit,
        COALESCE(e.expenses, 0) AS expenses,
        COALESCE(i.incomes, 0) AS incomes
      FROM generate_series(
        DATE(${year} || '-' || ${month} || '-01'),
        (DATE(${year} || '-' || ${month} || '-01') + INTERVAL '1 month - 1 day'),
        INTERVAL '1 day'
      ) AS d(date)
      LEFT JOIN (
        SELECT
          date::date AS d,
          COUNT(*) AS order_count,
          SUM(total_amount) AS revenue,
          SUM(total_profit) AS profit
        FROM orders
        WHERE EXTRACT(YEAR FROM date) = ${year}
          AND EXTRACT(MONTH FROM date) = ${month}
        GROUP BY date::date
      ) o ON o.d = d.date
      LEFT JOIN (
        SELECT date, SUM(amount) AS expenses
        FROM expenses
        WHERE EXTRACT(YEAR FROM date) = ${year}
          AND EXTRACT(MONTH FROM date) = ${month}
        GROUP BY date
      ) e ON e.date = d.date
      LEFT JOIN (
        SELECT date, SUM(amount) AS incomes
        FROM incomes
        WHERE EXTRACT(YEAR FROM date) = ${year}
          AND EXTRACT(MONTH FROM date) = ${month}
        GROUP BY date
      ) i ON i.date = d.date;
    `;

    const rev = revenueQuery.rows[0];
    const paymentMethods: any = {};
    pmQuery.rows.forEach((r) => (paymentMethods[r.method] = Number(r.total)));

    const totalRevenue = Number(rev.total_revenue);
    const totalCost = Number(rev.total_cost);
    const totalProfit = Number(rev.total_profit);
    const totalIncomes = Number(incomesQuery.rows[0].total_incomes);
    const totalExpenses = Number(expensesQuery.rows[0].total_expenses);

    return NextResponse.json({
      year,
      month,
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        total_incomes: totalIncomes,
        total_expenses: totalExpenses,
        net_profit: totalProfit + totalIncomes - totalExpenses,
      },
      payment_methods: paymentMethods,
      daily: dailyQuery.rows,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
