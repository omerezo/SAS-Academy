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
import { Plus, Pencil, Trash2, Search, Upload, FileText, IdCard } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";
import type { Coach, InsertCoach } from "@shared/schema";

function getWhatsAppUrl(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length <= 10) digits = "966" + digits;
  return `https://wa.me/${digits}`;
}

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

const SPECIALTIES = ["headCoach", "assistant", "goalkeeper", "fitness", "youth"];
const STATUSES = ["active", "inactive"];

function CoachForm({ coach, onSave, onCancel }: {
  coach?: Coach;
  onSave: (data: InsertCoach) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<InsertCoach & { photoUrl?: string | null; idDocumentUrl?: string | null }>({
    name: coach?.name ?? "",
    nameAr: coach?.nameAr ?? "",
    phone: coach?.phone ?? "",
    specialty: coach?.specialty ?? "headCoach",
    monthlySalary: coach?.monthlySalary ?? "0",
    status: coach?.status ?? "active",
    joinDate: coach?.joinDate ?? new Date().toISOString().split("T")[0],
    photoUrl: coach?.photoUrl ?? null,
    idDocumentUrl: coach?.idDocumentUrl ?? null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("coaches.name")}</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-coach-name" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("coaches.nameAr")}</Label>
          <Input value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" data-testid="input-coach-name-ar" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("coaches.specialty")}</Label>
          <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
            <SelectTrigger data-testid="select-coach-specialty"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{t(`coaches.specialties.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("coaches.phone")}</Label>
          <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-coach-phone" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("coaches.monthlySalary")} ({t("common.currency")})</Label>
          <Input type="number" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} min={0} step="0.01" data-testid="input-coach-salary" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("coaches.status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger data-testid="select-coach-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`coaches.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("coaches.joinDate")}</Label>
          <Input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} required data-testid="input-coach-join-date" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
        <FileUploadField
          label={t("coaches.uploadPhoto")}
          currentUrl={form.photoUrl}
          onUpload={(url) => setForm({ ...form, photoUrl: url })}
          accept="image/*"
          icon={Upload}
          testId="button-upload-coach-photo"
        />
        <FileUploadField
          label={t("coaches.uploadDocument")}
          currentUrl={form.idDocumentUrl}
          onUpload={(url) => setForm({ ...form, idDocumentUrl: url })}
          accept="image/*,.pdf"
          icon={FileText}
          testId="button-upload-coach-document"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-testid="button-cancel">{t("common.cancel")}</Button>
        <Button type="submit" data-testid="button-save-coach">{t("common.save")}</Button>
      </div>
    </form>
  );
}

export default function CoachesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coach | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const { data: coachList, isLoading } = useQuery<Coach[]>({ queryKey: ["/api/coaches"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertCoach) => apiRequest("POST", "/api/coaches", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: t("common.save") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCoach> }) => apiRequest("PATCH", `/api/coaches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditing(undefined);
      toast({ title: t("common.save") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/coaches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeleteId(null);
      toast({ title: t("common.delete") });
    },
  });

  const filtered = coachList?.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.nameAr && c.nameAr.includes(search))
  ) ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-coaches-title">{t("coaches.title")}</h1>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }} data-testid="button-add-coach">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("coaches.addCoach")}</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("coaches.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-coaches" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground" data-testid="text-no-coaches">{t("coaches.noCoaches")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("coaches.name")}</TableHead>
                    <TableHead>{t("coaches.specialty")}</TableHead>
                    <TableHead>{t("coaches.monthlySalary")}</TableHead>
                    <TableHead>{t("coaches.phone")}</TableHead>
                    <TableHead>{t("coaches.status")}</TableHead>
                    <TableHead>{t("coaches.idDocument")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((coach) => (
                    <TableRow key={coach.id} data-testid={`row-coach-${coach.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {coach.photoUrl ? (
                            <img src={coach.photoUrl} alt={coach.name} className="h-9 w-9 rounded-full object-cover border shrink-0" data-testid={`img-coach-photo-${coach.id}`} />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{coach.name}</p>
                            {coach.nameAr && <p className="text-xs text-muted-foreground" dir="rtl">{coach.nameAr}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-accent text-accent-foreground">
                          {t(`coaches.specialties.${coach.specialty}` as any, coach.specialty)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{Number(coach.monthlySalary).toLocaleString()} {t("common.currency")}</TableCell>
                      <TableCell>{coach.phone || "-"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${coach.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                          {t(`coaches.${coach.status}`)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {coach.idDocumentUrl ? (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setViewingDoc(coach.idDocumentUrl!)} data-testid={`button-view-doc-${coach.id}`}>
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            {t("coaches.idDocument")}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coach.phone && (
                            <a href={getWhatsAppUrl(coach.phone)} target="_blank" rel="noopener noreferrer" data-testid={`button-whatsapp-coach-${coach.id}`}>
                              <Button size="icon" variant="ghost" title="WhatsApp">
                                <SiWhatsapp className="h-4 w-4 text-[#25D366]" />
                              </Button>
                            </a>
                          )}
                          <Link href={`/coaches/${coach.id}/id-card`}>
                            <Button size="icon" variant="ghost" title={t("coaches.idCard")} data-testid={`button-coach-id-card-${coach.id}`}>
                              <IdCard className="h-4 w-4 text-amber-500" />
                            </Button>
                          </Link>
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(coach); setDialogOpen(true); }} data-testid={`button-edit-coach-${coach.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(coach.id)} data-testid={`button-delete-coach-${coach.id}`}>
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
            <DialogTitle>{editing ? t("coaches.editCoach") : t("coaches.addCoach")}</DialogTitle>
          </DialogHeader>
          <CoachForm
            coach={editing}
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
            <AlertDialogDescription>{t("coaches.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("coaches.idDocument")}</DialogTitle>
          </DialogHeader>
          {viewingDoc && (
            viewingDoc.endsWith(".pdf") ? (
              <iframe src={viewingDoc} className="w-full h-[500px] rounded-md border" title="ID Document" />
            ) : (
              <img src={viewingDoc} alt="ID Document" className="w-full rounded-md border max-h-[500px] object-contain" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
