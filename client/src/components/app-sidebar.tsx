import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, Users, GraduationCap, Banknote, Receipt,
  Wallet, BarChart3, Settings, UsersRound, ClipboardCheck, LogOut, ShieldCheck,
} from "lucide-react";
import logoPath from "@assets/logo.png_1772009721638.jpeg";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  accountant: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  coach: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const isRtl = i18n.language === "ar";
  const { user, logout, canFinance, canAttendance, canWrite } = useAuth();

  const role = user?.role ?? "viewer";

  const mainItems = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard, show: true },
    { title: t("nav.players"), url: "/players", icon: Users, show: true },
    { title: t("nav.coaches"), url: "/coaches", icon: GraduationCap, show: canWrite || role === "viewer" },
    { title: t("nav.families"), url: "/families", icon: UsersRound, show: canWrite || canFinance || role === "viewer" },
    { title: t("nav.attendance"), url: "/attendance", icon: ClipboardCheck, show: canAttendance || role === "viewer" },
  ].filter((i) => i.show);

  const financeItems = [
    { title: t("nav.fees"), url: "/fees", icon: Banknote, show: canFinance || role === "viewer" },
    { title: t("nav.expenditures"), url: "/expenditures", icon: Receipt, show: canFinance || role === "viewer" },
    { title: t("nav.salaries"), url: "/salaries", icon: Wallet, show: canFinance || role === "viewer" },
    { title: t("nav.reports"), url: "/reports", icon: BarChart3, show: canFinance || role === "viewer" },
  ].filter((i) => i.show);

  const renderItems = (items: { title: string; url: string; icon: any }[]) =>
    items.map((item) => {
      const isActive = item.url === "/" ? location === "/" : location.startsWith(item.url);
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild data-active={isActive} className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}>
            <Link href={item.url} data-testid={`link-nav-${item.url.replace("/", "") || "dashboard"}`}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  const settingsActive = location === "/settings";

  return (
    <Sidebar side={isRtl ? "right" : "left"}>
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-3">
            <img src={logoPath} alt="SAS Logo" className="h-10 w-10 rounded-md object-cover" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground" data-testid="text-app-name">{t("appName")}</span>
              <span className="text-xs text-sidebar-foreground/60">{t("appFullName")}</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(mainItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {financeItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs">
              {t("reports.financialSummary")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderItems(financeItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
            <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" data-testid="text-sidebar-username">{user.displayName || user.username}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[role] || ROLE_COLORS.viewer}`} data-testid="text-sidebar-role">
                {t(`auth.roles.${role}`)}
              </span>
            </div>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={settingsActive} className={settingsActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}>
              <Link href="/settings" data-testid="link-nav-settings">
                <Settings className="h-4 w-4" />
                <span>{t("nav.settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={logout} className="w-full text-destructive hover:text-destructive" data-testid="button-logout">
                <LogOut className="h-4 w-4" />
                <span>{t("auth.signOut")}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
