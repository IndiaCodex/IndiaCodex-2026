import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "./layout/AppShell.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { ExecutionsPage } from "./pages/ExecutionsPage.js";
import { ExecutionLayout } from "./pages/execution/ExecutionLayout.js";
import { TimelinePage } from "./pages/execution/TimelinePage.js";
import { ReplayPage } from "./pages/execution/ReplayPage.js";
import { VerificationPage } from "./pages/execution/VerificationPage.js";
import { ExplainabilityPage } from "./pages/execution/ExplainabilityPage.js";
import { ArtifactPage } from "./pages/execution/ArtifactPage.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/executions" element={<ExecutionsPage />} />
            <Route path="/executions/:executionId" element={<ExecutionLayout />}>
              <Route index element={<TimelinePage />} />
              <Route path="replay" element={<ReplayPage />} />
              <Route path="verification" element={<VerificationPage />} />
              <Route path="explain" element={<ExplainabilityPage />} />
              <Route path="artifact" element={<ArtifactPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
