import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, GraduationCap, Banknote, Receipt, Wallet, ChevronLeft, ChevronRight, CheckCircle2, Clock, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Player, Expenditure } from "@shared/schema";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type DashboardStats = {
  totalPlayers: number;
  activePlayers: number;
  totalCoaches: number;
  totalFeesCollected: number;
  totalExpenditure: number;
  totalSalaries: number;
  feesPaidCount: number;
  feesUnpaidCount: number;
  attendanceCount: number;
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthName = MONTH_NAMES[selectedMonth];
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const statsQueryKey = [`/api/dashboard/stats?month=${monthName}&year=${selectedYear}`];

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const res = await authFetch(`/api/dashboard/stats?month=${monthName}&year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  const { data: players } = useQuery<Player[]>({ queryKey: ["/api/players"] });
  const { data: expenditures } = useQuery<Expenditure[]>({ queryKey: ["/api/expenditures"] });

  const monthExpenditures = useMemo(() => {
    if (!expenditures) return [];
    return expenditures.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenditures, selectedMonth, selectedYear]);

  const categoryData = useMemo(() =>
    Object.entries(
      monthExpenditures.reduce((acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value })),
    [monthExpenditures]
  );

  const COLORS = ["hsl(145, 63%, 32%)", "hsl(0, 72%, 51%)", "hsl(45, 93%, 47%)", "hsl(200, 70%, 50%)", "hsl(270, 50%, 50%)", "hsl(30, 80%, 55%)", "hsl(180, 50%, 40%)"];

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const displayMonthLabel = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, 1);
    return d.toLocaleDateString(isRtl ? "ar-SA" : "en-US", { month: "long", year: "numeric" });
  }, [selectedMonth, selectedYear, isRtl]);

  const statCards = [
    { key: "totalPlayers", value: stats?.totalPlayers ?? 0, icon: Users, color: "text-blue-600 dark:text-blue-400", alwaysTotal: true },
    { key: "activePlayers", value: stats?.activePlayers ?? 0, icon: UserCheck, color: "text-green-600 dark:text-green-400", alwaysTotal: true },
    { key: "totalCoaches", value: stats?.totalCoaches ?? 0, icon: GraduationCap, color: "text-purple-600 dark:text-purple-400", alwaysTotal: true },
    { key: "totalFeesCollected", value: stats?.totalFeesCollected ?? 0, icon: Banknote, color: "text-emerald-600 dark:text-emerald-400", isCurrency: true },
    { key: "totalExpenditure", value: stats?.totalExpenditure ?? 0, icon: Receipt, color: "text-red-600 dark:text-red-400", isCurrency: true },
    { key: "totalSalaries", value: stats?.totalSalaries ?? 0, icon: Wallet, color: "text-yellow-600 dark:text-yellow-400", isCurrency: true },
  ];

  const recentPlayers = players?.slice(0, 5) ?? [];

  const ageGroupData = players
    ? Object.entries(
        players.reduce((acc: Record<string, number>, p) => {
          acc[p.ageGroup] = (acc[p.ageGroup] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, count]) => ({ name, count }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">{t("dashboard.title")}</h1>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={isRtl ? goToNextMonth : goToPrevMonth} data-testid="button-prev-month">
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <div className="text-center min-w-[150px]">
            <span className="font-semibold text-sm" data-testid="text-selected-month">{displayMonthLabel}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={isRtl ? goToPrevMonth : goToNextMonth} disabled={isCurrentMonth} data-testid="button-next-month">
            {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth} data-testid="button-current-month">
              {t("dashboard.monthlyOverview")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          {t("dashboard.feesPaidCount")}: <span className="font-bold">{stats?.feesPaidCount ?? 0}</span>
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          {t("dashboard.feesUnpaidCount")}: <span className="font-bold">{stats?.feesUnpaidCount ?? 0}</span>
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
          <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
          {t("dashboard.attendanceCount")}: <span className="font-bold">{stats?.attendanceCount ?? 0}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground" data-testid={`text-stat-label-${card.key}`}>
                        {t(`dashboard.${card.key}`)}
                      </p>
                      {card.alwaysTotal && (
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{t("dashboard.allTime")}</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold" data-testid={`text-stat-value-${card.key}`}>
                      {card.isCurrency
                        ? `${Number(card.value).toLocaleString()} ${t("common.currency")}`
                        : card.value}
                    </p>
                  </div>
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.recentPlayers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            ) : (
              <div className="space-y-3">
                {recentPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`row-recent-player-${player.id}`}>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-muted-foreground text-xs">{player.ageGroup} - #{player.jerseyNumber}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${player.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : player.status === "injured" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {t(`players.${player.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.playersByAgeGroup")}</CardTitle>
          </CardHeader>
          <CardContent>
            {ageGroupData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ageGroupData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(145, 63%, 32%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {t("dashboard.expenditureByCategory")}
              <span className="text-muted-foreground text-sm font-normal ms-2">— {displayMonthLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={false}>
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{t(`expenditures.categories.${item.name}` as any, item.name)}</span>
                      <span className="font-medium">{Number(item.value).toLocaleString()} {t("common.currency")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
