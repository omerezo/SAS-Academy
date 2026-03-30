import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import logoPath from "@assets/logo.png_1772009721638.jpeg";
import type { Player } from "@shared/schema";

function absUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return window.location.origin + path;
}

export function PlayerIdCard({ player }: { player: Player }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <div className="id-card-wrapper" data-testid={`id-card-${player.id}`}>
      <div className="id-card-front">
        <div className="id-card-header">
          <img src={logoPath} alt="SAS" className="id-card-logo" />
          <div className="id-card-header-text">
            <div className="id-card-academy-name" dir={isRtl ? "rtl" : "ltr"}>
              {isRtl ? "أكاديمية سوداني الرياضية" : "Sudani Academy Sport"}
            </div>
            <div className="id-card-subtitle" dir={isRtl ? "rtl" : "ltr"}>
              {isRtl ? "بطاقة عضوية اللاعب" : "Player Membership Card"}
            </div>
          </div>
          <div className="id-card-age-badge">{player.ageGroup}</div>
        </div>

        <div className="id-card-body">
          <div className="id-card-photo-section">
            {player.photoUrl ? (
              <img src={absUrl(player.photoUrl)!} alt={player.name} className="id-card-photo" />
            ) : (
              <div className="id-card-photo-placeholder">
                <User size={36} strokeWidth={1.5} />
              </div>
            )}
            <div className="id-card-jersey">#{player.jerseyNumber}</div>
          </div>

          <div className="id-card-info">
            <div className="id-card-name">{player.name}</div>
            {player.nameAr && <div className="id-card-name-ar" dir="rtl">{player.nameAr}</div>}
            <div className="id-card-detail-row" dir={isRtl ? "rtl" : "ltr"}>
              <span className="id-card-label">{t("players.position")}</span>
              <span className="id-card-value">{t(`players.positions.${player.position}` as any, player.position ?? "")}</span>
            </div>
            <div className="id-card-detail-row" dir={isRtl ? "rtl" : "ltr"}>
              <span className="id-card-label">{t("players.nationality")}</span>
              <span className="id-card-value">{player.nationality}</span>
            </div>
            <div className="id-card-detail-row" dir={isRtl ? "rtl" : "ltr"}>
              <span className="id-card-label">{t("players.dateOfBirth")}</span>
              <span className="id-card-value">{player.dateOfBirth}</span>
            </div>
          </div>
        </div>

        <div className="id-card-footer">
          <div className="id-card-code-section">
            <span className="id-card-code-label">ID</span>
            <span className="id-card-code">{player.playerCode || "----"}</span>
          </div>
          <div className="id-card-member-since" dir={isRtl ? "rtl" : "ltr"}>
            <span className="id-card-since-label">{t("idCard.memberSince")}</span>
            <span className="id-card-since-value">{player.joinDate}</span>
          </div>
          <div className={`id-card-status ${player.status === "active" ? "id-card-status-active" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
            {t(`players.${player.status}`)}
          </div>
        </div>
      </div>

      <style>{`
        .id-card-wrapper {
          width: 340px;
          font-family: 'Cairo', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .id-card-front {
          width: 340px;
          height: 214px;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #0a1a0a 0%, #143d1a 40%, #1a5c24 100%);
          color: #fff;
          position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
        }

        .id-card-front::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          pointer-events: none;
        }

        .id-card-front::after {
          content: '';
          position: absolute;
          bottom: -60px;
          left: -30px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.02);
          pointer-events: none;
        }

        .id-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px 6px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          position: relative;
          z-index: 1;
        }

        .id-card-logo {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .id-card-header-text {
          flex: 1;
        }

        .id-card-academy-name {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #6ee67a;
        }

        .id-card-subtitle {
          font-size: 8px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1px;
          margin-top: 1px;
        }

        .id-card-age-badge {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        .id-card-body {
          display: flex;
          gap: 12px;
          padding: 10px 14px;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .id-card-photo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .id-card-photo {
          width: 72px;
          height: 88px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid rgba(110,230,122,0.4);
        }

        .id-card-photo-placeholder {
          width: 72px;
          height: 88px;
          border-radius: 8px;
          border: 2px dashed rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.05);
        }

        .id-card-jersey {
          font-size: 13px;
          font-weight: 800;
          color: #6ee67a;
          letter-spacing: 1px;
        }

        .id-card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .id-card-name {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .id-card-name-ar {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          direction: rtl;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
          font-family: 'Cairo', sans-serif;
        }

        .id-card-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          gap: 4px;
        }

        .id-card-label {
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          white-space: nowrap;
        }

        .id-card-value {
          color: rgba(255,255,255,0.85);
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .id-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 14px 8px;
          background: rgba(0,0,0,0.25);
          border-top: 1px solid rgba(255,255,255,0.08);
          position: relative;
          z-index: 1;
        }

        .id-card-code-section {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .id-card-code-label {
          font-size: 8px;
          color: rgba(255,255,255,0.4);
          font-weight: 700;
          letter-spacing: 1px;
        }

        .id-card-code {
          font-size: 16px;
          font-weight: 900;
          font-family: 'Courier New', monospace;
          color: #6ee67a;
          letter-spacing: 2px;
        }

        .id-card-member-since {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .id-card-since-label {
          font-size: 7px;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .id-card-since-value {
          font-size: 9px;
          color: rgba(255,255,255,0.7);
          font-weight: 600;
        }

        .id-card-status {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
        }

        .id-card-status-active {
          background: rgba(34,197,94,0.2);
          color: #6ee67a;
        }

        @media print {
          .id-card-front {
            box-shadow: none;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
