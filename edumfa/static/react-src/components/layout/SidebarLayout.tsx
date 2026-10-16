import type { PropsWithChildren, ReactNode } from "react";

export interface SidebarLayoutProps {
  sidebar: ReactNode;
}

/**
 * Two-column shell replacing the legacy `user.html` / `machine.html` parent
 * views: a sticky navigation card on the left and the routed page on the
 * right. Collapses to one column on narrow screens.
 */
export function SidebarLayout({
  children,
  sidebar
}: PropsWithChildren<SidebarLayoutProps>) {
  return (
    <div className="react-migration-shell">
      <div className="react-layout">
        <aside className="react-layout__sidebar">
          <nav className="pa-sidebar">{sidebar}</nav>
        </aside>
        <main className="react-layout__main">{children}</main>
      </div>
    </div>
  );
}
