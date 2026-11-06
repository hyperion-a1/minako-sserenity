import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env["DISCORD_CLIENT_ID"];
        if (!clientId) return new Response("Login com Discord ainda não configurado.", { status: 503 });
        const origin = new URL(request.url).origin;
        const state = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
        const params = new URLSearchParams({
          client_id: clientId,
          response_type: "code",
          scope: "identify guilds",
          redirect_uri: `${origin}/auth/callback`,
          state,
          prompt: "none",
        });
        return new Response(null, {
          status: 302,
          headers: {
            Location: `https://discord.com/oauth2/authorize?${params}`,
            "Set-Cookie": `minako_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
