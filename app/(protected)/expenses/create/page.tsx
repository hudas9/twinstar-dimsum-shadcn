import ExpenseForm from "@/components/ExpenseForm";

export default function CreateExpensePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Add Expense</h1>
      <ExpenseForm />
    </div>
  );
}
