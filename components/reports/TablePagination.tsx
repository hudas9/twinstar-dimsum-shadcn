"use client";
import { Button } from "@/components/ui/button";

export default function TablePagination({
  page,
  total,
  perPage,
  onChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}) {
  const maxPage = Math.ceil(total / perPage) || 1;

  return (
    <div className="flex justify-end items-center gap-2 mt-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </Button>

      <span className="text-sm">
        Hal {page} dari {maxPage}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= maxPage}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
