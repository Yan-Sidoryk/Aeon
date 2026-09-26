import { DashboardShell } from "@/components/app/dashboard/DashboardShell";

type Props = { children: React.ReactNode; params: Promise<{ productId: string }> };

/**
 * One drug's dashboard. Its data belongs to the caller's session (a header only the browser sends), so the shell
 * loads it client-side; an id that isn't a number gets the same "can't find this drug" panel as a foreign one.
 */
export default async function ProductDashboardLayout({ children, params }: Props) {
  const id = Number((await params).productId);
  return <DashboardShell productId={Number.isInteger(id) && id > 0 ? id : null}>{children}</DashboardShell>;
}
