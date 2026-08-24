import "server-only";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Returns the authenticated session or redirects to /login.
 * Always derives userId from the server-side session — never from the client.
 */
export async function getRequiredSession() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

/**
 * Returns the authenticated user ID or redirects to /login.
 */
export async function getRequiredUserId(): Promise<string> {
  const session = await getRequiredSession();
  return session.user.id;
}
