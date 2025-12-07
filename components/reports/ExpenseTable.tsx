"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function ExpenseTable({
  rows,
  page,
  totalRows,
  perPage,
  method,
  setMethod,
  setPage,
  formatRp,
}: any) {
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Pengeluaran</h3>

        <Select
          value={method}
          onValueChange={(v) => {
            setMethod(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter metode" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="qris">QRIS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Nominal</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  Tidak ada data pengeluaran
                </TableCell>
              </TableRow>
            )}

            {rows.map((r: any, index: number) => (
              <TableRow key={index}>
                <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                <TableCell className="uppercase">{r.payment_method}</TableCell>
                <TableCell>{formatRp(r.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && setPage(page - 1)}
              className={page === 1 ? "pointer-events-none opacity-40" : ""}
            />
          </PaginationItem>

          <span className="px-4 py-2 text-sm">
            Halaman {page} / {totalPages}
          </span>

          <PaginationItem>
            <PaginationNext
              onClick={() => page < totalPages && setPage(page + 1)}
              className={
                page === totalPages ? "pointer-events-none opacity-40" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
