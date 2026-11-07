import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/personalidade")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/personalidade", statusCode: 301 });
  },
});
