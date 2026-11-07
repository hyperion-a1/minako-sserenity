import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/cargos")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/cargos", statusCode: 301 });
  },
});
