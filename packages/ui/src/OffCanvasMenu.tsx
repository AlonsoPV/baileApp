import React, { useEffect } from "react";

export type OffCanvasMenuItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  /** Current path must match this for active styling */
  activePath?: string;
  /** If true, only exact pathname match; else prefix match */
  activeExact?: boolean;
};

export type OffCanvasMenuSection = {
  id: string;
  title?: string;
  items: OffCanvasMenuItem[];
};

function normalizePath(p: string) {
  const s = p.split("?")[0] || "";
  if (s.length > 1 && s.endsWith("/")) return s.slice(0, -1);
  return s;
}

export function isOffCanvasItemActive(pathname: string, item: OffCanvasMenuItem): boolean {
  if (!item.activePath || item.disabled) return false;
  const pn = normalizePath(pathname);
  const ap = normalizePath(item.activePath);
  if (item.activeExact) return pn === ap;
  return pn === ap || pn.startsWith(`${ap}/`);
}

export interface OffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  menuSections: OffCanvasMenuSection[];
  logoutItem: OffCanvasMenuItem;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  displayName?: string;
  /** e.g. default profile type label */
  profileBadge?: string;
  brandName?: string;
  brandLogoUrl?: string;
  menuTitle?: string;
  closeLabel?: string;
  onViewProfile?: () => void;
  viewProfileLabel?: string;
  footerInfoLabel?: string;
  footerLegalLabel?: string;
  disabledItemHint?: string;
  appVersion?: string;
}

export const OffCanvasMenu: React.FC<OffCanvasMenuProps> = ({
  isOpen,
  onClose,
  pathname,
  menuSections,
  logoutItem,
  userName = "User",
  userEmail,
  userAvatar,
  displayName,
  profileBadge,
  brandName = "BaileApp",
  brandLogoUrl,
  menuTitle = "Menu",
  closeLabel = "Close",
  onViewProfile,
  viewProfileLabel = "View profile",
  footerInfoLabel = "Info",
  footerLegalLabel = "Legal",
  disabledItemHint = "Coming soon",
  appVersion = "BaileApp v1.0.0",
}) => {
  const normalizeAvatar = (src?: string) => {
    if (!src) return undefined;
    const v = String(src).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith("/")) return v;
    return undefined;
  };
  const safeUserAvatar = normalizeAvatar(userAvatar);

  const flatForFooter = React.useMemo(() => {
    const items = menuSections.flatMap((s) => s.items);
    return [...items, logoutItem];
  }, [menuSections, logoutItem]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <div
      className="oc-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: isOpen ? "auto" : "none",
        visibility: isOpen ? "visible" : "hidden",
      }}
      aria-hidden={!isOpen}
    >
      <div
        className="oc-backdrop"
        onClick={onClose}
        role="presentation"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg, rgba(5, 8, 14, 0.82) 0%, rgba(8, 12, 20, 0.72) 45%, rgba(5, 8, 14, 0.55) 100%)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      <aside
        className="oc-panel"
        role="dialog"
        aria-modal="true"
        aria-label={menuTitle}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(100vw - 20px, 360px)",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #12151c 0%, #0c0f14 48%, #0a0c10 100%)",
          boxShadow:
            isOpen
              ? "24px 0 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.06) inset"
              : "none",
          transform: isOpen ? "translateX(0)" : "translateX(-104%)",
          transition: "transform 0.34s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.34s ease",
          borderRadius: "0 20px 20px 0",
          overflow: "hidden",
        }}
      >
        {/* Top bar: brand + close */}
        <header className="oc-topbar">
          <div className="oc-brand">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt=""
                width={36}
                height={36}
                style={{
                  borderRadius: 10,
                  objectFit: "cover",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                }}
              />
            ) : (
              <div className="oc-brand-fallback" aria-hidden>
                {brandName.charAt(0)}
              </div>
            )}
            <div className="oc-brand-text">
              <span className="oc-brand-name">{brandName}</span>
              <span className="oc-brand-tag">{menuTitle}</span>
            </div>
          </div>
          <button
            type="button"
            className="oc-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <span aria-hidden className="oc-close-icon" />
          </button>
        </header>

        <div className="oc-scroll">
          {/* User card */}
          <section className="oc-user-wrap">
            <div className="oc-user-card">
              <div className="oc-user-card-inner">
                <div
                  className="oc-avatar"
                  style={{
                    backgroundImage: safeUserAvatar
                      ? `url(${safeUserAvatar})`
                      : "linear-gradient(145deg, #1e6b82 0%, #297f96 42%, #c9a227 100%)",
                    backgroundSize: safeUserAvatar ? "cover" : "auto",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {!safeUserAvatar && (displayName || userName).charAt(0).toUpperCase()}
                </div>
                <div className="oc-user-meta">
                  <div className="oc-user-name">{displayName || userName}</div>
                  {userEmail ? <div className="oc-user-email">{userEmail}</div> : null}
                  {profileBadge ? (
                    <div className="oc-user-badge">
                      <span className="oc-user-badge-dot" aria-hidden />
                      {profileBadge}
                    </div>
                  ) : null}
                </div>
              </div>
              {onViewProfile ? (
                <button type="button" className="oc-profile-cta" onClick={onViewProfile}>
                  <span>{viewProfileLabel}</span>
                  <span className="oc-profile-cta-arrow" aria-hidden>
                    →
                  </span>
                </button>
              ) : null}
            </div>
          </section>

          {/* Sections */}
          {menuSections.map((section) =>
            section.items.length === 0 ? null : (
              <nav key={section.id} className="oc-section" aria-labelledby={`oc-sec-${section.id}`}>
                {section.title ? (
                  <div id={`oc-sec-${section.id}`} className="oc-section-title">
                    {section.title}
                  </div>
                ) : null}
                <ul className="oc-nav-list">
                  {section.items.map((item) => {
                    const active = isOffCanvasItemActive(pathname, item);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`oc-nav-item${active ? " oc-nav-item--active" : ""}${
                            item.disabled ? " oc-nav-item--disabled" : ""
                          }`}
                          disabled={item.disabled}
                          onClick={() => {
                            if (!item.disabled) {
                              item.onClick();
                              onClose();
                            }
                          }}
                        >
                          <span className="oc-nav-item-accent" aria-hidden />
                          {item.icon ? (
                            <span className="oc-nav-icon" aria-hidden>
                              {item.icon}
                            </span>
                          ) : null}
                          <span className="oc-nav-copy">
                            <span className="oc-nav-title">{item.label}</span>
                            {item.subtitle ? (
                              <span className="oc-nav-sub">{item.subtitle}</span>
                            ) : null}
                          </span>
                          {item.disabled ? (
                            <span className="oc-nav-hint">{disabledItemHint}</span>
                          ) : (
                            <span className="oc-nav-chev" aria-hidden>
                              ›
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )
          )}

          {/* Logout */}
          <div className="oc-logout-wrap">
            <button
              type="button"
              className="oc-logout"
              onClick={() => {
                logoutItem.onClick();
                onClose();
              }}
            >
              <span className="oc-nav-icon" aria-hidden>
                {logoutItem.icon ?? "🚪"}
              </span>
              <span className="oc-logout-label">{logoutItem.label}</span>
            </button>
          </div>
        </div>

        <footer className="oc-footer">
          <div className="oc-footer-links">
            <button
              type="button"
              className="oc-footer-link"
              onClick={() => {
                const infoItem = flatForFooter.find(
                  (item) => item.id === "info" || item.id === "roles-info"
                );
                if (infoItem) {
                  infoItem.onClick();
                  onClose();
                }
              }}
            >
              <span aria-hidden>ℹ️</span> {footerInfoLabel}
            </button>
            <button
              type="button"
              className="oc-footer-link"
              onClick={() => {
                const legalItem = flatForFooter.find((item) => item.id === "legal");
                if (legalItem) {
                  legalItem.onClick();
                  onClose();
                }
              }}
            >
              <span aria-hidden>📄</span> {footerLegalLabel}
            </button>
          </div>
          <div className="oc-version">{appVersion}</div>
        </footer>
      </aside>

      <style>{`
        .oc-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: calc(12px + env(safe-area-inset-top, 0px)) 18px 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: linear-gradient(180deg, rgba(41, 127, 150, 0.14) 0%, rgba(18, 21, 28, 0) 100%);
          flex-shrink: 0;
        }
        .oc-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .oc-brand-fallback {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          color: #fff;
          background: linear-gradient(145deg, #1e6b82, #297f96);
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        }
        .oc-brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .oc-brand-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f4f6fb;
          letter-spacing: -0.02em;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .oc-brand-tag {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(186, 230, 253, 0.55);
        }
        .oc-close {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        }
        .oc-close:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.18);
        }
        .oc-close:active {
          transform: scale(0.96);
        }
        .oc-close-icon {
          display: block;
          width: 16px;
          height: 16px;
          position: relative;
        }
        .oc-close-icon::before,
        .oc-close-icon::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 2px;
          background: #e8ecf4;
          border-radius: 1px;
        }
        .oc-close-icon::before { transform: translate(-50%, -50%) rotate(45deg); }
        .oc-close-icon::after { transform: translate(-50%, -50%) rotate(-45deg); }

        .oc-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding: 16px 16px 8px;
        }

        .oc-user-wrap {
          margin-bottom: 8px;
        }
        .oc-user-card {
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(41, 127, 150, 0.35), rgba(255, 255, 255, 0.06));
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        }
        .oc-user-card-inner {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 14px 14px 12px;
          border-radius: 15px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(12, 15, 20, 0.92) 100%);
        }
        .oc-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          font-weight: 700;
          color: #fff;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.12);
        }
        .oc-user-meta {
          flex: 1;
          min-width: 0;
        }
        .oc-user-name {
          font-size: 1.05rem;
          font-weight: 650;
          color: #f8fafc;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .oc-user-email {
          margin-top: 4px;
          font-size: 0.78rem;
          color: rgba(203, 213, 225, 0.85);
          line-height: 1.3;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .oc-user-badge {
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(165, 243, 252, 0.85);
        }
        .oc-user-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5eead4;
          box-shadow: 0 0 10px rgba(94, 234, 212, 0.5);
        }
        .oc-profile-cta {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          margin: 0;
          border: none;
          border-radius: 0 0 14px 14px;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
          color: #e0f2fe;
          background: rgba(41, 127, 150, 0.22);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .oc-profile-cta:hover {
          background: rgba(41, 127, 150, 0.35);
          color: #fff;
        }
        .oc-profile-cta:active {
          background: rgba(41, 127, 150, 0.45);
        }
        .oc-profile-cta-arrow {
          opacity: 0.85;
          font-size: 1rem;
        }

        .oc-section {
          margin-top: 18px;
        }
        .oc-section:first-of-type {
          margin-top: 4px;
        }
        .oc-section-title {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(148, 163, 184, 0.75);
          padding: 0 6px 10px;
        }

        .oc-nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .oc-nav-item {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          min-height: 52px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #e5e7eb;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
        }
        .oc-nav-item:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .oc-nav-item:active:not(:disabled) {
          transform: scale(0.99);
        }
        .oc-nav-item--active {
          background: linear-gradient(90deg, rgba(41, 127, 150, 0.22) 0%, rgba(41, 127, 150, 0.06) 100%);
          border-color: rgba(41, 127, 150, 0.45);
          color: #f8fafc;
        }
        .oc-nav-item--active .oc-nav-chev {
          color: rgba(186, 230, 253, 0.9);
        }
        .oc-nav-item-accent {
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: transparent;
          transition: background 0.18s ease;
        }
        .oc-nav-item--active .oc-nav-item-accent {
          background: linear-gradient(180deg, #5eead4, #297f96);
          box-shadow: 0 0 14px rgba(41, 127, 150, 0.55);
        }
        .oc-nav-item--disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .oc-nav-icon {
          font-size: 1.28rem;
          line-height: 1;
          width: 28px;
          text-align: center;
          flex-shrink: 0;
        }
        .oc-nav-copy {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .oc-nav-title {
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.25;
        }
        .oc-nav-sub {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.95);
          line-height: 1.2;
        }
        .oc-nav-chev {
          flex-shrink: 0;
          font-size: 1.15rem;
          font-weight: 400;
          color: rgba(148, 163, 184, 0.65);
        }
        .oc-nav-hint {
          font-size: 0.7rem;
          font-style: italic;
          color: rgba(156, 163, 175, 0.95);
        }

        .oc-logout-wrap {
          margin-top: 20px;
          padding-top: 6px;
        }
        .oc-logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 16px;
          min-height: 54px;
          border-radius: 14px;
          border: 1px solid rgba(248, 113, 113, 0.28);
          background: rgba(127, 29, 29, 0.2);
          color: #fecaca;
          font-size: 0.95rem;
          font-weight: 650;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.12s ease;
        }
        .oc-logout:hover {
          background: rgba(127, 29, 29, 0.32);
          border-color: rgba(248, 113, 113, 0.42);
          color: #fff;
        }
        .oc-logout:active {
          transform: scale(0.99);
        }
        .oc-logout-label {
          letter-spacing: -0.01em;
        }

        .oc-footer {
          flex-shrink: 0;
          padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(8, 10, 14, 0.92);
        }
        .oc-footer-links {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px 20px;
          margin-bottom: 8px;
        }
        .oc-footer-link {
          background: none;
          border: none;
          color: rgba(148, 163, 184, 0.95);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 6px;
          border-radius: 8px;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .oc-footer-link:hover {
          color: #e5e7eb;
          background: rgba(255, 255, 255, 0.05);
        }
        .oc-version {
          text-align: center;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(100, 116, 139, 0.95);
        }

        @media (max-width: 480px) {
          .oc-scroll { padding: 14px 12px 6px; }
          .oc-topbar { padding-left: 14px; padding-right: 14px; }
          .oc-nav-item { min-height: 56px; padding: 14px 13px; }
          .oc-avatar { width: 52px; height: 52px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .oc-backdrop,
          .oc-panel,
          .oc-nav-item,
          .oc-close,
          .oc-logout,
          .oc-profile-cta {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
