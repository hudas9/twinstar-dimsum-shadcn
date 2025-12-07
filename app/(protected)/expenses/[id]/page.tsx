import ExpenseForm from "@/components/ExpenseForm";
import { supabaseServer } from "@/lib/supabaseServer";

interface IncomePage {
  params: Promise<{ id: string }>;
}

async function getExpense(id: number) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error("Expense not found");
  }
  return data;
}

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await getExpense(parseInt(id));

  if (!expense || expense.error) {
    return (
      <div className="p-6">
        <div className="text-rose-600">Expense not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Expense</h1>
      </div>
      <ExpenseForm initialData={expense} isEdit={true} />
    </div>
  );
}
