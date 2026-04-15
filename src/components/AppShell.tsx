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

  return (
    <div className="app-bg">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <main className="app-shell">
        {children}
        {showNav ? <BottomNav currentPage={page} onNavigate={onNavigate} /> : null}
      </main>
    </div>
  );
}
