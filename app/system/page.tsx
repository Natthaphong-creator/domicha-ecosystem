import { redirect } from "next/navigation";

export default function SystemEntryPage() {
  redirect("/login?next=/dashboard");
}
