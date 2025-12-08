"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Income = {
  id: string;
  title: string;
  payment_method: string;
  amount: number;
  date: string;
};

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);

  async function fetchData() {
    const { data } = await supabase
      .from("incomes")
      .select("*")
      .order("created_at", { ascending: false });

    setIncomes(data || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function deleteIncome(id: string) {
    try {
      const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to delete");
        return;
      }

      setIncomes((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Incomes</h1>

        <Button asChild>
          <Link href="/incomes/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Income
          </Link>
        </Button>
      </div>

      {/* Card Wrapper */}
      <Card>
        <CardHeader>
          <CardTitle>Income List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-center">Payment Method</TableHead>
                  <TableHead className="text-center">Amount</TableHead>
                  <TableHead className="text-center w-[120px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {incomes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-sm text-muted-foreground"
                    >
                      No income found
                    </TableCell>
                  </TableRow>
                ) : (
                  incomes.map((income) => (
                    <TableRow key={income.id} className="hover:bg-muted/30">
                      <TableCell className="text-center">
                        {new Date(income.date).toLocaleDateString()}
                      </TableCell>

                      <TableCell>{income.title}</TableCell>

                      <TableCell className="text-center">
                        {income.payment_method}
                      </TableCell>

                      <TableCell className="font-medium text-center">
                        Rp {income.amount.toLocaleString()}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="text-center space-x-2">
                        {/* Edit */}
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/incomes/${income.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>

                        {/* Delete AlertDialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this income?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The record will be
                                permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>

                              <AlertDialogAction
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => deleteIncome(income.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
