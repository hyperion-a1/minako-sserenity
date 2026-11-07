import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2, Gift, Star } from "lucide-react";

import { MinakoTip, RolePicker, SectionCard, single } from "@/components/minako/fields";
import { NAV_ITEMS } from "@/components/minako/modules";
import { PageHeader } from "@/components/minako/page-header";
import { useDashboard } from "@/lib/minako/store";

export const Route = createFileRoute("/painel/cargos")({
  head: () => ({
    meta: [
      { title: "Cargos e permissões — Minako Aino" },
      { name: "description", content: "Defina o cargo da Estrela da Semana e quem pode administrar partidas e sorteios." },
      { property: "og:title", content: "Cargos e permissões — Minako Aino" },
      { property: "og:description", content: "Quem brilha e quem ajuda a organizar o servidor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const { draft, update } = useDashboard();
  const r = draft.roles;
  const nav = NAV_ITEMS.find((n) => n.id === "cargos")!;
  return (
    <div className="space-y-5">
      <PageHeader item={nav} subtitle="Quem brilha na semana e quem ajuda a Minako a organizar as coisas." />

      <SectionCard
        title="Estrela da Semana"
        description="Cargo que a Minako entrega para quem mais participou na semana."
        icon={Star}
        tone="bg-primary text-primary-foreground"
      >
        <RolePicker
          label="Cargo da Estrela"
          multiple={false}
          value={single.toList(r.star)}
          onChange={(l) => update("roles", { star: single.fromList(l) })}
          placeholder="Escolher cargo"
        />
      </SectionCard>

      <SectionCard
        title="Administração de partidas"
        description="Podem ver rotas, adicionar, remover e concluir partidas."
        icon={Gamepad2}
        tone="bg-mint text-mint-foreground"
        delay={60}
      >
        <RolePicker
          label="Cargos administradores"
          value={r.matchAdmins}
          onChange={(l) => update("roles", { matchAdmins: l })}
        />
      </SectionCard>

      <SectionCard
        title="Criação de sorteios"
        description="Quem pode criar e gerenciar sorteios além da administração."
        icon={Gift}
        tone="bg-ribbon text-ribbon-foreground"
        delay={120}
      >
        <RolePicker
          label="Cargos que criam sorteios"
          value={r.giveawayCreators}
          onChange={(l) => update("roles", { giveawayCreators: l })}
        />
        <MinakoTip>Quem é administrador do servidor sempre tem acesso a tudo, tá bom? 🛡️</MinakoTip>
      </SectionCard>
    </div>
  );
}
