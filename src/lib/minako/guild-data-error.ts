/** Traduz o erro do bot ao ler canais/cargos (ex.: "channels: HTTP 403") em uma dica amigável. */
export function explainGuildDataError(raw: string): string {
  const code = Number(/HTTP (\d{3})/.exec(raw)?.[1] ?? 0);
  if (code === 401)
    return "O token da Minako (MINAKO_TOKEN) no servidor do bot está errado ou foi trocado. Gere um novo no Discord Developer Portal → Bot → Reset Token e atualize no Shardweb.";
  if (code === 403 || code === 404)
    return "A Minako não está neste servidor ou perdeu a permissão de ver canais. Convide-a de novo (ou dê a ela o cargo com 'Ver canais') e tente outra vez.";
  if (code === 429) return "O Discord pediu uma pausa para a Minako. Espere alguns segundos e recarregue a página.";
  if (/MINAKO_TOKEN/.test(raw)) return "O bot está sem o MINAKO_TOKEN configurado no Shardweb.";
  if (/timeout|abort/i.test(raw)) return "O Discord demorou demais para responder. Tente recarregar daqui a pouco.";
  return `A Minako não conseguiu ler os canais e cargos deste servidor. (${raw})`;
}
