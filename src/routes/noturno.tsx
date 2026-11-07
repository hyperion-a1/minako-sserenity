import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/noturno")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/noturno", statusCode: 301 });
  },
});
