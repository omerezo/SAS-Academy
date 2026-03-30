import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, CheckCheck, XCircle, CalendarDays } from "lucide-react";
import type { Player, FeePayment, Session } from "@shared/schema";

type SessionWithCounts = Session & { presentCount: number; totalCount: number };
type AttendanceRecord = {
  id: string;
  sessionId: string;
  playerId: string;
  present: boolean;
  playerName: string;
  playerNameAr: string | null;
  playerCode: string | null;
  ageGroup: string;
  playerStatus: string;
};

export default function AttendancePage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRtl = i18n.language === "ar";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);

  const { data: sessionsList = [], isLoading: sessionsLoading } = useQuery<SessionWithCounts[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: feePayments = [] } = useQuery<FeePayment[]>({
    queryKey: ["/api/fee-payments"],
  });

  const activePlayers = useMemo(
    () => allPlayers.filter((p) => p.status === "active"),
    [allPlayers]
  );

  const { data: savedAttendance, isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/sessions", selectedSessionId, "attendance"],
    enabled: !!selectedSessionId,
  });

  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
  const currentYear = new Date().getFullYear();

  const paidPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    feePayments.forEach((fp) => {
      if (fp.status === "paid" && fp.month === currentMonth && fp.year === currentYear) {
        ids.add(fp.playerId);
      }
    });
    return ids;
  }, [feePayments, currentMonth, currentYear]);

  const initAttendanceMap = (records: AttendanceRecord[] | undefined) => {
    const map: Record<string, boolean> = {};
    if (records && records.length > 0) {
      records.forEach((r) => {
        map[r.playerId] = r.present;
      });
    } else {
      activePlayers.forEach((p) => {
        map[p.id] = true;
      });
    }
    setAttendanceMap(map);
    setDirty(false);
  };

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setSearch("");
    setDirty(false);
  };

  useEffect(() => {
    if (savedAttendance !== undefined) {
      initAttendanceMap(savedAttendance);
    }
  }, [savedAttendance, activePlayers.length]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return activePlayers;
    const q = search.toLowerCase();
    return activePlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameAr && p.nameAr.includes(search)) ||
        (p.playerCode && p.playerCode.includes(q))
    );
  }, [activePlayers, search]);

  const presentCount = useMemo(
    () => Object.values(attendanceMap).filter(Boolean).length,
    [attendanceMap]
  );

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sessions", {
        date: newDate,
        notes: newNotes || null,
      });
      return res.json();
    },
    onSuccess: (session: Session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setShowNewDialog(false);
      setNewNotes("");
      setSelectedSessionId(session.id);
      toast({ title: t("attendance.newSession"), description: newDate });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      if (deleteSessionId === selectedSessionId) {
        setSelectedSessionId(null);
      }
      setDeleteSessionId(null);
    },
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      const activeRecords = activePlayers.map((p) => ({
        playerId: p.id,
        present: attendanceMap[p.id] ?? true,
      }));
      const activeIds = new Set(activePlayers.map((p) => p.id));
      const inactiveRecords = (savedAttendance || [])
        .filter((r) => !activeIds.has(r.playerId))
        .map((r) => ({ playerId: r.playerId, present: r.present }));
      const records = [...activeRecords, ...inactiveRecords];
      await apiRequest("POST", `/api/sessions/${selectedSessionId}/attendance`, { records });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", selectedSessionId, "attendance"] });
      setDirty(false);
      toast({ title: t("attendance.saved") });
    },
  });

  const togglePlayer = (playerId: string) => {
    setAttendanceMap((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
    setDirty(true);
  };

  const markAll = (present: boolean) => {
    const map: Record<string, boolean> = {};
    activePlayers.forEach((p) => {
      map[p.id] = present;
    });
    setAttendanceMap(map);
    setDirty(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const dayName = d.toLocaleDateString(isRtl ? "ar-SA" : "en-US", { weekday: "short" });
    const formatted = d.toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${dayName}, ${formatted}`;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-attendance-title">
          {t("attendance.title")}
        </h1>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-new-session">
          <Plus className="h-4 w-4 me-1" />
          {t("attendance.newSession")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("attendance.title")}
          </h2>
          {sessionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : sessionsList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {t("attendance.noSessions")}
              </CardContent>
            </Card>
          ) : (
            sessionsList.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedSessionId === s.id ? "border-primary bg-accent/30" : ""}`}
                onClick={() => handleSelectSession(s.id)}
                data-testid={`card-session-${s.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{formatDate(s.date)}</p>
                      {s.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                          {s.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {s.totalCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {s.presentCount}/{s.totalCount}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionId(s.id);
                        }}
                        data-testid={`button-delete-session-${s.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          {!selectedSessionId ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{t("attendance.selectSession")}</p>
              </CardContent>
            </Card>
          ) : attendanceLoading ? (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("attendance.searchPlayers")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="ps-9"
                      data-testid="input-search-players"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAll(true)}
                      data-testid="button-mark-all-present"
                    >
                      <CheckCheck className="h-3.5 w-3.5 me-1" />
                      {t("attendance.markAllPresent")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAll(false)}
                      data-testid="button-mark-all-absent"
                    >
                      <XCircle className="h-3.5 w-3.5 me-1" />
                      {t("attendance.markAllAbsent")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {filteredPlayers.map((player) => {
                    const isPresent = attendanceMap[player.id] ?? true;
                    const hasPaid = paidPlayerIds.has(player.id);
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-accent/50 ${isPresent ? "" : "opacity-50"}`}
                        onClick={() => togglePlayer(player.id)}
                        data-testid={`row-player-${player.id}`}
                      >
                        <Checkbox
                          checked={isPresent}
                          onCheckedChange={() => togglePlayer(player.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-player-${player.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{player.name}</span>
                            {player.nameAr && (
                              <span className="text-xs text-muted-foreground truncate" dir="rtl">
                                {player.nameAr}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {player.playerCode && (
                              <span className="text-xs font-mono text-muted-foreground">
                                #{player.playerCode}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {player.ageGroup}
                            </Badge>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-xs ${hasPaid ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                          title={hasPaid ? t("attendance.feePaid") : t("attendance.feeUnpaid")}
                          data-testid={`fee-status-${player.id}`}
                        >
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${hasPaid ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <span className="hidden sm:inline">
                            {hasPaid ? t("attendance.feePaid") : t("attendance.feeUnpaid")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredPlayers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">{t("players.noPlayers")}</p>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground" data-testid="text-attendance-summary">
                    {t("attendance.summary", {
                      present: presentCount,
                      total: activePlayers.length,
                    })}
                  </p>
                  <Button
                    onClick={() => saveAttendanceMutation.mutate()}
                    disabled={saveAttendanceMutation.isPending || !dirty}
                    data-testid="button-save-attendance"
                  >
                    {saveAttendanceMutation.isPending ? t("common.loading") : t("attendance.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("attendance.newSession")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t("attendance.sessionDate")}</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                data-testid="input-session-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t("attendance.notes")}</label>
              <Input
                placeholder={t("attendance.notes")}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                data-testid="input-session-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => createSessionMutation.mutate()}
              disabled={!newDate || createSessionMutation.isPending}
              data-testid="button-create-session"
            >
              {createSessionMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("attendance.deleteSession")}</AlertDialogTitle>
            <AlertDialogDescription>{t("attendance.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSessionId && deleteSessionMutation.mutate(deleteSessionId)}
              data-testid="button-confirm-delete-session"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
