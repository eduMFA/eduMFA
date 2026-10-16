import type { PropsWithChildren, ReactNode } from "react";

export interface CardProps {
  actions?: ReactNode;
  className?: string | undefined;
  /** Removes the body padding, e.g. for a table that fills the card. */
  flush?: boolean;
  footer?: ReactNode;
  footerAlign?: "center" | "start";
  title?: ReactNode;
}

export function Card({
  actions,
  children,
  className,
  flush = false,
  footer,
  footerAlign = "start",
  title
}: PropsWithChildren<CardProps>) {
  const classNames = ["react-card", flush ? "react-card--flush" : "", className ?? ""]
    .filter((name) => name.length > 0)
    .join(" ");
  const footerClassNames =
    footerAlign === "center"
      ? "react-card__footer react-card__footer--center"
      : "react-card__footer";

  return (
    <section className={classNames}>
      {title || actions ? (
        <div className="react-card__header">
          {title ? <h3 className="react-card__title">{title}</h3> : <span />}
          {actions ? <div className="react-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="react-card__body">{children}</div>
      {footer ? <div className={footerClassNames}>{footer}</div> : null}
    </section>
  );
}
