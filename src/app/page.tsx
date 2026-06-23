import { redirect } from "next/navigation";
import { getSessionFromStore } from "@/lib/session";

export default async function RootPage() {
  const session = await getSessionFromStore();
  if (session) {
    redirect("/dashboard");
  }
  redirect("/login");
}
