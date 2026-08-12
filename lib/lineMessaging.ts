let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getLineChannelAccessToken() {
  const staticToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (staticToken) return staticToken;

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelId || !channelSecret) return "";

  const response = await fetch("https://api.line.me/v2/oauth/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: channelId,
      client_secret: channelSecret
    })
  });

  const data = await response.json() as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    console.error("LINE channel access token request failed", response.status, data.error || data.error_description || data);
    return "";
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in || 0) * 1000
  };
  return cachedAccessToken.token;
}
