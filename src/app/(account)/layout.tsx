import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/api/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.status === "Disabled") {
    redirect("/login");
  }

  return <>{children}</>;
}
