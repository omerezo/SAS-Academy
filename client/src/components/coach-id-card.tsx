import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import logoPath from "@assets/logo.png_1772009721638.jpeg";
import type { Coach } from "@shared/schema";

function absUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return window.location.origin + path;
}

export function CoachIdCard({ coach }: { coach: Coach }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const specialtyLabel = t(`coaches.specialties.${coach.specialty}` as any, coach.specialty);

  return (
    <div className="coach-id-wrapper" data-testid={`coach-id-card-${coach.id}`}>
      <div className="coach-id-front">

        <div className="coach-id-diagonal" />

        <div className="coach-id-header">
          <img src={logoPath} alt="SAS" className="coach-id-logo" />
          <div className="coach-id-header-text">
            <div className="coach-id-academy-name" dir={isRtl ? "rtl" : "ltr"}>
              {isRtl ? "أكاديمية سوداني الرياضية" : "Sudani Academy Sport"}
            </div>
            <div className="coach-id-subtitle" dir={isRtl ? "rtl" : "ltr"}>
              {isRtl ? "بطاقة هوية المدرب" : "Coach Identity Card"}
            </div>
          </div>
          <div className="coach-id-role-badge">STAFF</div>
        </div>

        <div className="coach-id-body">
          <div className="coach-id-photo-section">
            {coach.photoUrl ? (
              <img src={absUrl(coach.photoUrl)!} alt={coach.name} className="coach-id-photo" />
            ) : (
              <div className="coach-id-photo-placeholder">
                <User size={36} strokeWidth={1.5} />
              </div>
            )}
            <div className="coach-id-specialty-badge">{specialtyLabel}</div>
          </div>

          <div className="coach-id-info">
            <div className="coach-id-name">{coach.name}</div>
            {coach.nameAr && <div className="coach-id-name-ar" dir="rtl">{coach.nameAr}</div>}
            <div className="coach-id-divider" />
            <div className="coach-id-detail-row" dir={isRtl ? "rtl" : "ltr"}>
              <span className="coach-id-label">{isRtl ? "التخصص" : "Specialty"}</span>
              <span className="coach-id-value">{specialtyLabel}</span>
            </div>
            <div className="coach-id-detail-row" dir={isRtl ? "rtl" : "ltr"}>
              <span className="coach-id-label">{isRtl ? "تاريخ الانضمام" : "Join Date"}</span>
              <span className="coach-id-value">{coach.joinDate}</span>
            </div>
            {coach.phone && (
              <div className="coach-id-detail-row" dir={isRtl ? "rtl" : "ltr"}>
                <span className="coach-id-label">{isRtl ? "الهاتف" : "Phone"}</span>
                <span className="coach-id-value">{coach.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="coach-id-footer">
          <div className="coach-id-code-section">
            <span className="coach-id-code-label">COACH ID</span>
            <span className="coach-id-code">{coach.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="coach-id-since">
            <span className="coach-id-since-label">{isRtl ? "عضو منذ" : "Member Since"}</span>
            <span className="coach-id-since-value">{coach.joinDate.slice(0, 4)}</span>
          </div>
          <div className={`coach-id-status ${coach.status === "active" ? "coach-id-status-active" : ""}`}>
            {t(`coaches.${coach.status}`)}
          </div>
        </div>
      </div>

      <style>{`
        .coach-id-wrapper {
          width: 340px;
          font-family: 'Cairo', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .coach-id-front {
          width: 340px;
          height: 214px;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #0f1b35 0%, #162754 50%, #1e3a8a 100%);
          color: #fff;
          position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
        }

        .coach-id-diagonal {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 100%;
          background: rgba(251,191,36,0.06);
          clip-path: polygon(40% 0%, 100% 0%, 100% 100%, 0% 100%);
          pointer-events: none;
        }

        .coach-id-front::before {
          content: '';
          position: absolute;
          top: -30px;
          left: -30px;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: rgba(255,255,255,0.025);
          pointer-events: none;
        }

        .coach-id-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px 6px;
          border-bottom: 1px solid rgba(251,191,36,0.2);
          position: relative;
          z-index: 1;
        }

        .coach-id-logo {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid rgba(251,191,36,0.3);
        }

        .coach-id-header-text {
          flex: 1;
        }

        .coach-id-academy-name {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #fbbf24;
        }

        .coach-id-subtitle {
          font-size: 8px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 1px;
          margin-top: 1px;
          text-transform: uppercase;
        }

        .coach-id-role-badge {
          background: linear-gradient(135deg, #d97706, #fbbf24);
          color: #0f1b35;
          font-size: 9px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 1.5px;
        }

        .coach-id-body {
          display: flex;
          gap: 12px;
          padding: 10px 14px;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .coach-id-photo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .coach-id-photo {
          width: 72px;
          height: 86px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid rgba(251,191,36,0.4);
        }

        .coach-id-photo-placeholder {
          width: 72px;
          height: 86px;
          border-radius: 8px;
          border: 2px dashed rgba(251,191,36,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.03);
        }

        .coach-id-specialty-badge {
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #fbbf24;
          text-align: center;
          max-width: 72px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .coach-id-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .coach-id-name {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #ffffff;
        }

        .coach-id-name-ar {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          direction: rtl;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Cairo', sans-serif;
        }

        .coach-id-divider {
          height: 1px;
          background: rgba(251,191,36,0.2);
          margin: 3px 0;
        }

        .coach-id-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          gap: 4px;
        }

        .coach-id-label {
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          white-space: nowrap;
        }

        .coach-id-value {
          color: rgba(255,255,255,0.85);
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .coach-id-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 14px 8px;
          background: rgba(0,0,0,0.3);
          border-top: 1px solid rgba(251,191,36,0.15);
          position: relative;
          z-index: 1;
        }

        .coach-id-code-section {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .coach-id-code-label {
          font-size: 7px;
          color: rgba(255,255,255,0.35);
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .coach-id-code {
          font-size: 14px;
          font-weight: 900;
          font-family: 'Courier New', monospace;
          color: #fbbf24;
          letter-spacing: 2px;
        }

        .coach-id-since {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .coach-id-since-label {
          font-size: 7px;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .coach-id-since-value {
          font-size: 11px;
          color: rgba(255,255,255,0.75);
          font-weight: 700;
        }

        .coach-id-status {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.45);
        }

        .coach-id-status-active {
          background: rgba(251,191,36,0.18);
          color: #fbbf24;
        }

        @media print {
          .coach-id-front {
            box-shadow: none;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
