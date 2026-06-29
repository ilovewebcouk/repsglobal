// Admin v2 — root layout.
//
// Provides the sidebar shell + breadcrumbs + pinned Member Finder header for
// every /admin/v2/* page. Children render their own content body inside
// <Outlet />; they no longer need DashboardShell.

import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Fragment } from "react";
import { requireRole } from "@/lib/route-gates";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AdminSidebar } from "@/components/admin/v2/AdminSidebar";
import { MemberFinder } from "@/components/ops/MemberFinder";

export const Route = createFileRoute("/admin_/v2")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminV2Layout,
});

const LABELS: Record<string, string> = {
  v2: "Admin",
  members: "Members",
  billing: "Billing",
  churn: "Churn",
  reconciliation: "Reconciliation",
  ops: "Operations",
  support: "Support",
};

function AdminV2Layout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // /admin/v2/members/abc123 → ["admin","v2","members","abc123"]
  const parts = pathname.split("/").filter(Boolean);
  const v2Index = parts.indexOf("v2");
  const crumbs =
    v2Index === -1
      ? []
      : parts.slice(v2Index).map((seg, i, arr) => {
          const to = "/" + parts.slice(0, v2Index + i + 1).join("/");
          const isLast = i === arr.length - 1;
          const label = LABELS[seg] ?? (seg.length > 16 ? `${seg.slice(0, 8)}…` : seg);
          return { to, label, isLast };
        });

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((c, i) => (
                <Fragment key={c.to}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {c.isLast ? (
                      <BreadcrumbPage>{c.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={c.to}>{c.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto w-full max-w-md">
            <MemberFinder
              target="/admin/v2/members/$userId"
              placeholder="Find member · email, cus_, sub_, BD id…"
            />
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
