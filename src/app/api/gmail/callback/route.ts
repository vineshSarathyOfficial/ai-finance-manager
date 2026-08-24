import { NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/gmail/client";
import { prisma } from "@/lib/db/prisma";
import { getRequiredUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const stateRaw = url.searchParams.get("state");

  let returnTo = "/import";
  let stateUserId: string | null = null;
  let origin = url.origin;

  if (stateRaw) {
    try {
      const stateObj = JSON.parse(stateRaw);
      returnTo = stateObj.returnTo || "/import";
      stateUserId = stateObj.userId;
      if (stateObj.origin) {
        origin = stateObj.origin;
      }
    } catch {
      // Ignored
    }
  }

  if (error || !code) {
    return NextResponse.redirect(new URL(`${returnTo}?error=google_auth_cancelled`, request.url));
  }

  try {
    let userId = stateUserId;
    if (!userId) {
      userId = await getRequiredUserId();
    }

    const oauth2Client = getOAuth2Client(origin);
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    let googleEmail: string | null = null;
    if (tokens.access_token) {
      try {
        const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);
        googleEmail = tokenInfo.email || null;
      } catch (err) {
        console.warn("[GmailCallback] Could not retrieve email from token info:", err);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleConnected: true,
        googleEmail,
        googleAccessToken: tokens.access_token ?? undefined,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });

    return NextResponse.redirect(new URL(`${returnTo}?gmail=connected`, request.url));
  } catch (err) {
    console.error("[GmailCallback] Error exchanging code for tokens:", err);
    return NextResponse.redirect(new URL(`${returnTo}?error=gmail_auth_failed`, request.url));
  }
}
