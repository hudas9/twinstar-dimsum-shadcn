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

type Expense = {
  id: string;
  title: string;
  payment_method: string;
  amount: number;
  created_at: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  async function fetchData() {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    setExpenses(data || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function deleteExpense(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to delete");
        return;
      }

      setExpenses((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Expenses</h1>

        <Button asChild>
          <Link href="/incomes/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Card Wrapper */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
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
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-sm text-muted-foreground"
                    >
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/30">
                      <TableCell className="text-center">
                        {new Date(expense.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell>{expense.title}</TableCell>

                      <TableCell className="text-center">
                        {expense.payment_method}
                      </TableCell>

                      <TableCell className="font-medium text-center">
                        Rp {expense.amount.toLocaleString()}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="text-center space-x-2">
                        {/* Edit */}
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/expenses/${expense.id}`}>
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
                                Delete this expense?
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
                                onClick={() => deleteExpense(expense.id)}
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
