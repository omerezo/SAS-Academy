import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { authFetch } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, Image, FileDown } from "lucide-react";
import { PlayerIdCard } from "@/components/player-id-card";
import type { Player } from "@shared/schema";

function getFileName(player: Player, ext: string) {
  const code = player.playerCode || "0000";
  const name = player.name.replace(/\s+/g, "_");
  return `SAS_ID_${code}_${name}.${ext}`;
}

export default function PlayerIdPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["/api/players", params.id],
    queryFn: async () => {
      const res = await authFetch(`/api/players/${params.id}`);
      if (!res.ok) throw new Error("Player not found");
      return res.json();
    },
    enabled: !!params.id,
  });

  const getCardDataUrl = async () => {
    const el = document.getElementById("print-card-root");
    if (!el) return null;
    const { toPng } = await import("html-to-image");
    return toPng(el, {
      pixelRatio: 3,
      cacheBust: true,
    });
  };

  const handleSaveImage = async () => {
    if (!player) return;
    setExporting("image");
    try {
      const dataUrl = await getCardDataUrl();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = getFileName(player, "png");
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(null);
    }
  };

  const handleSavePdf = async () => {
    if (!player) return;
    setExporting("pdf");
    try {
      const dataUrl = await getCardDataUrl();
      if (!dataUrl) return;
      const { jsPDF } = await import("jspdf");
      const cardW = 86;
      const cardH = 54;
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [cardW + 10, cardH + 10] });
      pdf.addImage(dataUrl, "PNG", 5, 5, cardW, cardH);
      pdf.save(getFileName(player, "pdf"));
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = async () => {
    const dataUrl = await getCardDataUrl();
    if (!dataUrl) return;
    const printWindow = window.open("", "_blank", "width=500,height=400");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("idCard.title")} - ${player?.name || ""}</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
          img { max-width: 340px; border-radius: 12px; }
          @page { size: auto; margin: 10mm; }
        </style>
      </head>
      <body><img src="${dataUrl}" /></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    };
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <Skeleton className="h-[214px] w-[340px] rounded-xl" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{t("players.noPlayers")}</p>
        <Link href="/players">
          <Button variant="outline" className="mt-4" data-testid="button-back-to-players">
            <ArrowLeft className="h-4 w-4" />
            {t("players.title")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <div className="flex items-center gap-4 w-full max-w-md">
        <Link href="/players">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1" data-testid="text-id-card-title">{t("idCard.title")}</h1>
      </div>

      <div id="print-card-root">
        <PlayerIdCard player={player} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={handleSaveImage} disabled={!!exporting} variant="outline" data-testid="button-save-image">
          <Image className="h-4 w-4" />
          <span className="ms-1">{exporting === "image" ? "..." : t("idCard.saveImage")}</span>
        </Button>
        <Button onClick={handleSavePdf} disabled={!!exporting} variant="outline" data-testid="button-save-pdf">
          <FileDown className="h-4 w-4" />
          <span className="ms-1">{exporting === "pdf" ? "..." : t("idCard.savePdf")}</span>
        </Button>
        <Button onClick={handlePrint} disabled={!!exporting} data-testid="button-print-id">
          <Printer className="h-4 w-4" />
          <span className="ms-1">{t("idCard.print")}</span>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-sm">
        {t("idCard.printHint")}
      </p>
    </div>
  );
}
