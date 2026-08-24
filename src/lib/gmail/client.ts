import { google } from "googleapis";
import { prisma } from "@/lib/db/prisma";

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth credentials missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Returns a ready-to-use Gmail API client with refreshed credentials for a specific user.
 */
export async function getAuthenticatedGmailClient(userId: string) {
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

  const oauth2Client = getOAuth2Client();

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
