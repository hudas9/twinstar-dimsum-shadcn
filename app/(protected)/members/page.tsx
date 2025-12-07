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

type Member = {
  id: string;
  name: string;
  whatsapp_number?: string;
};

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);

  async function fetchData() {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });

    setMembers(data || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function deleteMember(id: string) {
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to delete");
        return;
      }

      setMembers((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Members</h1>

        <Button asChild>
          <Link href="/members/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Link>
        </Button>
      </div>

      {/* Card Wrapper */}
      <Card>
        <CardHeader>
          <CardTitle>Member List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Whatsapp Number</TableHead>
                  <TableHead className="text-center w-[120px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-sm text-muted-foreground"
                    >
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/30">
                      <TableCell>{member.name}</TableCell>

                      <TableCell>{member.whatsapp_number || "-"}</TableCell>

                      {/* ACTIONS */}
                      <TableCell className="text-center space-x-2">
                        {/* Edit */}
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/members/${member.id}`}>
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
                                Delete this member?
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
                                onClick={() => deleteMember(member.id)}
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
