import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SplashLoader } from "@/components/SkeletonLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Import from "@/pages/Import";
import Units from "@/pages/Units";
import Users from "@/pages/Users";
import UnitDetail from "@/pages/UnitDetail";
import ExecutiveSummary from "@/pages/ExecutiveSummary";
import RiskPage from "@/pages/RiskPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SplashLoader />;
  if (!user) return <Redirect to="/login" />;
  if (adminOnly && user.role !== "admin" && user.role !== "super_admin") return <Redirect to="/" />;
  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SplashLoader />;
  if (user) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/units" component={() => <ProtectedRoute component={Units} />} />
      <Route path="/units/:id" component={() => <ProtectedRoute component={UnitDetail} />} />
      <Route path="/import" component={() => <ProtectedRoute component={Import} />} />
      <Route path="/executive" component={() => <ProtectedRoute component={ExecutiveSummary} />} />
      <Route path="/risk" component={() => <ProtectedRoute component={RiskPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} adminOnly />} />
      <Route component={() => <Redirect to="/" />} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
