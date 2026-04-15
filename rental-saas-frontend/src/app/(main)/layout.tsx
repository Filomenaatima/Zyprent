import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AuthHydrator from "@/components/AuthHydrator";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AuthHydrator />
      <div
        style={{
          height: "100vh",
          background: "#F8FAFC",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Sidebar />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Topbar />

          <main
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              overflowX: "hidden",
              overflowY: "auto",
              padding: "18px",
              background: "linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
              scrollbarWidth: "thin",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}