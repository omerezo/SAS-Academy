import { useState, useRef, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Search, CheckCircle, Printer, AlertTriangle, TrendingUp } from "lucide-react";
import type { Player, FeePayment, InsertFeePayment, IncomeRecord, InsertIncomeRecord } from "@shared/schema";
import { PaymentReceipt } from "@/components/payment-receipt";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function PlayerSearchInput({ players, value, onChange }: {
  players: Player[];
  value: string;
  onChange: (playerId: string, player: Player) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = players.find((p) => p.id === value);

  useEffect(() => {
    if (selected && !query) setQuery(selected.name);
  }, [selected?.id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = query.length > 0
    ? players.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.playerCode ?? "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : players.slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t("fees.searchPlayer")}
          className="pl-9"
          data-testid="input-player-search"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-56 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-start px-3 py-2 hover:bg-accent text-sm flex flex-col"
              onClick={() => { onChange(p.id, p); setQuery(p.name); setOpen(false); }}
              data-testid={`option-player-${p.id}`}
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">#{p.jerseyNumber} · {p.ageGroup}{p.playerCode ? ` · ${p.playerCode}` : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FeeForm({ players, payments, onSave, onCancel }: {
  players: Player[];
  payments: FeePayment[];
  onSave: (data: InsertFeePayment) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<InsertFeePayment>({
    playerId: "",
    amount: "110",
    month: MONTHS[new Date().getMonth()],
    year: currentYear,
    status: "paid",
    paidDate: new Date().toISOString().split("T")[0],
  });

  const handlePlayerSelect = (playerId: string, player: Player) => {
    setForm({ ...form, playerId, amount: player.monthlyFee ?? "110" });
  };

  const isDuplicate = form.playerId
    ? payments.some((p) => p.playerId === form.playerId && p.month === form.month && p.year === form.year)
    : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.playerId) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("fees.player")}</Label>
        <PlayerSearchInput players={players} value={form.playerId} onChange={handlePlayerSelect} />
      </div>

      {isDuplicate && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-yellow-800 dark:text-yellow-300 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{t("fees.duplicateWarning")}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("fees.amount")} ({t("common.currency")})</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} step="0.01" required data-testid="input-fee-amount" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("fees.month")}</Label>
          <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
            <SelectTrigger data-testid="select-fee-month"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("fees.year")}</Label>
          <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} min={2020} max={2030} required data-testid="input-fee-year" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("fees.status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v, paidDate: v === "paid" ? new Date().toISOString().split("T")[0] : null })}>
            <SelectTrigger data-testid="select-fee-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">{t("fees.paid")}</SelectItem>
              <SelectItem value="pending">{t("fees.pending")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-testid="button-cancel">{t("common.cancel")}</Button>
        <Button type="submit" disabled={!form.playerId} data-testid="button-save-fee">{t("common.save")}</Button>
      </div>
    </form>
  );
}

function IncomeForm({ onSave, onCancel }: {
  onSave: (data: InsertIncomeRecord) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<InsertIncomeRecord>({
    source: "",
    description: "",
    amount: "0",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("income.source")}</Label>
        <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder={t("income.sourcePlaceholder")} required data-testid="input-income-source" />
      </div>
      <div className="space-y-1.5">
        <Label>{t("income.description")}</Label>
        <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} data-testid="input-income-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("income.amount")} ({t("common.currency")})</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} step="0.01" required data-testid="input-income-amount" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("income.date")}</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required data-testid="input-income-date" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-testid="button-cancel-income">{t("common.cancel")}</Button>
        <Button type="submit" data-testid="button-save-income">{t("common.save")}</Button>
      </div>
    </form>
  );
}

export default function FeesPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [incomeSearch, setIncomeSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState(false);

  const handlePrintReceipt = async (playerName: string) => {
    const el = document.getElementById("payment-receipt-root");
    if (!el) return;
    setPrintingReceipt(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: true });
      const printWindow = window.open("", "_blank", "width=500,height=700");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${t("fees.printReceipt")} - ${playerName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: white; display: flex; justify-content: center; }
            img { width: 420px; height: auto; display: block; }
            @page { size: auto; margin: 8mm; }
          </style>
        </head>
        <body><img src="${dataUrl}" /></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
      };
    } finally {
      setPrintingReceipt(false);
    }
  };

  const { data: payments, isLoading } = useQuery<FeePayment[]>({ queryKey: ["/api/fee-payments"] });
  const { data: players } = useQuery<Player[]>({ queryKey: ["/api/players"] });
  const { data: incomeRecords, isLoading: incomeLoading } = useQuery<IncomeRecord[]>({ queryKey: ["/api/income-records"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertFeePayment) => apiRequest("POST", "/api/fee-payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: t("common.save") });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/fee-payments/${id}`, { status: "paid", paidDate: new Date().toISOString().split("T")[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("fees.markPaid") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/fee-payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeleteId(null);
      toast({ title: t("common.delete") });
    },
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data: InsertIncomeRecord) => apiRequest("POST", "/api/income-records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income-records"] });
      setIncomeDialogOpen(false);
      toast({ title: t("common.save") });
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/income-records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income-records"] });
      setDeleteIncomeId(null);
      toast({ title: t("common.delete") });
    },
  });

  const playerMap = new Map(players?.map((p) => [p.id, p]) ?? []);

  const filtered = payments?.filter((p) => {
    const player = playerMap.get(p.playerId);
    return player?.name.toLowerCase().includes(search.toLowerCase()) || p.month.toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  const filteredIncome = incomeRecords?.filter((r) =>
    r.source.toLowerCase().includes(incomeSearch.toLowerCase()) ||
    (r.description ?? "").toLowerCase().includes(incomeSearch.toLowerCase())
  ) ?? [];

  const totalCollected = filtered.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = filtered.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalIncome = filteredIncome.reduce((s, r) => s + Number(r.amount), 0);
  const isRtl = i18n.language === "ar";

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold" data-testid="text-fees-title">{t("fees.title")}</h1>

      <Tabs defaultValue="fees" dir={isRtl ? "rtl" : "ltr"}>
        <TabsList>
          <TabsTrigger value="fees" data-testid="tab-fees">{t("fees.feePaymentsTab")}</TabsTrigger>
          <TabsTrigger value="income" data-testid="tab-income">
            <TrendingUp className="h-4 w-4 me-1" />
            {t("fees.externalIncomeTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("fees.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-fees" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium" data-testid="text-fees-collected">
                  {t("fees.totalCollected")}: {totalCollected.toLocaleString()} {t("common.currency")}
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium" data-testid="text-fees-pending">
                  {t("fees.totalPending")}: {totalPending.toLocaleString()} {t("common.currency")}
                </span>
              </div>
              <Button onClick={() => setDialogOpen(true)} disabled={!players?.length} data-testid="button-add-fee">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("fees.addPayment")}</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground" data-testid="text-no-fees">{t("fees.noPayments")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("fees.player")}</TableHead>
                        <TableHead>{t("fees.amount")}</TableHead>
                        <TableHead>{t("fees.month")}</TableHead>
                        <TableHead>{t("fees.year")}</TableHead>
                        <TableHead>{t("fees.status")}</TableHead>
                        <TableHead>{t("fees.paidDate")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((payment) => {
                        const player = playerMap.get(payment.playerId);
                        return (
                          <TableRow key={payment.id} data-testid={`row-fee-${payment.id}`}>
                            <TableCell className="font-medium">
                              <div>
                                <p>{player?.name ?? payment.playerId}</p>
                                {player && <p className="text-xs text-muted-foreground">{player.ageGroup}</p>}
                              </div>
                            </TableCell>
                            <TableCell>{Number(payment.amount).toLocaleString()} {t("common.currency")}</TableCell>
                            <TableCell>{payment.month}</TableCell>
                            <TableCell>{payment.year}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-md ${payment.status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                                {t(`fees.${payment.status}`)}
                              </span>
                            </TableCell>
                            <TableCell>{payment.paidDate ?? "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {payment.status === "pending" && (
                                  <Button size="icon" variant="ghost" onClick={() => markPaidMutation.mutate(payment.id)} data-testid={`button-mark-fee-paid-${payment.id}`}>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                {payment.status === "paid" && (
                                  <Button size="icon" variant="ghost" onClick={() => setReceiptPayment(payment)} title={t("fees.printReceipt")} data-testid={`button-receipt-${payment.id}`}>
                                    <Printer className="h-4 w-4 text-blue-600" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(payment.id)} data-testid={`button-delete-fee-${payment.id}`}>
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
        </TabsContent>

        <TabsContent value="income" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("income.search")} value={incomeSearch} onChange={(e) => setIncomeSearch(e.target.value)} className="pl-9" data-testid="input-search-income" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-green-600 dark:text-green-400 font-medium" data-testid="text-income-total">
                {t("income.totalIncome")}: {totalIncome.toLocaleString()} {t("common.currency")}
              </span>
              <Button onClick={() => setIncomeDialogOpen(true)} data-testid="button-add-income">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("income.addRecord")}</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {incomeLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredIncome.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground" data-testid="text-no-income">{t("income.noRecords")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("income.source")}</TableHead>
                        <TableHead>{t("income.description")}</TableHead>
                        <TableHead>{t("income.amount")}</TableHead>
                        <TableHead>{t("income.date")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncome.map((record) => (
                        <TableRow key={record.id} data-testid={`row-income-${record.id}`}>
                          <TableCell className="font-medium">{record.source}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">{record.description ?? "-"}</TableCell>
                          <TableCell className="text-green-600 dark:text-green-400 font-medium">
                            {Number(record.amount).toLocaleString()} {t("common.currency")}
                          </TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteIncomeId(record.id)} data-testid={`button-delete-income-${record.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("fees.addPayment")}</DialogTitle>
          </DialogHeader>
          {players && players.length > 0 && (
            <FeeForm
              players={players}
              payments={payments ?? []}
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("income.addRecord")}</DialogTitle>
          </DialogHeader>
          <IncomeForm
            onSave={(data) => createIncomeMutation.mutate(data)}
            onCancel={() => setIncomeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("fees.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteIncomeId} onOpenChange={() => setDeleteIncomeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("income.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteIncomeId && deleteIncomeMutation.mutate(deleteIncomeId)}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!receiptPayment} onOpenChange={() => setReceiptPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("fees.printReceipt")}</DialogTitle>
          </DialogHeader>
          {receiptPayment && (() => {
            const player = playerMap.get(receiptPayment.playerId);
            return (
              <div className="space-y-4">
                <PaymentReceipt
                  receiptNumber={receiptPayment.id.slice(-8).toUpperCase()}
                  playerName={player?.name ?? receiptPayment.playerId}
                  playerNameAr={player?.nameAr}
                  ageGroup={player?.ageGroup ?? ""}
                  amount={Number(receiptPayment.amount)}
                  month={receiptPayment.month}
                  year={receiptPayment.year}
                  paidDate={receiptPayment.paidDate}
                  currency={t("common.currency")}
                  lang={i18n.language}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReceiptPayment(null)}>{t("common.cancel")}</Button>
                  <Button onClick={() => handlePrintReceipt(player?.name ?? "")} disabled={printingReceipt}>
                    <Printer className="h-4 w-4 me-2" />
                    {printingReceipt ? t("common.loading") : t("fees.printReceipt")}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
