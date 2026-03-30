import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Users, Banknote, X } from "lucide-react";
import type { Player, Family, InsertFamily } from "@shared/schema";

type FamilyWithMembers = Family & { members: Player[]; memberCount: number };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function FamilyForm({ family, onSave, onCancel }: {
  family?: FamilyWithMembers;
  onSave: (data: InsertFamily) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<InsertFamily>({
    name: family?.name ?? "",
    nameAr: family?.nameAr ?? "",
    customFee: family?.customFee ?? null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      customFee: form.customFee && String(form.customFee).trim() !== "" ? form.customFee : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("families.name")}</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-family-name" />
      </div>
      <div className="space-y-1.5">
        <Label>{t("families.nameAr")}</Label>
        <Input value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" data-testid="input-family-name-ar" />
      </div>
      <div className="space-y-1.5">
        <Label>{t("families.customFee")} ({t("common.currency")}) — {t("families.customFeeHint")}</Label>
        <Input
          type="number"
          value={form.customFee ?? ""}
          onChange={(e) => setForm({ ...form, customFee: e.target.value || null })}
          min={0}
          step="0.01"
          placeholder="110"
          data-testid="input-family-custom-fee"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-testid="button-cancel">{t("common.cancel")}</Button>
        <Button type="submit" data-testid="button-save-family">{t("common.save")}</Button>
      </div>
    </form>
  );
}

function ManageMembersDialog({ family, allPlayers, open, onClose }: {
  family: FamilyWithMembers;
  allPlayers: Player[];
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const memberIds = new Set(family.members.map(m => m.id));
  const availablePlayers = allPlayers.filter(p => !p.familyId || p.familyId === family.id);

  const assignMutation = useMutation({
    mutationFn: (playerId: string) => apiRequest("PATCH", `/api/players/${playerId}`, { familyId: family.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (playerId: string) => apiRequest("PATCH", `/api/players/${playerId}`, { familyId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("families.manageMembers")} — {family.name}</DialogTitle>
          <DialogDescription className="sr-only">{t("families.manageMembers")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">{t("families.currentMembers")}</Label>
            {family.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("families.noMembers")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {family.members.map(m => (
                  <Badge key={m.id} variant="secondary" className="flex items-center gap-1 px-3 py-1.5" data-testid={`badge-member-${m.id}`}>
                    {m.name} <span className="text-xs text-muted-foreground">({m.ageGroup})</span>
                    <button
                      onClick={() => removeMutation.mutate(m.id)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`button-remove-member-${m.id}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">{t("families.addMember")}</Label>
            <Select onValueChange={(v) => assignMutation.mutate(v)}>
              <SelectTrigger data-testid="select-add-member">
                <SelectValue placeholder={t("families.selectPlayer")} />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.filter(p => !memberIds.has(p.id)).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.ageGroup})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={onClose} data-testid="button-done-members">{t("families.done")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CollectFeesDialog({ family, open, onClose }: {
  family: FamilyWithMembers;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const activeMembers = family.members.filter(m => m.status === "active");
  const defaultTotal = activeMembers.reduce((sum, m) => {
    return sum + Number(family.customFee ?? m.monthlyFee);
  }, 0);
  const [totalAmount, setTotalAmount] = useState(defaultTotal);
  const perMember = activeMembers.length > 0 ? (totalAmount / activeMembers.length) : 0;

  const collectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/families/${family.id}/collect-fees`, { month, year, totalAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("families.feesCollected") });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: err?.message || "Error", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("families.collectFees")} — {family.name}</DialogTitle>
          <DialogDescription className="sr-only">{t("families.collectFees")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("families.collectFeesDesc", { count: activeMembers.length })}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("fees.month")}</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger data-testid="select-collect-month"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("fees.year")}</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2030} data-testid="input-collect-year" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("families.totalAmount")} ({t("common.currency")})</Label>
            <Input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              min={0}
              step="0.01"
              data-testid="input-total-amount"
            />
          </div>
          <div className="p-3 rounded-lg bg-accent text-sm space-y-1">
            <div className="flex justify-between">
              <span>{t("families.activeMembers")}:</span>
              <span className="font-medium">{activeMembers.length}</span>
            </div>
            {activeMembers.length > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("families.splitInfo", { count: activeMembers.length, perMember: perMember.toFixed(2) })}:</span>
                <span>{perMember.toFixed(2)} {t("common.currency")} {t("families.perMember")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-border">
              <span>{t("common.total")}:</span>
              <span>{Number(totalAmount).toLocaleString()} {t("common.currency")}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} data-testid="button-cancel-collect">{t("common.cancel")}</Button>
            <Button onClick={() => collectMutation.mutate()} disabled={collectMutation.isPending || activeMembers.length === 0 || totalAmount <= 0} data-testid="button-confirm-collect">
              <Banknote className="h-4 w-4" />
              <span className="ms-1">{collectMutation.isPending ? "..." : t("families.collectFees")}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FamiliesPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFamily, setEditFamily] = useState<FamilyWithMembers | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [membersFamily, setMembersFamily] = useState<FamilyWithMembers | null>(null);
  const [collectFamily, setCollectFamily] = useState<FamilyWithMembers | null>(null);

  const { data: familiesData, isLoading } = useQuery<FamilyWithMembers[]>({ queryKey: ["/api/families"] });
  const { data: allPlayers } = useQuery<Player[]>({ queryKey: ["/api/players"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertFamily) => apiRequest("POST", "/api/families", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      setDialogOpen(false);
      toast({ title: t("common.save") });
    },
    onError: (err: any) => { toast({ title: err?.message || "Error", variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertFamily> }) => apiRequest("PATCH", `/api/families/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      setEditFamily(null);
      toast({ title: t("common.save") });
    },
    onError: (err: any) => { toast({ title: err?.message || "Error", variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/families/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setDeleteId(null);
      toast({ title: t("common.delete") });
    },
    onError: (err: any) => { toast({ title: err?.message || "Error", variant: "destructive" }); },
  });

  const isAr = i18n.language === "ar";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-families-title">{t("families.title")}</h1>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-family">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ms-1">{t("families.addFamily")}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : !familiesData?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-no-families">{t("families.noFamilies")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {familiesData.map(family => (
            <Card key={family.id} data-testid={`card-family-${family.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{isAr && family.nameAr ? family.nameAr : family.name}</CardTitle>
                    {family.nameAr && !isAr && (
                      <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">{family.nameAr}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditFamily(family)} data-testid={`button-edit-family-${family.id}`}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(family.id)} data-testid={`button-delete-family-${family.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {family.customFee && (
                  <Badge variant="outline" className="text-xs" data-testid={`badge-custom-fee-${family.id}`}>
                    {t("families.customFee")}: {Number(family.customFee).toLocaleString()} {t("common.currency")}
                  </Badge>
                )}
                <div>
                  <p className="text-sm font-medium mb-1.5">{t("families.members")} ({family.memberCount})</p>
                  {family.members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("families.noMembers")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {family.members.map(m => (
                        <Badge key={m.id} variant="secondary" className="text-xs">
                          {m.name} <span className="text-muted-foreground ms-1">{m.ageGroup}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setMembersFamily(family)} data-testid={`button-manage-members-${family.id}`}>
                    <Users className="h-3.5 w-3.5" />
                    <span className="ms-1">{t("families.manageMembers")}</span>
                  </Button>
                  <Button size="sm" onClick={() => setCollectFamily(family)} disabled={family.memberCount === 0} data-testid={`button-collect-fees-${family.id}`}>
                    <Banknote className="h-3.5 w-3.5" />
                    <span className="ms-1">{t("families.collectFees")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("families.addFamily")}</DialogTitle>
            <DialogDescription className="sr-only">{t("families.addFamily")}</DialogDescription>
          </DialogHeader>
          <FamilyForm onSave={(data) => createMutation.mutate(data)} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editFamily} onOpenChange={() => setEditFamily(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("families.editFamily")}</DialogTitle>
            <DialogDescription className="sr-only">{t("families.editFamily")}</DialogDescription>
          </DialogHeader>
          {editFamily && (
            <FamilyForm
              family={editFamily}
              onSave={(data) => updateMutation.mutate({ id: editFamily.id, data })}
              onCancel={() => setEditFamily(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {membersFamily && allPlayers && (
        <ManageMembersDialog
          family={membersFamily}
          allPlayers={allPlayers}
          open={!!membersFamily}
          onClose={() => setMembersFamily(null)}
        />
      )}

      {collectFamily && (
        <CollectFeesDialog
          family={collectFamily}
          open={!!collectFamily}
          onClose={() => setCollectFamily(null)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("families.deleteConfirm")}</AlertDialogDescription>
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
