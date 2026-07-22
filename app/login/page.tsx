import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  redirect("/");
}
