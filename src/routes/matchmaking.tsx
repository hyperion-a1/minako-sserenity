import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/matchmaking")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/matchmaking", statusCode: 301 });
  },
});
