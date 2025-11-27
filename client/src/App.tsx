import { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";
import { variants, transitions } from "@/design";

const FitnessDashboard = lazy(() => import("@/pages/FitnessDashboard"));
const LoginPage = lazy(() => import("@/pages/login"));
const NotFound = lazy(() => import("@/pages/not-found"));

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center text-white/80">
    Loading experience…
  </div>
);

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        variants={variants.fadeInUp("lg")}
        initial="hidden"
        animate="show"
        exit="hidden"
        transition={transitions.preset("standard")}
        className="min-h-screen"
      >
        <Suspense fallback={<PageFallback />}>
          <Switch location={location}>
            <Route path="/">
              <ProtectedRoute>
                <FitnessDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/login">
              <LoginPage />
            </Route>
            <Route path="/trends">
              <ProtectedRoute>
                <FitnessDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/sleep">
              <ProtectedRoute>
                <FitnessDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/stats">
              <ProtectedRoute>
                <FitnessDashboard />
              </ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
