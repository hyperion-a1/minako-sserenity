import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/semana")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/semana", statusCode: 301 });
  },
});
