import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import type { Player, Expenditure, FeePayment, SalaryPayment, Coach } from "@shared/schema";
import { ReportTemplate } from "@/components/report-template";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type PeriodType = "monthly" | "yearly";

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const { data: players, isLoading: playersLoading } = useQuery<Player[]>({ queryKey: ["/api/players"] });
  const { data: coaches } = useQuery<Coach[]>({ queryKey: ["/api/coaches"] });
  const { data: expenditures, isLoading: expLoading } = useQuery<Expenditure[]>({ queryKey: ["/api/expenditures"] });
  const { data: feePayments, isLoading: feeLoading } = useQuery<FeePayment[]>({ queryKey: ["/api/fee-payments"] });
  const { data: salaryPayments, isLoading: salLoading } = useQuery<SalaryPayment[]>({ queryKey: ["/api/salary-payments"] });

  const isLoading = playersLoading || expLoading || feeLoading || salLoading;

  const periodLabel = useMemo(() => {
    if (periodType === "yearly") return String(selectedYear);
    const d = new Date(selectedYear, selectedMonth, 1);
    return d.toLocaleDateString(isRtl ? "ar-SA" : "en-US", { month: "long", year: "numeric" });
  }, [periodType, selectedMonth, selectedYear, isRtl]);

  const filteredFees = useMemo(() => {
    if (!feePayments) return [];
    return feePayments.filter((p) => {
      if (periodType === "yearly") return p.year === selectedYear;
      return p.month === MONTH_NAMES[selectedMonth] && p.year === selectedYear;
    });
  }, [feePayments, periodType, selectedMonth, selectedYear]);

  const filteredExp = useMemo(() => {
    if (!expenditures) return [];
    return expenditures.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      if (periodType === "yearly") return d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [expenditures, periodType, selectedMonth, selectedYear]);

  const filteredSal = useMemo(() => {
    if (!salaryPayments) return [];
    return salaryPayments.filter((p) => {
      if (periodType === "yearly") return p.year === selectedYear;
      return p.month === MONTH_NAMES[selectedMonth] && p.year === selectedYear;
    });
  }, [salaryPayments, periodType, selectedMonth, selectedYear]);

  const totalFees = filteredFees.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = filteredExp.reduce((s, e) => s + Number(e.amount), 0);
  const totalSalaries = filteredSal.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const netBalance = totalFees - totalExpenses - totalSalaries;

  const ageGroupData = players
    ? Object.entries(players.reduce((acc: Record<string, number>, p) => {
        acc[p.ageGroup] = (acc[p.ageGroup] || 0) + 1;
        return acc;
      }, {})).map(([name, count]) => ({ name, count }))
    : [];

  const statusData = players
    ? Object.entries(players.reduce((acc: Record<string, number>, p) => {
        const s = t(`players.${p.status}` as any, p.status);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value }))
    : [];

  const categoryData = filteredExp.length > 0
    ? Object.entries(filteredExp.reduce((acc: Record<string, number>, e) => {
        const cat = t(`expenditures.categories.${e.category}` as any, e.category);
        acc[cat] = (acc[cat] || 0) + Number(e.amount);
        return acc;
      }, {})).map(([name, value]) => ({ name, value }))
    : [];

  const STATUS_COLORS = ["hsl(145, 63%, 42%)", "hsl(0, 0%, 60%)", "hsl(0, 72%, 51%)"];

  const goToPrev = () => {
    if (periodType === "yearly") { setSelectedYear((y) => y - 1); return; }
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };

  const goToNext = () => {
    if (periodType === "yearly") { setSelectedYear((y) => y + 1); return; }
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  const isFuture = periodType === "yearly"
    ? selectedYear > now.getFullYear()
    : selectedYear > now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth());

  const reportLabels = useMemo(() => ({
    reportTitle: t("reports.reportTitle"),
    academyName: t("reports.academyName"),
    generatedOn: t("reports.generatedOn"),
    financialSummary: t("reports.financialSummary"),
    totalIncome: t("reports.totalIncome"),
    totalExpenses: t("reports.totalExpenses"),
    totalCoachSalaries: t("reports.totalCoachSalaries"),
    netBalance: t("reports.netBalance"),
    feeDetails: t("reports.feeDetails"),
    playerFeeStatus: t("reports.playerFeeStatus"),
    expenditureDetails: t("reports.expenditureDetails"),
    salaryDetails: t("reports.salaryDetails"),
    playerStats: t("reports.playerStats"),
    summary: t("reports.summary"),
    count: t("reports.count"),
    total: t("common.total"),
    paid: t("fees.paid"),
    pending: t("fees.pending"),
    player: t("fees.player"),
    month: t("fees.month"),
    amount: t("fees.amount"),
    status: t("fees.status"),
    category: t("expenditures.category"),
    description: t("expenditures.description"),
    date: t("expenditures.date"),
    coach: t("salaries.coach"),
    ageGroup: t("players.ageGroup"),
    name: t("players.name"),
    playerCode: t("players.playerCode"),
    feeStatus: t("fees.status"),
    currency: t("common.currency"),
    monthlyReport: t("reports.monthlyReport"),
    yearlyReport: t("reports.yearlyReport"),
    noDataForPeriod: t("reports.noDataForPeriod"),
    expCategoryLabels: {
      equipment: t("expenditures.categories.equipment"),
      transport: t("expenditures.categories.transport"),
      facility: t("expenditures.categories.facility"),
      medical: t("expenditures.categories.medical"),
      food: t("expenditures.categories.food"),
      training: t("expenditures.categories.training"),
      other: t("expenditures.categories.other"),
    },
  }), [t]);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const el = document.getElementById("report-template-root");
      if (!el) return;

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });

      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = dataUrl;
      });

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidthMm = doc.internal.pageSize.getWidth();
      const pageHeightMm = doc.internal.pageSize.getHeight();

      const imgWidthPx = img.naturalWidth;
      const imgHeightPx = img.naturalHeight;

      const imgHeightMm = (imgHeightPx / imgWidthPx) * pageWidthMm;

      const totalPages = Math.ceil(imgHeightMm / pageHeightMm);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) doc.addPage();
        const yOffsetMm = -(i * pageHeightMm);
        doc.addImage(dataUrl, "PNG", 0, yOffsetMm, pageWidthMm, imgHeightMm);
      }

      const fileName = periodType === "monthly"
        ? `SAS_Report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.pdf`
        : `SAS_Report_${selectedYear}.pdf`;
      doc.save(fileName);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div style={{ position: "absolute", left: -9999, top: 0, opacity: 0, pointerEvents: "none", zIndex: -1 }}>
        <ReportTemplate
          periodLabel={periodLabel}
          periodType={periodType}
          lang={i18n.language}
          totalFees={totalFees}
          totalExpenses={totalExpenses}
          totalSalaries={totalSalaries}
          netBalance={netBalance}
          filteredFees={filteredFees}
          filteredExp={filteredExp}
          filteredSal={filteredSal}
          players={players ?? []}
          coaches={coaches ?? []}
          ageGroupData={ageGroupData}
          labels={reportLabels}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold" data-testid="text-reports-title">{t("reports.title")}</h1>

        <Button
          onClick={exportPdf}
          disabled={exporting}
          data-testid="button-export-pdf"
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          {exporting ? t("common.loading") : t("reports.exportPdf")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setPeriodType("monthly")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${periodType === "monthly" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"}`}
            data-testid="button-period-monthly"
          >
            {t("reports.monthly")}
          </button>
          <button
            onClick={() => setPeriodType("yearly")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${periodType === "yearly" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"}`}
            data-testid="button-period-yearly"
          >
            {t("reports.yearly")}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrev} data-testid="button-prev-period">
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <span className="font-semibold text-sm min-w-[160px] text-center" data-testid="text-period-label">{periodLabel}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext} disabled={isFuture} data-testid="button-next-period">
            {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <Badge variant="outline" className="text-xs">
          {periodType === "monthly" ? t("reports.monthlyReport") : t("reports.yearlyReport")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("reports.totalIncome")}</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-income">
              {totalFees.toLocaleString()} {t("common.currency")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{filteredFees.filter(p => p.status === "paid").length} {t("dashboard.feesPaidCount").toLowerCase()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("reports.totalExpenses")}</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-expenses">
              {totalExpenses.toLocaleString()} {t("common.currency")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{filteredExp.length} {t("expenditures.title").toLowerCase()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("reports.totalCoachSalaries")}</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-total-salaries">
              {totalSalaries.toLocaleString()} {t("common.currency")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{filteredSal.filter(p => p.status === "paid").length} {t("fees.paid").toLowerCase()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("reports.netBalance")}</p>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="text-net-balance">
              {netBalance.toLocaleString()} {t("common.currency")}
            </p>
          </CardContent>
        </Card>
      </div>

      {filteredFees.length === 0 && filteredExp.length === 0 && filteredSal.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("reports.noDataForPeriod")}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("reports.byAgeGroup")}</CardTitle>
          </CardHeader>
          <CardContent>
            {ageGroupData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ageGroupData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(145, 63%, 32%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("reports.byStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {statusData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {categoryData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {t("reports.financialSummary")} — {t("expenditures.title")}
                <span className="text-muted-foreground text-sm font-normal ms-2">({periodLabel})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
