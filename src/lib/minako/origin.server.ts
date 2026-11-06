// Endereço público do site para o redirect_uri do Discord.
// Atrás do proxy da Lovable, request.url aponta para um host interno (http://localhost),
// então usamos os cabeçalhos encaminhados — só para hosts conhecidos.
const PRIMARY = "https://archive-app-porter.lovable.app";
const PROJECT_ID = "a1bec8e3-df32-4a3d-af41-606160d49e50";

function allowed(host: string) {
  const h = host.toLowerCase();
  if (h === "archive-app-porter.lovable.app") return true;
  if (h === `project--${PROJECT_ID}.lovable.app` || h === `project--${PROJECT_ID}-dev.lovable.app`) return true;
  if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--a1bec8e3-df32-4a3d-af41-606160d49e50\.lovable\.app$/.test(h)) return true;
  return false;
}

export function publicOrigin(request: Request) {
  const url = new URL(request.url);
  const fwd = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  for (const host of [fwd, url.host]) {
    if (host && allowed(host)) return `https://${host}`;
  }
  if (url.hostname === "localhost" && !fwd) return url.origin;
  return PRIMARY;
}
