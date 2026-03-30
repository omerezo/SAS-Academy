import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { authFetch } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, Image, FileDown } from "lucide-react";
import { CoachIdCard } from "@/components/coach-id-card";
import type { Coach } from "@shared/schema";

function getFileName(coach: Coach, ext: string) {
  const name = coach.name.replace(/\s+/g, "_");
  return `SAS_Coach_${coach.id.slice(-6).toUpperCase()}_${name}.${ext}`;
}

export default function CoachIdPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: coach, isLoading } = useQuery<Coach>({
    queryKey: ["/api/coaches", params.id],
    queryFn: async () => {
      const res = await authFetch(`/api/coaches/${params.id}`);
      if (!res.ok) throw new Error("Coach not found");
      return res.json();
    },
    enabled: !!params.id,
  });

  const getCardDataUrl = async () => {
    const el = document.getElementById("print-coach-card-root");
    if (!el) return null;
    const { toPng } = await import("html-to-image");
    return toPng(el, { pixelRatio: 3, cacheBust: true });
  };

  const handleSaveImage = async () => {
    if (!coach) return;
    setExporting("image");
    try {
      const dataUrl = await getCardDataUrl();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = getFileName(coach, "png");
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(null);
    }
  };

  const handleSavePdf = async () => {
    if (!coach) return;
    setExporting("pdf");
    try {
      const dataUrl = await getCardDataUrl();
      if (!dataUrl) return;
      const { jsPDF } = await import("jspdf");
      const cardW = 86;
      const cardH = 54;
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [cardW + 10, cardH + 10] });
      pdf.addImage(dataUrl, "PNG", 5, 5, cardW, cardH);
      pdf.save(getFileName(coach, "pdf"));
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
        <title>${t("coaches.idCard")} - ${coach?.name || ""}</title>
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

  if (!coach) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{t("coaches.noCoaches")}</p>
        <Link href="/coaches">
          <Button variant="outline" className="mt-4" data-testid="button-back-to-coaches">
            <ArrowLeft className="h-4 w-4" />
            {t("coaches.title")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <div className="flex items-center gap-4 w-full max-w-md">
        <Link href="/coaches">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1" data-testid="text-coach-id-title">{t("coaches.idCard")}</h1>
      </div>

      <div id="print-coach-card-root">
        <CoachIdCard coach={coach} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={handleSaveImage} disabled={!!exporting} variant="outline" data-testid="button-save-coach-image">
          <Image className="h-4 w-4" />
          <span className="ms-1">{exporting === "image" ? "..." : t("idCard.saveImage")}</span>
        </Button>
        <Button onClick={handleSavePdf} disabled={!!exporting} variant="outline" data-testid="button-save-coach-pdf">
          <FileDown className="h-4 w-4" />
          <span className="ms-1">{exporting === "pdf" ? "..." : t("idCard.savePdf")}</span>
        </Button>
        <Button onClick={handlePrint} disabled={!!exporting} data-testid="button-print-coach-id">
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
