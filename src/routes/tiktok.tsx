import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: continua funcionando e leva ao painel.
export const Route = createFileRoute("/tiktok")({
  beforeLoad: () => {
    throw redirect({ to: "/painel/tiktok", statusCode: 301 });
  },
});
