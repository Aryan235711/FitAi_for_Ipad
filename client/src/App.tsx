import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import FitnessDashboard from "@/pages/FitnessDashboard";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { AnimatePresence, motion } from "framer-motion";
import { variants, transitions } from "@/design";

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
