"use client";
import { useEffect, useState } from "react";

function formatRp(v: number) {
  return `Rp ${Number(v || 0).toLocaleString()}`;
}

export default function ReportsPage() {
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

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [incomeMethodFilter, setIncomeMethodFilter] = useState("all");
  const [expenseMethodFilter, setExpenseMethodFilter] = useState("all");

  // Pagination states
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [rekapPage, setRekapPage] = useState(1);

  const rowsPerPage = 10;

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reports/financial?start=${start}&end=${end}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch report");
      setData(json);

      // reset pages every refresh
      setIncomePage(1);
      setExpensePage(1);
      setRekapPage(1);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  const getIncomeTotalsByDateAndMethod = (date: string, method: string) => {
    if (!data) return 0;
    const found = (data.income_rows || []).find(
      (r: any) => r.date === date && r.payment_method === method
    );
    return found ? Number(found.total || 0) : 0;
  };

  const getExpenseTotalsByDateAndMethod = (date: string, method: string) => {
    if (!data) return 0;
    const found = (data.expense_rows || []).find(
      (r: any) => r.date === date && r.payment_method === method
    );
    return found ? Number(found.total || 0) : 0;
  };

  const methods = ["cash", "qris"];

  // Helper untuk menghitung total baris income berdasarkan filter
  const getFilteredIncomeRows = () => {
    if (!data) return 0;

    let count = 0;
    data.daily.forEach((d: any) => {
      methods.forEach((m) => {
        if (incomeMethodFilter === "all" || incomeMethodFilter === m) {
          const val = getIncomeTotalsByDateAndMethod(d.date, m);
          if (val > 0) count++;
        }
      });
    });
    return count;
  };

  // Helper untuk menghitung total baris expense berdasarkan filter
  const getFilteredExpenseRows = () => {
    if (!data) return 0;

    let count = 0;
    data.daily.forEach((d: any) => {
      methods.forEach((m) => {
        if (expenseMethodFilter === "all" || expenseMethodFilter === m) {
          const val = getExpenseTotalsByDateAndMethod(d.date, m);
          if (val > 0) count++;
        }
      });
    });
    return count;
  };

  // Helper untuk mendapatkan baris income yang sudah difilter
  const getPaginatedIncomeRows = () => {
    if (!data) return [];

    const rows: any[] = [];
    let count = 0;
    const startIdx = (incomePage - 1) * rowsPerPage;
    const endIdx = incomePage * rowsPerPage;

    data.daily.forEach((d: any) => {
      methods.forEach((m) => {
        if (incomeMethodFilter === "all" || incomeMethodFilter === m) {
          const val = getIncomeTotalsByDateAndMethod(d.date, m);
          if (val > 0) {
            if (count >= startIdx && count < endIdx) {
              rows.push({ date: d.date, method: m, value: val });
            }
            count++;
          }
        }
      });
    });

    return rows;
  };

  // Helper untuk mendapatkan baris expense yang sudah difilter
  const getPaginatedExpenseRows = () => {
    if (!data) return [];

    const rows: any[] = [];
    let count = 0;
    const startIdx = (expensePage - 1) * rowsPerPage;
    const endIdx = expensePage * rowsPerPage;

    data.daily.forEach((d: any) => {
      methods.forEach((m) => {
        if (expenseMethodFilter === "all" || expenseMethodFilter === m) {
          const val = getExpenseTotalsByDateAndMethod(d.date, m);
          if (val > 0) {
            if (count >= startIdx && count < endIdx) {
              rows.push({ date: d.date, method: m, value: val });
            }
            count++;
          }
        }
      });
    });

    return rows;
  };

  // Pagination helper untuk rekap (tetap berdasarkan tanggal)
  const paginate = (arr: any[], page: number) =>
    arr.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Laporan Keuangan</h1>

      <div className="my-4 flex gap-2 items-end">
        <div>
          <label className="block text-sm text-zinc-700">Dari Tanggal</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-700">Sampai Tanggal</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <button
            onClick={fetchReport}
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="text-rose-600">{error}</div>}

      {data && (
        <div className="space-y-6">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pemasukan */}
            <div className="p-4 bg-green-600 text-white rounded shadow">
              <div className="text-sm">Total Pemasukan</div>
              <div className="text-2xl font-bold">
                {formatRp(
                  (data.summary.total_revenue || 0) +
                    (data.summary.total_incomes || 0)
                )}
              </div>
              <div className="mt-3 text-sm space-y-1">
                <div>
                  Cash:{" "}
                  <b>
                    {formatRp(
                      (data.income_rows || [])
                        .filter((r: any) => r.payment_method === "cash")
                        .reduce((s: number, r: any) => s + (r.total || 0), 0)
                    )}
                  </b>
                </div>
                <div>
                  QRIS:{" "}
                  <b>
                    {formatRp(
                      (data.income_rows || [])
                        .filter((r: any) => r.payment_method === "qris")
                        .reduce((s: number, r: any) => s + (r.total || 0), 0)
                    )}
                  </b>
                </div>
              </div>
            </div>

            {/* Pengeluaran */}
            <div className="p-4 bg-red-600 text-white rounded shadow">
              <div className="text-sm">Total Pengeluaran</div>
              <div className="text-2xl font-bold">
                {formatRp(data.summary.total_expenses || 0)}
              </div>
              <div className="mt-3 text-sm space-y-1">
                <div>
                  Cash:{" "}
                  <b>
                    {formatRp(
                      (data.expense_rows || [])
                        .filter((r: any) => r.payment_method === "cash")
                        .reduce((s: number, r: any) => s + (r.total || 0), 0)
                    )}
                  </b>
                </div>
                <div>
                  QRIS:{" "}
                  <b>
                    {formatRp(
                      (data.expense_rows || [])
                        .filter((r: any) => r.payment_method === "qris")
                        .reduce((s: number, r: any) => s + (r.total || 0), 0)
                    )}
                  </b>
                </div>
              </div>
            </div>

            {/* Saldo */}
            <div className="p-4 bg-blue-600 text-white rounded shadow">
              <div className="text-sm">Saldo Akhir</div>
              <div className="text-2xl font-bold">
                {formatRp(data.summary.final_balance || 0)}
              </div>
              <div className="mt-3 text-sm space-y-1">
                <div>
                  Saldo Cash:{" "}
                  <b>
                    {formatRp(
                      (data.starting.cash || 0) +
                        (data.income_rows || [])
                          .filter((r: any) => r.payment_method === "cash")
                          .reduce(
                            (s: number, r: any) => s + (r.total || 0),
                            0
                          ) -
                        (data.expense_rows || [])
                          .filter((r: any) => r.payment_method === "cash")
                          .reduce((s: number, r: any) => s + (r.total || 0), 0)
                    )}
                  </b>
                </div>
                <div>
                  Saldo QRIS:{" "}
                  <b>
                    {formatRp(
                      (data.starting.qris || 0) +
                        (data.income_rows || [])
                          .filter((r: any) => r.payment_method === "qris")
                          .reduce(
                            (s: number, r: any) => s + (r.total || 0),
                            0
                          ) -
                        (data.expense_rows || [])
                          .filter((r: any) => r.payment_method === "qris")
                          .reduce((s: number, r: any) => s + (r.total || 0), 0)
                    )}
                  </b>
                </div>
              </div>
            </div>
          </div>

          {/* *********************** PEMASUKAN *********************** */}
          <div className="bg-white rounded shadow p-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg">Pemasukan</h3>
              <select
                value={incomeMethodFilter}
                onChange={(e) => {
                  setIncomeMethodFilter(e.target.value);
                  setIncomePage(1); // Reset ke halaman 1 saat filter berubah
                }}
                className="border rounded px-3 py-2"
              >
                <option value="all">Semua</option>
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-zinc-100 sticky top-0">
                  <tr>
                    <th className="border px-3 py-2">Tanggal</th>
                    <th className="border px-3 py-2">Metode</th>
                    <th className="border px-3 py-2">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedIncomeRows().map((row: any, index: number) => (
                    <tr
                      key={`${row.date}-${row.method}-${index}`}
                      className="hover:bg-zinc-50"
                    >
                      <td className="border px-3 py-2">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="border px-3 py-2">
                        {row.method.toUpperCase()}
                      </td>
                      <td className="border px-3 py-2">
                        {formatRp(row.value)}
                      </td>
                    </tr>
                  ))}
                  {getPaginatedIncomeRows().length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="border px-3 py-2 text-center text-gray-500"
                      >
                        Tidak ada data pemasukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-end items-center gap-2 mt-3">
              <button
                disabled={incomePage === 1}
                onClick={() => setIncomePage(incomePage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Hal {incomePage} dari{" "}
                {Math.ceil(getFilteredIncomeRows() / rowsPerPage) || 1}
              </span>
              <button
                disabled={incomePage * rowsPerPage >= getFilteredIncomeRows()}
                onClick={() => setIncomePage(incomePage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          {/* *********************** PENGELUARAN *********************** */}
          <div className="bg-white rounded shadow p-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg">Pengeluaran</h3>
              <select
                value={expenseMethodFilter}
                onChange={(e) => {
                  setExpenseMethodFilter(e.target.value);
                  setExpensePage(1); // Reset ke halaman 1 saat filter berubah
                }}
                className="border rounded px-3 py-2"
              >
                <option value="all">Semua</option>
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-zinc-100 sticky top-0">
                  <tr>
                    <th className="border px-3 py-2">Tanggal</th>
                    <th className="border px-3 py-2">Metode</th>
                    <th className="border px-3 py-2">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedExpenseRows().map((row: any, index: number) => (
                    <tr
                      key={`${row.date}-${row.method}-${index}`}
                      className="hover:bg-zinc-50"
                    >
                      <td className="border px-3 py-2">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="border px-3 py-2">
                        {row.method.toUpperCase()}
                      </td>
                      <td className="border px-3 py-2">
                        {formatRp(row.value)}
                      </td>
                    </tr>
                  ))}
                  {getPaginatedExpenseRows().length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="border px-3 py-2 text-center text-gray-500"
                      >
                        Tidak ada data pengeluaran
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-end items-center gap-2 mt-3">
              <button
                disabled={expensePage === 1}
                onClick={() => setExpensePage(expensePage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Hal {expensePage} dari{" "}
                {Math.ceil(getFilteredExpenseRows() / rowsPerPage) || 1}
              </span>
              <button
                disabled={expensePage * rowsPerPage >= getFilteredExpenseRows()}
                onClick={() => setExpensePage(expensePage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          {/* *********************** REKAP HARIAN *********************** */}
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-lg mb-3">Rekap Harian</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-zinc-100 sticky top-0">
                  <tr>
                    <th className="border px-3 py-2">Tanggal</th>
                    <th className="border px-3 py-2">Income Cash</th>
                    <th className="border px-3 py-2">Income QRIS</th>
                    <th className="border px-3 py-2">Total Income</th>
                    <th className="border px-3 py-2">Expense Cash</th>
                    <th className="border px-3 py-2">Expense QRIS</th>
                    <th className="border px-3 py-2">Total Expense</th>
                    <th className="border px-3 py-2">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(data.daily, rekapPage).map((d: any) => {
                    const date = d.date;
                    const incomeCash = getIncomeTotalsByDateAndMethod(
                      date,
                      "cash"
                    );
                    const incomeQris = getIncomeTotalsByDateAndMethod(
                      date,
                      "qris"
                    );
                    const totalIncome = incomeCash + incomeQris;

                    const expenseCash = getExpenseTotalsByDateAndMethod(
                      date,
                      "cash"
                    );
                    const expenseQris = getExpenseTotalsByDateAndMethod(
                      date,
                      "qris"
                    );
                    const totalExpense = expenseCash + expenseQris;

                    const net = totalIncome - totalExpense;

                    return (
                      <tr key={`rekap-${date}`} className="hover:bg-zinc-50">
                        <td className="border px-3 py-2">
                          {new Date(date).toLocaleDateString()}
                        </td>
                        <td className="border px-3 py-2">
                          {formatRp(incomeCash)}
                        </td>
                        <td className="border px-3 py-2">
                          {formatRp(incomeQris)}
                        </td>
                        <td className="border px-3 py-2 font-semibold">
                          {formatRp(totalIncome)}
                        </td>
                        <td className="border px-3 py-2">
                          {formatRp(expenseCash)}
                        </td>
                        <td className="border px-3 py-2">
                          {formatRp(expenseQris)}
                        </td>
                        <td className="border px-3 py-2 font-semibold">
                          {formatRp(totalExpense)}
                        </td>
                        <td
                          className={`border px-3 py-2 font-bold ${
                            net >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatRp(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-end items-center gap-2 mt-3">
              <button
                disabled={rekapPage === 1}
                onClick={() => setRekapPage(rekapPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Hal {rekapPage} dari{" "}
                {Math.ceil(data.daily.length / rowsPerPage)}
              </span>
              <button
                disabled={rekapPage * rowsPerPage >= data.daily.length}
                onClick={() => setRekapPage(rekapPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
