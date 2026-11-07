import { createFileRoute } from "@tanstack/react-router";

const back = (reason?: string) =>
  new Response(null, { status: 302, headers: { Location: reason ? `/painel?login=${reason}` : "/painel", "Cache-Control": "no-store" } });

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { readSessionState, finishLogin } = await import("@/lib/minako/oauth.server");
        const url = new URL(request.url);
        if (url.searchParams.get("error")) return back("cancelado");
        const code = url.searchParams.get("code") ?? "";
        const state = url.searchParams.get("state") ?? "";
        if (!code || code.length > 4096 || !state || state !== readSessionState()) return back("erro");
        try {
          const { publicOrigin } = await import("@/lib/minako/origin.server");
          await finishLogin(code, `${publicOrigin(request)}/auth/callback`);
          return back();
        } catch (e) {
          console.error("[Login] Falha:", e instanceof Error ? e.message : e);
          return back("erro");
        }
      },
    },
  },
});
