import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import type { AppPage } from "../types";

type Props = {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  children: ReactNode;
};

export function AppShell({ page, onNavigate, children }: Props) {
  const showNav = !["top", "onboarding"].includes(page);
  const shellClassName = page === "result" ? "app-shell app-shell-wide" : "app-shell";

  return (
    <div className="app-bg">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <main className={shellClassName}>
        {children}
        {showNav ? <BottomNav currentPage={page} onNavigate={onNavigate} /> : null}
      </main>
    </div>
  );
}
