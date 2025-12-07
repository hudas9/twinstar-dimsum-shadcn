"use server";
import IncomeForm from "@/components/IncomeForm";
import { supabaseServer } from "@/lib/supabaseServer";

interface IncomePage {
  params: Promise<{ id: string }>;
}

async function getIncome(id: number) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error("Income not found");
  }
  return data;
}

export default async function EditIncomePage({ params }: IncomePage) {
  const { id } = await params;
  const income = await getIncome(parseInt(id));

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Edit Income</h1>
        <IncomeForm initialData={income} isEdit={true} />
      </div>
    </div>
  );
}
