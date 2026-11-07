import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/sorteios")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/sorteios", statusCode: 301 });
  },
});
