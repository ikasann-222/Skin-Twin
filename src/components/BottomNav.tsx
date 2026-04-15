import type { AppPage } from "../types";

const items: { id: AppPage; label: string }[] = [
  { id: "dashboard", label: "Twin" },
  { id: "product", label: "Product" },
  { id: "result", label: "Result" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" },
];

type Props = {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
};

export function BottomNav({ currentPage, onNavigate }: Props) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === currentPage ? "nav-pill active" : "nav-pill"}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
