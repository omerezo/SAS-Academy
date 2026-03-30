import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, authFetch } from "@/lib/queryClient";
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
import { Plus, Pencil, Trash2, Search, Upload, User, FileText, IdCard } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";
import { calculateAge, getAgeGroup } from "@shared/schema";
import type { Player, InsertPlayer, Family } from "@shared/schema";

function getWhatsAppUrl(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length <= 10) digits = "966" + digits;
  return `https://wa.me/${digits}`;
}

const POSITIONS = ["goalkeeper", "defender", "midfielder", "forward"];
const STATUSES = ["active", "inactive", "injured"];

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authFetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
}

function FileUploadField({ label, currentUrl, onUpload, accept, icon: Icon, testId }: {
  label: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  accept: string;
  icon: typeof Upload;
  testId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onUpload(url);
    } catch {
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-muted">
            {currentUrl.endsWith(".pdf") ? (
              <div className="flex items-center justify-center h-full">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <img src={currentUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        ) : (
          <div className="h-16 w-16 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            data-testid={testId}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            {uploading ? "..." : label}
          </Button>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}

function PlayerForm({ player, families, onSave, onCancel }: {
  player?: Player;
  families?: Family[];
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: player?.name ?? "",
    nameAr: player?.nameAr ?? "",
    dateOfBirth: player?.dateOfBirth ?? "2015-01-01",
    position: player?.position ?? "midfielder",
    jerseyNumber: player?.jerseyNumber ?? 1,
    nationality: player?.nationality ?? "Sudanese",
    phone: player?.phone ?? "",
    status: player?.status ?? "active",
    joinDate: player?.joinDate ?? new Date().toISOString().split("T")[0],
    monthlyFee: player?.monthlyFee ?? "110",
    familyId: player?.familyId ?? null as string | null,
    photoUrl: player?.photoUrl ?? null as string | null,
    idDocumentUrl: player?.idDocumentUrl ?? null as string | null,
  });

  const computedAge = calculateAge(form.dateOfBirth);
  const computedAgeGroup = getAgeGroup(computedAge);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, age: computedAge, ageGroup: computedAgeGroup });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("players.name")}</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-player-name" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.nameAr")}</Label>
          <Input value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" data-testid="input-player-name-ar" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.dateOfBirth")}</Label>
          <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required data-testid="input-player-dob" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.age")} / {t("players.ageGroup")}</Label>
          <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50 text-sm" data-testid="text-computed-age">
            <span className="font-medium">{computedAge} {t("players.age")}</span>
            <span className="text-muted-foreground">→</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{t(`players.ageGroups.${computedAgeGroup}`)}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.position")}</Label>
          <Select value={form.position ?? "midfielder"} onValueChange={(v) => setForm({ ...form, position: v })}>
            <SelectTrigger data-testid="select-player-position"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POSITIONS.map((p) => <SelectItem key={p} value={p}>{t(`players.positions.${p}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.jerseyNumber")}</Label>
          <Input type="number" value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: Number(e.target.value) })} min={1} max={99} required data-testid="input-player-jersey" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.nationality")}</Label>
          <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} required data-testid="input-player-nationality" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.phone")}</Label>
          <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-player-phone" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger data-testid="select-player-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`players.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.joinDate")}</Label>
          <Input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} required data-testid="input-player-join-date" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("players.monthlyFee")} ({t("common.currency")})</Label>
          <Input type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} min={0} step="0.01" data-testid="input-player-fee" />
        </div>
        {families && families.length > 0 && (
          <div className="space-y-1.5">
            <Label>{t("families.family")}</Label>
            <Select value={form.familyId ?? "__none__"} onValueChange={(v) => setForm({ ...form, familyId: v === "__none__" ? null : v })}>
              <SelectTrigger data-testid="select-player-family"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {families.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
        <FileUploadField
          label={t("players.uploadPhoto")}
          currentUrl={form.photoUrl}
          onUpload={(url) => setForm({ ...form, photoUrl: url })}
          accept="image/*"
          icon={User}
          testId="button-upload-photo"
        />
        <FileUploadField
          label={t("players.uploadDocument")}
          currentUrl={form.idDocumentUrl}
          onUpload={(url) => setForm({ ...form, idDocumentUrl: url })}
          accept="image/*,.pdf"
          icon={FileText}
          testId="button-upload-document"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-testid="button-cancel">{t("common.cancel")}</Button>
        <Button type="submit" data-testid="button-save-player">{t("common.save")}</Button>
      </div>
    </form>
  );
}

export default function PlayersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const { data: players, isLoading } = useQuery<Player[]>({ queryKey: ["/api/players"] });
  const { data: familiesData } = useQuery<Family[]>({ queryKey: ["/api/families"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertPlayer) => apiRequest("POST", "/api/players", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: t("common.save") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertPlayer> }) => apiRequest("PATCH", `/api/players/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditingPlayer(undefined);
      toast({ title: t("common.save") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/players/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeleteId(null);
      toast({ title: t("common.delete") });
    },
  });

  const filtered = players?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameAr && p.nameAr.includes(search)) ||
      (p.playerCode && p.playerCode.includes(search))
  ) ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-players-title">{t("players.title")}</h1>
        <Button onClick={() => { setEditingPlayer(undefined); setDialogOpen(true); }} data-testid="button-add-player">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("players.addPlayer")}</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("players.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" data-testid="input-search-players" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground" data-testid="text-no-players">{t("players.noPlayers")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("players.playerCode")}</TableHead>
                    <TableHead>{t("players.photo")}</TableHead>
                    <TableHead>{t("players.name")}</TableHead>
                    <TableHead>{t("players.ageGroup")}</TableHead>
                    <TableHead>{t("players.age")}</TableHead>
                    <TableHead>{t("players.monthlyFee")}</TableHead>
                    <TableHead>{t("players.idDocument")}</TableHead>
                    <TableHead>{t("players.status")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((player) => (
                    <TableRow key={player.id} data-testid={`row-player-${player.id}`}>
                      <TableCell>
                        <span className="font-mono font-bold text-sm bg-primary/10 text-primary px-2 py-1 rounded" data-testid={`text-player-code-${player.id}`}>
                          {player.playerCode || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {player.photoUrl ? (
                          <img src={player.photoUrl} alt={player.name} className="h-9 w-9 rounded-full object-cover border" data-testid={`img-player-photo-${player.id}`} />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          {player.nameAr && <p className="text-xs text-muted-foreground" dir="rtl">{player.nameAr}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-accent text-accent-foreground">
                          {t(`players.ageGroups.${player.ageGroup}` as any, player.ageGroup)}
                        </span>
                      </TableCell>
                      <TableCell>{player.age}</TableCell>
                      <TableCell>{Number(player.monthlyFee).toLocaleString()} {t("common.currency")}</TableCell>
                      <TableCell>
                        {player.idDocumentUrl ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingDoc(player.idDocumentUrl)}
                            data-testid={`button-view-doc-${player.id}`}
                          >
                            <FileText className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${player.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : player.status === "injured" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                          {t(`players.${player.status}`)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/players/${player.id}/id-card`}>
                            <Button size="icon" variant="ghost" title={t("idCard.printId")} data-testid={`button-id-card-${player.id}`}>
                              <IdCard className="h-4 w-4 text-green-600" />
                            </Button>
                          </Link>
                          {player.phone && (
                            <a href={getWhatsAppUrl(player.phone)} target="_blank" rel="noopener noreferrer" data-testid={`button-whatsapp-player-${player.id}`}>
                              <Button size="icon" variant="ghost" title="WhatsApp">
                                <SiWhatsapp className="h-4 w-4 text-[#25D366]" />
                              </Button>
                            </a>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => { setEditingPlayer(player); setDialogOpen(true); }} data-testid={`button-edit-player-${player.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(player.id)} data-testid={`button-delete-player-${player.id}`}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? t("players.editPlayer") : t("players.addPlayer")}</DialogTitle>
          </DialogHeader>
          <PlayerForm
            player={editingPlayer}
            families={familiesData}
            onSave={(data) => {
              if (editingPlayer) {
                updateMutation.mutate({ id: editingPlayer.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("players.idDocument")}</DialogTitle>
          </DialogHeader>
          {viewingDoc && (
            viewingDoc.endsWith(".pdf") ? (
              <iframe src={viewingDoc} className="w-full h-[500px] rounded border" />
            ) : (
              <img src={viewingDoc} alt="ID Document" className="w-full rounded border" data-testid="img-id-document-view" />
            )
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("players.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} data-testid="button-confirm-delete">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
