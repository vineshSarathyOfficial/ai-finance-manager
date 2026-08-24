import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth/session";
import { getOAuth2Client } from "@/lib/gmail/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getRequiredSession();
    const userId = session.user.id;

    const url = new URL(request.url);
    const origin = url.origin;
    const returnTo = url.searchParams.get("returnTo") || "/import";

    const oauth2Client = getOAuth2Client(origin);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state: JSON.stringify({ userId, returnTo, origin }),
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[GmailConnect] Error:", error);
    return NextResponse.redirect(new URL("/import?error=gmail_connect_failed", request.url));
  }
}
