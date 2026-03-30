import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PlayersPage from "@/pages/players";
import CoachesPage from "@/pages/coaches";
import FeesPage from "@/pages/fees";
import ExpendituresPage from "@/pages/expenditures";
import SalariesPage from "@/pages/salaries";
import ReportsPage from "@/pages/reports";
import PlayerIdPage from "@/pages/player-id";
import CoachIdPage from "@/pages/coach-id";
import FamiliesPage from "@/pages/families";
import SettingsPage from "@/pages/settings";
import AttendancePage from "@/pages/attendance";
import LoginPage from "@/pages/login";
import { Skeleton } from "@/components/ui/skeleton";
import "./lib/i18n";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/players" component={PlayersPage} />
      <Route path="/players/:id/id-card" component={PlayerIdPage} />
      <Route path="/coaches" component={CoachesPage} />
      <Route path="/coaches/:id/id-card" component={CoachIdPage} />
      <Route path="/families" component={FamiliesPage} />
      <Route path="/attendance" component={AttendancePage} />
      <Route path="/fees" component={FeesPage} />
      <Route path="/expenditures" component={ExpendituresPage} />
      <Route path="/salaries" component={SalariesPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

function AppShell() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("sas-theme");
    if (savedTheme === "dark") root.classList.add("dark");
    const savedColor = localStorage.getItem("sas-color-theme");
    if (savedColor && savedColor !== "green") root.classList.add(`theme-${savedColor}`);
    const savedLang = localStorage.getItem("sas-lang");
    if (savedLang === "ar") { root.dir = "rtl"; root.lang = "ar"; }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 w-64">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-dvh w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
