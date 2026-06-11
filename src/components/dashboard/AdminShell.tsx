/**
 * Backward-compat shim. New code should import `DashboardShell` directly:
 *   import { DashboardShell } from "@/components/dashboard/DashboardShell";
 *   import { PCard, PPanel } from "@/components/dashboard/primitives";
 */
import * as React from "react";
import {
  DashboardShell,
  type AdminActive as DashboardAdminActive,
} from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";

export type AdminActive = DashboardAdminActive;

export function AdminShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: AdminActive;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      role="admin"
      active={active}
      title={title}
      subtitle={subtitle}
      actions={actions}
    >
      {children}
    </DashboardShell>
  );
}

// ACard / APanel are visually identical to PCard / PPanel. Re-exported under
// their original names so existing admin routes don't need to change imports.
export const ACard = PCard;
export const APanel = PPanel;
