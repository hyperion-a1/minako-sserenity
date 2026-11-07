# Reformulação Minako Aino — Auditoria e plano por etapas

## 1. Auditoria da estrutura atual

### Rotas (13, todas preservadas)
| Rota | O que é hoje |
|---|---|
| `/` | Visão geral do painel (resumo, lista compacta de recursos com interruptores) |
| `/semana` | Semana e ciclo (dia da virada, horário e fuso) |
| `/canais` | Canais usados pela Minako |
| `/noturno` | Modo Noturno (usa a imagem da Minako dormindo) |
| `/personalidade` | Personalidade da Minako |
| `/cargos` | Cargos |
| `/matchmaking` | Matchmaking |
| `/sorteios` | Sorteios (detalhado abaixo) |
| `/tiktok` | Integração TikTok (configuração enviada ao bot) |
| `/termos`, `/privacidade` | Textos legais lidos de arquivos .txt |
| `/auth/login`, `/auth/callback` | Login com Discord (rotas de servidor) |

Todas as páginas do painel ficam dentro de um invólucro único (menu lateral, barra inferior no celular, busca Ctrl+K, barra de salvar, barra de rolagem, controle de som). Hoje não existe landing page: `/` já é o painel.

### Componentes principais
- Invólucro e navegação: app-shell, navigator (busca, recentes, menu por categorias, abas inferiores), page-header (chips de seção, recolher/abrir tudo, modo foco), scroll-progress, save-bar, audio-control, effects.
- Campos: fields (SectionCard recolhível com resumo, seletores de canal/cargo, data, números, interruptores).
- Sorteios: giveaway-message-editor, giveaway-message-preview, giveaway-live, discord-message.
- Legal: legal-page.
- Mascote: `minako-mascot.webp` (usada no app-shell e no início) e `minako-sleeping.webp` (Modo Noturno).

### Integrações e autenticação (reais, existentes)
- Login Discord OAuth no próprio site; token guardado em cookie seguro (SESSION_SECRET). Endereço de retorno calculado por origin.server (publicado + preview).
- API do bot no Shardweb (MINAKO_API_URL), chamada só por funções de servidor: sessão, lista de servidores, carregar/salvar configuração, dados do servidor (canais/cargos, com explicação de erro 502 e nova tentativa), modelos de sorteio, sorteios ativos, publicar/agendar e cancelar.
- Sons gerados no navegador (sem arquivos); música nunca começa sozinha.
- Não há Lovable Cloud, banco próprio nem armazenamento de arquivos neste projeto.

### O que persiste de verdade x o que é demonstração
| Recurso | Logado (modo "live") | Sem login (modo "demo") |
|---|---|---|
| Configurações de todos os módulos | Salvas no banco do bot via API | Só no navegador (localStorage) |
| Canais e cargos | Lidos do Discord pelo bot | Servidores fictícios (DEMO_GUILDS) |
| Modelos de sorteio | Salvos no bot | Indisponível (aviso "Entre com o Discord") |
| Publicar/agendar/cancelar sorteio | Real, no Discord | Indisponível |
| Lista de sorteios no ar | Real | Indisponível |
| Servidor escolhido, seções recolhidas, recentes, modo foco, som | Só no navegador | Só no navegador |

### Página /sorteios em detalhe
- Seções: Ligado/desligado; O básico (nome, ganhadores, mín/máx); Quando e onde (imediato/agendado, duração ou fim personalizado, canal, fixar, tópico privado); Quem pode participar (cargos permitidos/bloqueados, escopo, intervalo de vitória); Anúncio (mensagem simples ou blocos V2, cor, prévia estilo Discord com emojis personalizados e variáveis como {winners}); Ao vivo (modelos, publicar/agendar, lista e cancelamento).
- Regras validadas em validation.ts, cobertas por testes.
- Pendência conhecida: publicar e salvar modelos com blocos V2 dependem do bot anunciar suporte (`giveawayMessageV2`). Isso fica bloqueado até a API do Shardweb ser atualizada.
- Riscos ao mexer: a prévia depende das variáveis e do mapeamento painel↔bot; pausas de 1,1 s entre chamadas evitam limite de pedidos; o rascunho é compartilhado com o salvamento geral da configuração.

## 2. Direção proposta

```text
/                landing pública (sem login): Minako, recursos reais, convite, entrar
/painel          visão geral do painel (o atual "/")
/painel/<módulo> páginas do painel
/semana, /sorteios, ... (antigas) -> continuam abrindo, redirecionando para /painel/...
/termos, /privacidade, /auth/*  inalteradas
```
Nenhuma rota existente é removida: as antigas passam a encaminhar para o novo endereço (links salvos continuam funcionando). `/auth/callback` não muda, então nada precisa ser alterado no Discord.

## 3. Etapas

**Etapa 1 — Identidade Magical Girl (sem mudar funções)**
Novas cores, fontes, formas (estrelas, laços, brilhos), animações suaves que respeitam "reduzir movimento". Depende de: nada. Risco: contraste e legibilidade no celular; checar em 320–411 px.

**Etapa 2 — Separar painel em /painel**
Mover as páginas do painel para `/painel/...`, invólucro do painel só nessas rotas, redirecionamentos nas rotas antigas, atualizar menu, busca e chips. Depende de: etapa 1 opcional. Risco: links internos, recentes salvos com endereço antigo (converter), retorno após login deve levar ao painel.

**Etapa 3 — Landing page pública em /**
Seções com a Minako: apresentação, recursos que realmente existem (os 8 módulos), como funciona, botão "Entrar com Discord" e "Abrir demonstração". Título/descrição próprios para compartilhamento. O botão "Adicionar ao servidor" só entra se você me passar o link de convite real. Risco: não inventar números, depoimentos ou funções.

**Etapa 4 — Mascote integrada**
A Minako reage aos estados já existentes: carregando, salvo com sucesso, erro do bot, modo demonstração, servidor vazio, Modo Noturno. Usa as duas imagens atuais; poses novas só se você aprovar a geração.

**Etapa 5 — Android em primeiro lugar**
Alvos de toque de 44 px+, barra inferior com área segura, botão de salvar ao alcance do polegar, teclado não cobrir campos, prévia do sorteio em aba própria no celular, testes em 320/360/411 px. Opcional depois: tornar instalável (PWA).

**Etapa 6 — Sorteios reorganizado**
Mesmos campos e regras, organizado em passos (Básico → Quando → Quem → Anúncio → Publicar) com prévia fixa/alternável no celular. Sem alterar o que é enviado ao bot.

**Etapa 7 — Verificação**
Testes existentes (regras, mapeamento, foco, origem, emojis) passando; login real; carregar e salvar um servidor; criar modelo; conferir modo demonstração.

## 4. Precisa ser preservado
- Login Discord, cookie de sessão, endereço de retorno e as 4 chaves secretas.
- Todas as chamadas à API do bot e o formato enviado (mapeamento único).
- Regras de validação e seus testes.
- Modo demonstração no navegador para quem não está logado.
- Busca, recentes, modo foco, resumo de seções recolhidas, barra de rolagem, sons.
- Textos legais em .txt.
- Bloqueio de publicação V2 até o bot dar suporte.

## 5. Dependências externas e pendências
- Atualização da API do bot no Shardweb (V2) — depende de você.
- Link de convite do bot e textos de apresentação reais para a landing — depende de você.
- Cada etapa precisa de novo Publish para ir ao ar.

## Detalhes técnicos
- Novos arquivos de rota `src/routes/painel.tsx` (layout com `<Outlet />` e AppShell/DashboardProvider) + `painel.index.tsx` e `painel.<módulo>.tsx`; rotas antigas viram `beforeLoad: redirect` para o equivalente.
- `__root.tsx` deixa de envolver tudo no AppShell; landing e páginas legais ficam fora.
- `modules.ts` `to` passa para `/painel/...`; `sections.ts` migra recentes antigos.
- `auth/callback` redireciona para `/painel`.
- Tokens de cor/fonte em `styles.css`; registrar a decisão de estrutura no AGENTS.md.
