import { google } from "googleapis";
import { prisma } from "@/lib/db/prisma";

export function getOAuth2Client(requestOrigin?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Determine base URL dynamically or from environment
  let appUrl = requestOrigin;
  if (!appUrl) {
    if (process.env.NEXTAUTH_URL) {
      appUrl = process.env.NEXTAUTH_URL;
    } else if (process.env.AUTH_URL) {
      appUrl = process.env.AUTH_URL;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      appUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      appUrl = "http://localhost:3000";
    }
  }

  const cleanAppUrl = appUrl.replace(/\/+$/, "");
  const redirectUri = `${cleanAppUrl}/api/gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth credentials missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Returns a ready-to-use Gmail API client with refreshed credentials for a specific user.
 */
export async function getAuthenticatedGmailClient(userId: string, requestOrigin?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
      googleConnected: true,
      googleEmail: true,
    },
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error("Google account is not connected. Please connect your Google account first.");
  }

  const oauth2Client = getOAuth2Client(requestOrigin);

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken ?? undefined,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined,
  });

  // Listen for automatic token refreshes by the googleapis client
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
        },
      });
    }
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return { gmail, userEmail: user.googleEmail };
}
