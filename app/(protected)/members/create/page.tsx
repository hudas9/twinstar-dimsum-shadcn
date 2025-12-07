import MemberForm from "@/components/MemberForm";

export default function CreateMemberPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Create Member</h1>
      </div>
      <MemberForm />
    </div>
  );
}
