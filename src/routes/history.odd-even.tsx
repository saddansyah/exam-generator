import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/history/odd-even")({
  component: () => <Outlet />,
});
