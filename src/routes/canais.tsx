import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/canais")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/canais", statusCode: 301 });
  },
});
