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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { Expenditure, InsertExpenditure } from "@shared/schema";

const CATEGORIES = ["playground", "equipment", "transport", "facility", "medical", "food", "training", "other"];

function ExpForm({ expenditure, onSave, onCancel }: {
  expenditure?: Expenditure;
  onSave: (data: InsertExpenditure) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<InsertExpenditure>({
    category: expenditure?.category ?? "playground",
    description: expenditure?.description ?? "sport yard",
    amount: expenditure?.amount ?? "0",
    date: expenditure?.date ?? new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("expenditures.category")}</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger data-testid="select-exp-category"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`expenditures.categories.${c}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>{t("expenditures.description")}</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required data-testid="input-exp-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("expenditures.amount")}</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} step="0.01" required data-testid="input-exp-amount" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("expenditures.date")}</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required data-testid="input-exp-date" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-testid="button-cancel">{t("common.cancel")}</Button>
        <Button type="submit" data-testid="button-save-exp">{t("common.save")}</Button>
      </div>
    </form>
  );
}

export default function ExpendituresPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expenditure | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: expenditures, isLoading } = useQuery<Expenditure[]>({ queryKey: ["/api/expenditures"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertExpenditure) => apiRequest("POST", "/api/expenditures", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: t("common.save") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertExpenditure> }) => apiRequest("PATCH", `/api/expenditures/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditing(undefined);
      toast({ title: t("common.save") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/expenditures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeleteId(null);
      toast({ title: t("common.delete") });
    },
  });

  const filtered = expenditures?.filter(
    (e) => e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-expenditures-title">{t("expenditures.title")}</h1>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }} data-testid="button-add-expenditure">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("expenditures.addExpenditure")}</span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("expenditures.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-expenditures" />
        </div>
        <p className="text-sm font-medium" data-testid="text-expenditure-total">
          {t("common.total")}: {total.toLocaleString()} {t("common.currency")}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground" data-testid="text-no-expenditures">{t("expenditures.noExpenses")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("expenditures.category")}</TableHead>
                    <TableHead>{t("expenditures.description")}</TableHead>
                    <TableHead>{t("expenditures.amount")}</TableHead>
                    <TableHead>{t("expenditures.date")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((exp) => (
                    <TableRow key={exp.id} data-testid={`row-expenditure-${exp.id}`}>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-accent text-accent-foreground">
                          {t(`expenditures.categories.${exp.category}` as any, exp.category)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{exp.description}</TableCell>
                      <TableCell className="font-medium">{Number(exp.amount).toLocaleString()} {t("common.currency")}</TableCell>
                      <TableCell>{exp.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(exp); setDialogOpen(true); }} data-testid={`button-edit-exp-${exp.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(exp.id)} data-testid={`button-delete-exp-${exp.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("expenditures.editExpenditure") : t("expenditures.addExpenditure")}</DialogTitle>
          </DialogHeader>
          <ExpForm
            expenditure={editing}
            onSave={(data) => {
              if (editing) {
                updateMutation.mutate({ id: editing.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("expenditures.deleteConfirm")}</AlertDialogDescription>
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
