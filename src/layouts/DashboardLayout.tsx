import { useEffect } from "react";
import { Sidebar } from "@/components";
import { PageBackground, PageTransition, FX } from "@/components/fx";
import ClickSpark from "@/components/reactbits/ClickSpark";
import { useEffetsVisuels } from "@/hooks/useEffets";
import { Outlet, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { listen } from "@tauri-apps/api/event";
import { ErrorLayout } from "./ErrorLayout";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const [niveau] = useEffetsVisuels();

  // L'overlay peut ouvrir le tableau de bord sur une page precise.
  useEffect(() => {
    const unlisten = listen<string>("dashboard-navigate", (event) => {
      if (typeof event.payload === "string" && event.payload.startsWith("/")) {
        navigate(event.payload);
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);

  return (
    <ErrorBoundary
      fallbackRender={() => {
        return <ErrorLayout />;
      }}
      resetKeys={["dashboard-error"]}
      onReset={() => {
        console.log("Reset");
      }}
    >
      <ClickSpark
        sparkColor={[FX.vert, FX.violetClair]}
        sparkSize={9}
        sparkRadius={22}
        sparkCount={8}
        duration={420}
        disabled={niveau !== "complet"}
      >
        <div className="souffleur-dashboard relative flex h-screen w-screen overflow-hidden bg-background">
          {/* Zone pour deplacer la fenetre */}
          <div
            className="absolute left-0 right-0 top-0 z-50 h-10 select-none"
            data-tauri-drag-region={true}
          />

          <Sidebar />

          {/* Panneau principal : fond anime propre a chaque page */}
          <main className="souffleur-panneau relative my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border">
            <PageBackground />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col px-8">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
      </ClickSpark>
    </ErrorBoundary>
  );
};
