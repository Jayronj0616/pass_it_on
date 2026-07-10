import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewItemFormClient } from "./NewItemFormClient";

export default async function NewItemPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <NewItemFormClient userId={user.id} />;
}
