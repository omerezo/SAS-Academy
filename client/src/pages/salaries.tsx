import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Search, CheckCircle } from "lucide-react";
import type { Coach, SalaryPayment, InsertSalaryPayment } from "@shared/schema";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function SalaryForm({ coaches, onSave, onCancel }: {
  coaches: Coach[];
  onSave: (data: InsertSalaryPayment) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<InsertSalaryPayment>({
    coachId: coaches[0]?.id ?? "",
    amount: coaches[0]?.monthlySalary ?? "0",
    month: MONTHS[new Date().getMonth()],
    year: currentYear,
    status: "pending",
    paidDate: null,
  });

  const handleCoachChange = (coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    setForm({ ...form, coachId, amount: coach?.monthlySalary ?? "0" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("salaries.coach")}</Label>
        <Select value={form.coachId} onValueChange={handleCoachChange}>
          <SelectTrigger data-testid="select-salary-coach"><SelectValue /></SelectTrigger>
          <SelectContent>
            {coaches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("salaries.amount")} ({t("common.currency")})</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} step="0.01" required data-testid="input-salary-amount" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("salaries.month")}</Label>
          <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
            <SelectTrigger data-testid="select-salary-month"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("salaries.year")}</Label>
          <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} min={2020} max={2030} required data-testid="input-salary-year" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("salaries.status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v, paidDate: v === "paid" ? new Date().toISOString().split("T")[0] : null })}>
            <SelectTrigger data-testid="select-salary-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t("salaries.pending")}</SelectItem>
              <SelectItem value="paid">{t("salaries.paid")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-testid="button-cancel">{t("common.cancel")}</Button>
        <Button type="submit" data-testid="button-save-salary">{t("common.save")}</Button>
      </div>
    </form>
  );
}

export default function SalariesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: payments, isLoading } = useQuery<SalaryPayment[]>({ queryKey: ["/api/salary-payments"] });
  const { data: coaches } = useQuery<Coach[]>({ queryKey: ["/api/coaches"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertSalaryPayment) => apiRequest("POST", "/api/salary-payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: t("common.save") });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/salary-payments/${id}`, { status: "paid", paidDate: new Date().toISOString().split("T")[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("salaries.markPaid") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/salary-payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeleteId(null);
      toast({ title: t("common.delete") });
    },
  });

  const coachMap = new Map(coaches?.map((c) => [c.id, c]) ?? []);

  const filtered = payments?.filter((p) => {
    const coach = coachMap.get(p.coachId);
    return coach?.name.toLowerCase().includes(search.toLowerCase()) || p.month.toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-salaries-title">{t("salaries.title")}</h1>
        <Button onClick={() => setDialogOpen(true)} disabled={!coaches?.length} data-testid="button-add-salary">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("salaries.addPayment")}</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("salaries.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-salaries" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground" data-testid="text-no-payments">{t("salaries.noPayments")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("salaries.coach")}</TableHead>
                    <TableHead>{t("salaries.amount")}</TableHead>
                    <TableHead>{t("salaries.month")}</TableHead>
                    <TableHead>{t("salaries.year")}</TableHead>
                    <TableHead>{t("salaries.status")}</TableHead>
                    <TableHead>{t("salaries.paidDate")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment) => {
                    const coach = coachMap.get(payment.coachId);
                    return (
                      <TableRow key={payment.id} data-testid={`row-salary-${payment.id}`}>
                        <TableCell className="font-medium">{coach?.name ?? payment.coachId}</TableCell>
                        <TableCell>{Number(payment.amount).toLocaleString()} {t("common.currency")}</TableCell>
                        <TableCell>{payment.month}</TableCell>
                        <TableCell>{payment.year}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-md ${payment.status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                            {t(`salaries.${payment.status}`)}
                          </span>
                        </TableCell>
                        <TableCell>{payment.paidDate ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {payment.status === "pending" && (
                              <Button size="icon" variant="ghost" onClick={() => markPaidMutation.mutate(payment.id)} data-testid={`button-mark-paid-${payment.id}`}>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(payment.id)} data-testid={`button-delete-salary-${payment.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("salaries.addPayment")}</DialogTitle>
          </DialogHeader>
          {coaches && coaches.length > 0 && (
            <SalaryForm
              coaches={coaches}
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("salaries.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
