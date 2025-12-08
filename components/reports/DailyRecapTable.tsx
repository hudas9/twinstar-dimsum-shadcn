"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DailyRecap = {
  date: string;
  revenue: number | null | undefined;
  incomes: number | null | undefined;
  expenses: number | null | undefined;
};

export function DailyRecapTable({ rows = [], formatRp }: any) {
  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h3 className="font-semibold text-lg">Rekap Harian</h3>

      <div className="overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Income Cash</TableHead>
              <TableHead>Income Qris</TableHead>
              <TableHead>Total Income</TableHead>
              <TableHead>Expense Cash</TableHead>
              <TableHead>Expense Qris</TableHead>
              <TableHead>Total Expense</TableHead>
              <TableHead>Net</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {(!rows || rows.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}

            {rows.map((r: any, index: number) => {
              return (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(r.date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{formatRp(r.income_cash)}</TableCell>
                  <TableCell>{formatRp(r.income_qris)}</TableCell>
                  <TableCell>{formatRp(r.total_income)}</TableCell>
                  <TableCell>{formatRp(r.expense_cash)}</TableCell>
                  <TableCell>{formatRp(r.expense_qris)}</TableCell>
                  <TableCell>{formatRp(r.total_expense)}</TableCell>
                  <TableCell>{formatRp(r.net)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
