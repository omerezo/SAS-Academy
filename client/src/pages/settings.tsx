import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, Sun, Moon, Globe, UserPlus, Pencil, Trash2, Users, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@shared/schema";

const COLOR_THEMES = [
  { id: "green", hue: "145", lightPrimary: "hsl(145, 63%, 32%)", darkPrimary: "hsl(145, 63%, 42%)" },
  { id: "blue", hue: "215", lightPrimary: "hsl(215, 80%, 48%)", darkPrimary: "hsl(215, 80%, 55%)" },
  { id: "red", hue: "0", lightPrimary: "hsl(0, 72%, 45%)", darkPrimary: "hsl(0, 72%, 50%)" },
  { id: "purple", hue: "270", lightPrimary: "hsl(270, 60%, 50%)", darkPrimary: "hsl(270, 60%, 58%)" },
] as const;

type ThemeId = typeof COLOR_THEMES[number]["id"];

interface SafeUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

const ROLES: UserRole[] = ["admin", "manager", "accountant", "coach", "viewer"];

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  accountant: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  coach: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function UserFormDialog({
  open,
  onClose,
  editUser,
}: {
  open: boolean;
  onClose: () => void;
  editUser?: SafeUser | null;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(editUser?.displayName ?? "");
  const [username, setUsername] = useState(editUser?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(editUser?.role ?? "viewer");

  useEffect(() => {
    if (open) {
      setDisplayName(editUser?.displayName ?? "");
      setUsername(editUser?.username ?? "");
      setPassword("");
      setRole(editUser?.role ?? "viewer");
    }
  }, [open, editUser]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("common.save"), description: t("users.addUser") });
      onClose();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/users/${editUser!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("common.save") });
      onClose();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { displayName, role };
    if (!editUser) { data.username = username; data.password = password; }
    else if (password) data.password = password;
    if (editUser) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editUser ? t("users.editUser") : t("users.addUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{t("users.displayName")}</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="input-display-name" />
          </div>
          {!editUser && (
            <div className="space-y-1.5">
              <Label>{t("users.username")}</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required data-testid="input-user-username" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{editUser ? t("users.newPassword") : t("users.password")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editUser} data-testid="input-user-password" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("users.role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger data-testid="select-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{t(`auth.roles.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-user">
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [colorTheme, setColorTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem("sas-color-theme") as ThemeId) || "green";
  });
  const [userDialog, setUserDialog] = useState<{ open: boolean; user?: SafeUser | null }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<SafeUser | null>(null);

  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("users.deleteUser") });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const applyColorTheme = (theme: ThemeId) => {
    const root = document.documentElement;
    COLOR_THEMES.forEach(t => root.classList.remove(`theme-${t.id}`));
    if (theme !== "green") root.classList.add(`theme-${theme}`);
    localStorage.setItem("sas-color-theme", theme);
    setColorTheme(theme);
  };

  const toggleDark = (checked: boolean) => {
    document.documentElement.classList.toggle("dark", checked);
    localStorage.setItem("sas-theme", checked ? "dark" : "light");
    setIsDark(checked);
  };

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("sas-lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">
        {t("settings.title")}
      </h1>

      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                {t("users.title")}
              </CardTitle>
              <Button size="sm" className="gap-2" onClick={() => setUserDialog({ open: true, user: null })} data-testid="button-add-user">
                <UserPlus className="h-4 w-4" />
                {t("users.addUser")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("users.noUsers")}</p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border bg-card" data-testid={`row-user-${u.id}`}>
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{u.displayName || u.username}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                        {t(`auth.roles.${u.role}`)}
                      </span>
                      {u.id === currentUser?.id && (
                        <Badge variant="outline" className="text-xs">{t("common.current") ?? "You"}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setUserDialog({ open: true, user: u })} data-testid={`button-edit-user-${u.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUser?.id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)} data-testid={`button-delete-user-${u.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {t("settings.appearance")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-sm font-medium">{t("settings.darkMode")}</Label>
            <Switch id="dark-mode" checked={isDark} onCheckedChange={toggleDark} data-testid="switch-dark-mode" />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("settings.colorTheme")}</Label>
            <div className="grid grid-cols-4 gap-3">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => applyColorTheme(theme.id)}
                  data-testid={`button-theme-${theme.id}`}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${colorTheme === theme.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <div className="w-10 h-10 rounded-full shadow-md flex items-center justify-center" style={{ background: isDark ? theme.darkPrimary : theme.lightPrimary }}>
                    {colorTheme === theme.id && <Check className="h-5 w-5 text-white" />}
                  </div>
                  <span className="text-xs font-medium">{t(`settings.${theme.id}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            {t("settings.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => switchLanguage("en")}
              data-testid="button-lang-en"
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${i18n.language === "en" ? "border-primary ring-2 ring-primary/20 bg-accent" : "border-border hover:border-muted-foreground/30"}`}
            >
              <span className="text-lg">🇬🇧</span>
              <span className="font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>English</span>
            </button>
            <button
              onClick={() => switchLanguage("ar")}
              data-testid="button-lang-ar"
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${i18n.language === "ar" ? "border-primary ring-2 ring-primary/20 bg-accent" : "border-border hover:border-muted-foreground/30"}`}
            >
              <span className="text-lg">🇸🇦</span>
              <span className="font-medium" style={{ fontFamily: "'Cairo', sans-serif" }}>العربية</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <UserFormDialog
        open={userDialog.open}
        onClose={() => setUserDialog({ open: false })}
        editUser={userDialog.user}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.deleteUser")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("users.deleteConfirm")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} data-testid="button-confirm-delete-user">
              {deleteMutation.isPending ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
