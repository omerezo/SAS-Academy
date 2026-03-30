import logoPath from "@assets/logo.png_1772009721638.jpeg";

interface PaymentReceiptProps {
  receiptNumber: string;
  playerName: string;
  playerNameAr?: string | null;
  ageGroup: string;
  amount: number;
  month: string;
  year: number;
  paidDate: string | null;
  currency: string;
  lang: string;
}

const MONTH_AR: Record<string, string> = {
  January: "يناير", February: "فبراير", March: "مارس", April: "أبريل",
  May: "مايو", June: "يونيو", July: "يوليو", August: "أغسطس",
  September: "سبتمبر", October: "أكتوبر", November: "نوفمبر", December: "ديسمبر",
};

export function PaymentReceipt({
  receiptNumber, playerName, playerNameAr, ageGroup,
  amount, month, year, paidDate, currency, lang,
}: PaymentReceiptProps) {
  const isAr = lang === "ar";
  const printDate = new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const monthLabel = isAr ? (MONTH_AR[month] ?? month) : month;
  const paidDateLabel = paidDate
    ? new Date(paidDate + "T00:00:00").toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "-";

  return (
    <div
      id="payment-receipt-root"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        width: "420px",
        margin: "0 auto",
        fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ background: "linear-gradient(135deg, #1a6b3a 0%, #1e8549 100%)", padding: "24px 28px", textAlign: "center", color: "#fff" }}>
        <img src={logoPath} alt="Logo" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.4)", marginBottom: "10px" }} />
        <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "0.5px" }}>
          {isAr ? "أكاديمية سوداني الرياضية" : "Sudani Academy Sport"}
        </div>
        <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>SAS Academy</div>
      </div>

      <div style={{ background: "#f0fdf4", padding: "12px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #bbf7d0" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d", letterSpacing: "1px" }}>
            {isAr ? "إيصال دفع" : "PAYMENT RECEIPT"}
          </div>
        </div>
        <div style={{ textAlign: isAr ? "left" : "right" }}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>{isAr ? "رقم الإيصال" : "Receipt No."}</div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827", fontFamily: "monospace" }}>#{receiptNumber}</div>
        </div>
      </div>

      <div style={{ padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
          {isAr ? "معلومات اللاعب" : "Player Information"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{playerName}</div>
            {playerNameAr && <div style={{ fontSize: "14px", color: "#374151", direction: "rtl" }}>{playerNameAr}</div>}
          </div>
          <div style={{ background: "#dcfce7", color: "#15803d", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" }}>
            {ageGroup}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
          {isAr ? "تفاصيل الدفع" : "Payment Details"}
        </div>

        {[
          { label: isAr ? "الشهر" : "Month", value: `${monthLabel} ${year}` },
          { label: isAr ? "تاريخ الدفع" : "Date Paid", value: paidDateLabel },
          { label: isAr ? "الحالة" : "Status", value: isAr ? "مدفوع ✓" : "Paid ✓", green: true },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>{row.label}</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: row.green ? "#15803d" : "#111827" }}>{row.value}</span>
          </div>
        ))}

        <div style={{ marginTop: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>{isAr ? "المبلغ المدفوع" : "Amount Paid"}</span>
          <span style={{ fontSize: "22px", fontWeight: "800", color: "#15803d" }}>
            {amount.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      <div style={{ padding: "14px 28px 20px", textAlign: "center", borderTop: "1px dashed #e5e7eb" }}>
        <div style={{ fontSize: "11px", color: "#9ca3af" }}>
          {isAr ? "تاريخ الطباعة" : "Printed on"}: {printDate}
        </div>
        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
          {isAr ? "شكراً لكم" : "Thank you!"}
        </div>
      </div>
    </div>
  );
}
