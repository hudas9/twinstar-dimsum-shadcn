"use server";
import MemberForm from "@/components/MemberForm";
import { supabaseServer } from "@/lib/supabaseServer";

interface MemberPage {
  params: Promise<{ id: string }>;
}

async function getMember(id: number) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error("Member not found");
  }
  return data;
}

export default async function EditMemberPage({ params }: MemberPage) {
  const { id } = await params;
  const member = await getMember(parseInt(id));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit Member</h1>
      </div>
      <MemberForm initialData={member} isEdit={true} />
    </div>
  );
}
