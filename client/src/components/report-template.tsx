import logoPath from "@assets/logo.png_1772009721638.jpeg";
import type { Player, Expenditure, FeePayment, SalaryPayment, Coach } from "@shared/schema";

interface AgeGroupItem {
  name: string;
  count: number;
}

interface Labels {
  reportTitle: string;
  academyName: string;
  generatedOn: string;
  financialSummary: string;
  totalIncome: string;
  totalExpenses: string;
  totalCoachSalaries: string;
  netBalance: string;
  feeDetails: string;
  playerFeeStatus: string;
  expenditureDetails: string;
  salaryDetails: string;
  playerStats: string;
  summary: string;
  count: string;
  total: string;
  paid: string;
  pending: string;
  player: string;
  month: string;
  amount: string;
  status: string;
  category: string;
  description: string;
  date: string;
  coach: string;
  ageGroup: string;
  name: string;
  playerCode: string;
  feeStatus: string;
  currency: string;
  monthlyReport: string;
  yearlyReport: string;
  noDataForPeriod: string;
  expCategoryLabels: Record<string, string>;
}

interface ReportTemplateProps {
  id?: string;
  periodLabel: string;
  periodType: "monthly" | "yearly";
  lang: string;
  totalFees: number;
  totalExpenses: number;
  totalSalaries: number;
  netBalance: number;
  filteredFees: FeePayment[];
  filteredExp: Expenditure[];
  filteredSal: SalaryPayment[];
  players: Player[];
  coaches: Coach[];
  ageGroupData: AgeGroupItem[];
  labels: Labels;
}

const GREEN = "#16a34a";
const LIGHT_GREEN = "#f0fdf4";
const RED = "#dc2626";
const AMBER = "#d97706";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG_ALT = "#f9fafb";

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
  marginBottom: 20,
};

const thStyle: React.CSSProperties = {
  background: GREEN,
  color: "#fff",
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 12,
};

const thStyleRtl: React.CSSProperties = { ...thStyle, textAlign: "right" };

const tdStyle: React.CSSProperties = {
  padding: "7px 12px",
  borderBottom: `1px solid ${BORDER}`,
  color: DARK,
  fontSize: 12,
};

const tdStyleRtl: React.CSSProperties = { ...tdStyle, textAlign: "right" };

function SectionHeader({ children, rtl }: { children: React.ReactNode; rtl: boolean }) {
  return (
    <div style={{
      background: LIGHT_GREEN,
      borderLeft: rtl ? "none" : `4px solid ${GREEN}`,
      borderRight: rtl ? `4px solid ${GREEN}` : "none",
      padding: "8px 14px",
      marginBottom: 8,
      marginTop: 20,
      fontWeight: 700,
      fontSize: 14,
      color: DARK,
    }}>
      {children}
    </div>
  );
}

export function ReportTemplate({
  id = "report-template-root",
  periodLabel,
  periodType,
  lang,
  totalFees,
  totalExpenses,
  totalSalaries,
  netBalance,
  filteredFees,
  filteredExp,
  filteredSal,
  players,
  coaches,
  ageGroupData,
  labels,
}: ReportTemplateProps) {
  const rtl = lang === "ar";
  const font = rtl
    ? "'Cairo', 'Arial', sans-serif"
    : "'Inter', 'Arial', sans-serif";

  const th = rtl ? thStyleRtl : thStyle;
  const td = rtl ? tdStyleRtl : tdStyle;

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const coachMap = new Map(coaches.map((c) => [c.id, c.name]));
  const activePlayers = players.filter((p) => p.status === "active");
  const paidIds = new Set(filteredFees.filter((p) => p.status === "paid").map((p) => p.playerId));

  const generatedDate = new Date().toLocaleDateString(rtl ? "ar-SA" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const reportType = periodType === "monthly" ? labels.monthlyReport : labels.yearlyReport;

  return (
    <div
      id={id}
      dir={rtl ? "rtl" : "ltr"}
      style={{
        fontFamily: font,
        width: 794,
        background: "#fff",
        color: DARK,
        padding: 0,
      }}
    >
      {rtl && (
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');`}</style>
      )}

      <div style={{
        background: GREEN,
        padding: "20px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: rtl ? "row-reverse" : "row",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: rtl ? "row-reverse" : "row" }}>
          <img
            src={logoPath}
            alt="SAS Logo"
            style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, background: "#fff", padding: 4 }}
          />
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>SAS Academy</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{labels.academyName}</div>
          </div>
        </div>
        <div style={{ color: "#fff", textAlign: rtl ? "left" : "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{reportType}</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{periodLabel}</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{labels.generatedOn}: {generatedDate}</div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>

        <SectionHeader rtl={rtl}>{labels.financialSummary}</SectionHeader>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>{labels.summary}</th>
              <th style={{ ...th, textAlign: rtl ? "left" : "right" }}>{labels.currency}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: labels.totalIncome, value: totalFees, color: GREEN },
              { label: labels.totalExpenses, value: totalExpenses, color: RED },
              { label: labels.totalCoachSalaries, value: totalSalaries, color: AMBER },
              { label: labels.netBalance, value: netBalance, color: netBalance >= 0 ? GREEN : RED },
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? BG_ALT : "#fff" }}>
                <td style={{ ...td, fontWeight: i === 3 ? 700 : 400 }}>{row.label}</td>
                <td style={{ ...td, textAlign: rtl ? "left" : "right", fontWeight: 700, color: row.color }}>
                  {row.value.toLocaleString()} {labels.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFees.length > 0 && (
          <>
            <SectionHeader rtl={rtl}>{labels.feeDetails}</SectionHeader>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 30 }}>#</th>
                  <th style={th}>{labels.player}</th>
                  <th style={th}>{labels.month}</th>
                  <th style={{ ...th, textAlign: "right" }}>{labels.amount}</th>
                  <th style={{ ...th, textAlign: "center" }}>{labels.status}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map((p, i) => {
                  const player = playerMap.get(p.playerId);
                  const isPaid = p.status === "paid";
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 1 ? BG_ALT : "#fff" }}>
                      <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
                      <td style={td}>{player?.name || "—"}</td>
                      <td style={td}>{p.month} {p.year}</td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{Number(p.amount).toLocaleString()} {labels.currency}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <span style={{
                          background: isPaid ? "#dcfce7" : "#fef9c3",
                          color: isPaid ? GREEN : AMBER,
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontWeight: 600,
                          fontSize: 11,
                        }}>
                          {isPaid ? labels.paid : labels.pending}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {periodType === "monthly" && activePlayers.length > 0 && (
          <>
            <SectionHeader rtl={rtl}>{labels.playerFeeStatus}</SectionHeader>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 30 }}>#</th>
                  <th style={th}>{labels.name}</th>
                  <th style={{ ...th, textAlign: "center" }}>{labels.playerCode}</th>
                  <th style={{ ...th, textAlign: "center" }}>{labels.ageGroup}</th>
                  <th style={{ ...th, textAlign: "center" }}>{labels.feeStatus}</th>
                </tr>
              </thead>
              <tbody>
                {activePlayers.map((p, i) => {
                  const isPaid = paidIds.has(p.id);
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 1 ? BG_ALT : "#fff" }}>
                      <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
                      <td style={td}>{p.name}{p.nameAr ? ` / ${p.nameAr}` : ""}</td>
                      <td style={{ ...td, textAlign: "center", fontFamily: "monospace", letterSpacing: 2 }}>{p.playerCode || "—"}</td>
                      <td style={{ ...td, textAlign: "center" }}>{p.ageGroup}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <span style={{
                          background: isPaid ? "#dcfce7" : "#fee2e2",
                          color: isPaid ? GREEN : RED,
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontWeight: 600,
                          fontSize: 11,
                        }}>
                          {isPaid ? labels.paid : labels.pending}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {filteredExp.length > 0 && (
          <>
            <SectionHeader rtl={rtl}>{labels.expenditureDetails}</SectionHeader>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 30 }}>#</th>
                  <th style={th}>{labels.category}</th>
                  <th style={th}>{labels.description}</th>
                  <th style={{ ...th, textAlign: "right" }}>{labels.amount}</th>
                  <th style={{ ...th, textAlign: "center" }}>{labels.date}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExp.map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 === 1 ? BG_ALT : "#fff" }}>
                    <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
                    <td style={td}>{labels.expCategoryLabels[e.category] || e.category}</td>
                    <td style={td}>{e.description}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{Number(e.amount).toLocaleString()} {labels.currency}</td>
                    <td style={{ ...td, textAlign: "center" }}>{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {filteredSal.length > 0 && (
          <>
            <SectionHeader rtl={rtl}>{labels.salaryDetails}</SectionHeader>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 30 }}>#</th>
                  <th style={th}>{labels.coach}</th>
                  <th style={th}>{labels.month}</th>
                  <th style={{ ...th, textAlign: "right" }}>{labels.amount}</th>
                  <th style={{ ...th, textAlign: "center" }}>{labels.status}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSal.map((p, i) => {
                  const isPaid = p.status === "paid";
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 1 ? BG_ALT : "#fff" }}>
                      <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
                      <td style={td}>{coachMap.get(p.coachId) || "—"}</td>
                      <td style={td}>{p.month} {p.year}</td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{Number(p.amount).toLocaleString()} {labels.currency}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <span style={{
                          background: isPaid ? "#dcfce7" : "#fef9c3",
                          color: isPaid ? GREEN : AMBER,
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontWeight: 600,
                          fontSize: 11,
                        }}>
                          {isPaid ? labels.paid : labels.pending}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {ageGroupData.length > 0 && (
          <>
            <SectionHeader rtl={rtl}>{labels.playerStats}</SectionHeader>
            <table style={{ ...tableStyle, width: "50%" }}>
              <thead>
                <tr>
                  <th style={th}>{labels.ageGroup}</th>
                  <th style={{ ...th, textAlign: "center" }}>{labels.count}</th>
                </tr>
              </thead>
              <tbody>
                {ageGroupData.map((ag, i) => (
                  <tr key={ag.name} style={{ background: i % 2 === 1 ? BG_ALT : "#fff" }}>
                    <td style={td}>{ag.name}</td>
                    <td style={{ ...td, textAlign: "center", fontWeight: 600 }}>{ag.count}</td>
                  </tr>
                ))}
                <tr style={{ background: LIGHT_GREEN }}>
                  <td style={{ ...td, fontWeight: 700 }}>{labels.total}</td>
                  <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>{players.length}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        <div style={{
          marginTop: 32,
          paddingTop: 12,
          borderTop: `1px solid ${BORDER}`,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: rtl ? "row-reverse" : "row",
          fontSize: 11,
          color: MUTED,
        }}>
          <span>SAS Academy — {labels.academyName}</span>
          <span>{periodLabel}</span>
        </div>
      </div>
    </div>
  );
}
