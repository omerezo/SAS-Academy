import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="flex items-center gap-2 p-2 border-b bg-card">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      <span className="text-sm font-semibold text-muted-foreground" data-testid="text-header-brand">
        {t("appName")}
      </span>
    </header>
  );
}
