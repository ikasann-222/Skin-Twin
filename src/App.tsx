import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProductPage } from "./pages/ProductPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResultPage } from "./pages/ResultPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SkinScanPage } from "./pages/SkinScanPage";
import { TopPage } from "./pages/TopPage";
import { simulateProduct } from "./services/simulationEngine";
import type { AppPage, Product, SimulationResult } from "./types";
import {
  clearAllStorage,
  loadProducts,
  loadProfile,
  loadSimulationResults,
  loadSkinScan,
  saveProducts,
  saveProfile,
  saveSimulationResults,
  saveSkinScan,
} from "./utils/storage";

function isAppPage(value: string): value is AppPage {
  return ["top", "onboarding", "profile", "scan", "dashboard", "product", "result", "history", "settings"].includes(
    value,
  );
}

export default function App() {
  const [page, setPage] = useState<AppPage>("top");
  const [entryMode, setEntryMode] = useState<"fresh" | "edit">("fresh");
  const [profile, setProfile] = useState(loadProfile);
  const [skinScan, setSkinScan] = useState(loadSkinScan);
  const [products, setProducts] = useState(loadProducts);
  const [results, setResults] = useState(loadSimulationResults);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const effectiveProfile = profile ?? loadProfile();
  const effectiveSkinScan = skinScan ?? loadSkinScan();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.location.hash = page;
  }, [page, selectedResultId]);

  useEffect(() => {
    function syncPageFromHash() {
      const nextPage = window.location.hash.replace("#", "");
      if (isAppPage(nextPage)) {
        setPage(nextPage);
      }
    }

    window.addEventListener("hashchange", syncPageFromHash);
    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, []);

  useEffect(() => {
    if (!effectiveProfile && page !== "top" && page !== "onboarding" && page !== "profile") {
      setPage("onboarding");
      return;
    }

    if (effectiveProfile && !effectiveSkinScan && !["top", "profile", "scan"].includes(page)) {
      setPage("scan");
    }
  }, [effectiveProfile, effectiveSkinScan, page]);

  const selectedResult = useMemo(
    () => results.find((item) => item.id === selectedResultId) ?? results[0] ?? null,
    [results, selectedResultId],
  );

  function handleSaveProfile(nextProfile: NonNullable<typeof profile>) {
    setProfile(nextProfile);
    saveProfile(nextProfile);
    setPage("scan");
  }

  function handleSaveScan(nextScan: NonNullable<typeof skinScan>) {
    const ensuredProfile =
      profile ??
      {
        name: "",
        ageRange: "20代",
        skinType: "normal" as const,
        sensitivities: [],
        concerns: [],
        currentProductName: "",
        habits: {
          sleepHours: 7,
          stressLevel: 2,
          waterIntakeLevel: 3,
          uvExposureLevel: 2,
        },
        notes: "",
        updatedAt: new Date().toISOString(),
      };

    flushSync(() => {
      setProfile(ensuredProfile);
      setSkinScan(nextScan);
    });
    try {
      saveProfile(ensuredProfile);
      saveSkinScan(nextScan);
    } catch (error) {
      console.warn("Failed to persist scan data to localStorage.", error);
    }
    setPage("dashboard");
  }

  function handleSaveProduct(product: Product) {
    const nextProducts = [product, ...products];
    setProducts(nextProducts);
    saveProducts(nextProducts);
  }

  function runSimulation(product: Product) {
    if (!profile || !skinScan) {
      return;
    }

    const result = simulateProduct(profile, skinScan, product);
    const nextResults: SimulationResult[] = [result, ...results];
    setResults(nextResults);
    saveSimulationResults(nextResults);
    setSelectedResultId(result.id);
    setPage("result");
  }

  function handleSimulate(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    runSimulation(product);
  }

  function handleSaveAndSimulate(product: Product) {
    const nextProducts = [product, ...products];
    setProducts(nextProducts);
    saveProducts(nextProducts);
    runSimulation(product);
  }

  function handleReset() {
    clearAllStorage();
    setEntryMode("fresh");
    setProfile(null);
    setSkinScan(null);
    setProducts([]);
    setResults([]);
    setSelectedResultId(null);
    setPage("top");
  }

  function renderPage() {
    if (page === "top") {
      return (
        <TopPage
          onStart={() => {
            setEntryMode("fresh");
            setPage("profile");
          }}
        />
      );
    }

    if (page === "onboarding") {
      return (
        <OnboardingPage
          onComplete={() => {
            setEntryMode("fresh");
            setPage("profile");
          }}
        />
      );
    }

    if (page === "profile") {
      return (
        <ProfilePage
          key={`profile-${entryMode}`}
          initialValue={entryMode === "fresh" ? null : effectiveProfile}
          onSave={handleSaveProfile}
        />
      );
    }

    if (page === "scan") {
      return (
        <SkinScanPage
          key={`scan-${entryMode}`}
          initialValue={entryMode === "fresh" ? null : effectiveSkinScan}
          onSave={handleSaveScan}
        />
      );
    }

    if (page === "dashboard" && effectiveProfile && effectiveSkinScan) {
      return (
        <DashboardPage
          profile={effectiveProfile}
          skinScan={effectiveSkinScan}
          latestResult={results[0] ?? null}
          onGoProfile={() => {
            setEntryMode("edit");
            setPage("profile");
          }}
          onGoScan={() => {
            setEntryMode("edit");
            setPage("scan");
          }}
          onGoProduct={() => setPage("product")}
        />
      );
    }

    if (page === "product") {
      return (
        <ProductPage
          products={products}
          onSaveProduct={handleSaveProduct}
          onSimulate={handleSimulate}
          onSaveAndSimulate={handleSaveAndSimulate}
        />
      );
    }

    if (page === "result") {
      return <ResultPage result={selectedResult} skinScan={effectiveSkinScan} />;
    }

    if (page === "history") {
      return (
        <HistoryPage
          results={results}
          onSelect={(id) => {
            setSelectedResultId(id);
            setPage("result");
          }}
        />
      );
    }

    if (page === "settings") {
      return <SettingsPage onReset={handleReset} />;
    }

    return (
      <OnboardingPage
        onComplete={() => {
          setEntryMode("fresh");
          setPage("profile");
        }}
      />
    );
  }

  return (
    <AppShell
      page={page}
      onNavigate={(nextPage) => {
        if (!effectiveProfile && !["top", "onboarding", "profile"].includes(nextPage)) {
          setPage("onboarding");
          return;
        }
        if (effectiveProfile && !effectiveSkinScan && !["profile", "scan"].includes(nextPage)) {
          setPage("scan");
          return;
        }
        if (nextPage === "profile" || nextPage === "scan") {
          setEntryMode("edit");
        }
        setPage(nextPage);
      }}
    >
      {renderPage()}
    </AppShell>
  );
}
