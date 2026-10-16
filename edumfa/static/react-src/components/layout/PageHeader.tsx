import type { ReactNode } from "react";

export interface PageHeaderProps {
  actions?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}

export function PageHeader({ actions, subtitle, title }: PageHeaderProps) {
  return (
    <header className="react-page-header">
      <div>
        <h2 className="react-page-title">{title}</h2>
        {subtitle ? <p className="react-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="react-page-header__actions">{actions}</div> : null}
    </header>
  );
}
