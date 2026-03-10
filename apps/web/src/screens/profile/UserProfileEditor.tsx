// path: src/pages/profile/UserProfileEditor.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useUserMediaSlots } from "../../hooks/useUserMediaSlots";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import { toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { getMediaBySlot, type MediaItem } from "../../utils/mediaSlots";
import { useToast } from "../../components/Toast";
import RitmosSelectorEditor from "@/components/profile/RitmosSelectorEditor";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { useTags } from "../../hooks/useTags";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
// import { VideoManagementSection } from '../../components/profile/VideoManagementSection';
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { normalizeSocialInput } from "../../utils/social";
import { useQueryClient } from "@tanstack/react-query";
import { getDraftKey } from "../../utils/draftKeys";
import { useRoleChange } from "../../hooks/useRoleChange";
import { ensureMaxVideoDuration } from "../../utils/videoValidation";
import { FilterPreferencesModal } from "../../components/profile/FilterPreferencesModal";
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaWhatsapp } from "react-icons/fa";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { validateZonasAgainstCatalog } from "../../utils/validateZonas";
import { useTranslation } from "react-i18next";
import { resolveSupabaseStoragePublicUrl } from "../../utils/supabaseStoragePublicUrl";
import "./UserEditor.css";

const colors = {
  dark: "#121212",
  light: "#F5F5F5",
  grad: "linear-gradient(135deg, #FF4D4D, #FFB200 35%, #2D9CDB 70%, #FFE056)",
};

export default function UserProfileEditor() {
  // ✅ Hooks always on top (no conditional calls)
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfileFields, refetchProfile } = useUserProfile();

  const [authTimeoutReached, setAuthTimeoutReached] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading) {
      setAuthTimeoutReached(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setAuthTimeoutReached(true);
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [authLoading]);

  React.useEffect(() => {
    if (!isAndroid) return;
    const el = document.querySelector(".app-shell-content") as HTMLElement | null;
    if (!el) return;
    const prevTop = el.style.paddingTop;
    const prevBottom = el.style.paddingBottom;
    el.style.paddingTop = "0px";
    el.style.paddingBottom = "0px";
    return () => {
      el.style.paddingTop = prevTop;
      el.style.paddingBottom = prevBottom;
    };
  }, [isAndroid]);

  const { media, uploadToSlot, removeFromSlot } = useUserMediaSlots();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useRoleChange();

  const { data: allTags } = useTags();
  const ritmoTags = React.useMemo(() => (allTags?.filter((t: any) => t.tipo === "ritmo") ?? []), [allTags]);

  // ✅ draftKey stable even when user is null (prevents draft churn)
  const draftKey = React.useMemo(() => getDraftKey(user?.id ?? "anon", "user"), [user?.id]);

  const { form, setField, setNested, setFromServer, hydrated } = useHydratedForm({
    draftKey,
    serverData: profile as any,
    defaults: {
      display_name: "",
      bio: "",
      rol_baile: null as "lead" | "follow" | "ambos" | null,
      ritmos_seleccionados: [] as string[],
      ritmos: [] as number[],
      zonas: [] as number[],
      respuestas: {
        redes: {
          instagram: "",
          tiktok: "",
          youtube: "",
          facebook: "",
          whatsapp: "",
        },
        dato_curioso: "",
        gusta_bailar: "",
      },
    },
    preferDraft: true,
  });

  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [removing, setRemoving] = useState<{ [key: string]: boolean }>({});
  const [showFilterPreferences, setShowFilterPreferences] = useState(false);
  const [isSocialSectionCollapsed, setIsSocialSectionCollapsed] = useState(false);

  const toSupabasePublicUrl = (maybePath?: string): string | undefined => resolveSupabaseStoragePublicUrl(maybePath);

  const mediaWithAvatarFallback: MediaItem[] = React.useMemo(() => {
    const base = Array.isArray(media) ? media.slice() : [];
    const hasP1 = !!getMediaBySlot(base as any, "p1");
    if (!hasP1 && profile?.avatar_url) {
      const url =
        toDirectPublicStorageUrl(toSupabasePublicUrl(profile.avatar_url)) ?? toSupabasePublicUrl(profile.avatar_url);
      if (url) {
        base.push({
          slot: "p1",
          kind: "photo",
          url,
          id: "avatar-fallback",
        } as MediaItem);
      }
    }
    return base as MediaItem[];
  }, [media, profile?.avatar_url]);

  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    if (!user) return;

    if (kind === "video") {
      try {
        await ensureMaxVideoDuration(file, 25);
      } catch (error) {
        console.error("[UserProfileEditor] Video demasiado largo:", error);
        showToast(error instanceof Error ? error.message : "El video debe durar máximo 25 segundos", "error");
        return;
      }
    }

    setUploading((prev) => ({ ...prev, [slot]: true }));

    try {
      await uploadToSlot.mutateAsync({ file, slot, kind });
      showToast(`${kind === "photo" ? t("photo") : t("video")} ${t("uploaded_successfully")}`, "success");
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast("Error al subir el archivo", "error");
    } finally {
      setUploading((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const removeFile = async (slot: string) => {
    setRemoving((prev) => ({ ...prev, [slot]: true }));
    try {
      await removeFromSlot.mutateAsync(slot);
      showToast("Archivo eliminado", "success");
    } catch (error) {
      console.error("Error removing file:", error);
      showToast("Error al eliminar el archivo", "error");
    } finally {
      setRemoving((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const toggleZona = (id: number) => {
    if (form.zonas.includes(id)) {
      setField("zonas", []);
    } else {
      setField("zonas", [id]);
    }
  };

 // inside UserProfileEditor.tsx

const handleSave = async () => {
  if (!user) return;
  if (isSaving) return;

  setIsSaving(true);
  try {
    // ✅ redes solo para columna redes_sociales
    const redes = normalizeSocialInput(form.respuestas?.redes || {});

    // Ritmos seleccionados (igual que antes)
    let outRitmosSeleccionados = (((form as any).ritmos_seleccionados ?? []) as string[]).filter(Boolean);

    if (
      outRitmosSeleccionados.length === 0 &&
      Array.isArray(form.ritmos) &&
      form.ritmos.length > 0 &&
      Array.isArray(ritmoTags)
    ) {
      const labelToItemId = new Map<string, string>();
      RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => labelToItemId.set(i.label, i.id)));

      const names = form.ritmos
        .map((id) => ritmoTags.find((t: any) => t.id === id)?.nombre)
        .filter(Boolean) as string[];

      const mapped = names.map((n) => labelToItemId.get(n)).filter(Boolean) as string[];
      if (mapped.length > 0) outRitmosSeleccionados = mapped;
    }

    const validatedZonas = validateZonasAgainstCatalog(form.zonas, allTags);

    // ✅ respuestas SOLO preguntas (NO redes)
    const prevRespuestas = (profile?.respuestas || {}) as Record<string, any>;
    const respuestasSoloPreguntas = {
      ...prevRespuestas,
      // Elimina cualquier rastro previo de "redes" en respuestas
      redes: undefined,
      dato_curioso: form.respuestas?.dato_curioso ?? null, // id="pregunta-uno"
      gusta_bailar: form.respuestas?.gusta_bailar ?? null, // id="pregunta-dos"
    };
    // quitar keys undefined (para que buildSafePatch no mande "redes": undefined)
    delete (respuestasSoloPreguntas as any).redes;

    const candidate = {
      display_name: form.display_name,
      bio: form.bio,
      rol_baile: (form as any).rol_baile || null,

      // ✅ NOT NULL guard
      ritmos_seleccionados: Array.isArray(outRitmosSeleccionados) ? outRitmosSeleccionados : [],
      ritmos: Array.isArray(form.ritmos) ? form.ritmos : [],
      zonas: Array.isArray(validatedZonas) ? validatedZonas : [],

      // ✅ SOLO preguntas aquí
      respuestas: respuestasSoloPreguntas,

      // ✅ SOLO redes aquí
      redes_sociales: redes,
    };

    await updateProfileFields(candidate as any);

    const fresh = await refetchProfile();
    if (fresh) setFromServer(fresh as any);

    queryClient.invalidateQueries({ queryKey: ["profile", "me", user.id] });
    queryClient.invalidateQueries({ queryKey: ["profile", "media", user.id] });

    showToast("Perfil actualizado ✅", "success");
  } catch (error) {
    console.error("Error saving profile:", error);
    showToast("Error al guardar", "error");
  } finally {
    setIsSaving(false);
  }
};

  if (authLoading && !authTimeoutReached) {
    return (
      <>
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "#F5F5F5",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
          <p style={{ marginBottom: "8px" }}>{t("loading_your_session")}</p>
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>{t("refresh_page_for_faster_load")}</p>
        </div>
      </>
    );
  }

  if (authLoading && authTimeoutReached) {
    return (
      <>
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "#F5F5F5",
          }}
        >
          <div style={{ fontSize: "2.2rem", marginBottom: "16px" }}>⚠️</div>
          <p style={{ marginBottom: "12px" }}>No pudimos cargar tu sesión. Revisa tu conexión e inténtalo de nuevo.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "4px",
              padding: "0.5rem 1.25rem",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.35)",
              background: "transparent",
              color: "#F5F5F5",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "#F5F5F5",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>🔒</div>
          <p>No has iniciado sesión</p>
        </div>
      </>
    );
  }

  if (!hydrated && !authLoading) {
    return (
      <>
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "#F5F5F5",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
          <p>{t("loading_your_info")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`editor-container${isAndroid ? " editor-container--android-tight" : ""}`}>
        <div className="editor-content">
          <div className="editor-header">
            <button onClick={() => navigate(-1)} className="editor-back-btn">
              ← {t("back")}
            </button>
            <h1 className="editor-title">✏️ {t("edit_profile")}</h1>
            <div style={{ width: "100px" }}></div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            <ProfileNavigationToggle
              currentView="edit"
              profileType="user"
              onSave={handleSave}
              isSaving={isSaving}
              saveDisabled={isSaving || !form.display_name?.trim()}
            />
            <button
              onClick={() => navigate("/profile/settings")}
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                color: colors.light,
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
            >
              ⚙️ {t("settings")}
            </button>
          </div>

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">{t("personal_information")}</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                alignItems: "start",
              }}
              className="info-redes-grid"
            >
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="editor-field">{t("username")}</label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setField("display_name", e.target.value)}
                    placeholder={t("username")}
                    className="editor-input"
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label className="editor-field">{t("biography")}</label>
                  <textarea
                    value={form.bio || ""}
                    onChange={(e) => setField("bio", e.target.value)}
                    placeholder={t("tell_us_about_you")}
                    rows={3}
                    className="editor-textarea"
                  />
                </div>
              </div>

              <div className="profile-section-compact">
                <div className="row-top">
                  <h3 className="title">{t("how_do_you_identify")}</h3>
                  <div className="identity-pills">
                    {(["lead", "follow", "ambos"] as const).map((rol) => (
                      <label key={rol} className={`pill ${(form as any).rol_baile === rol ? "pill-checked" : ""}`}>
                        <input
                          type="radio"
                          name="identidad"
                          value={rol}
                          checked={(form as any).rol_baile === rol}
                          onChange={(e) => setField("rol_baile", e.target.value as "lead" | "follow" | "ambos")}
                        />
                        <span className="pill-content">
                          <span className="pill-icon">
                            {rol === "lead" && "🕺"}
                            {rol === "follow" && "💃"}
                            {rol === "ambos" && "💃🕺"}
                          </span>
                          <span className="pill-text">
                            {rol === "lead" && "Lead"}
                            {rol === "follow" && "Follow"}
                            {rol === "ambos" && "Ambos"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="row-bottom">
                  <div className="row-bottom-header">
                    <div className="row-bottom-title-group">
                      <h4 className="subtitle">{t("social_networks")}</h4>
                      <span className="tag">{t("optional")}</span>
                    </div>
                    <button
                      type="button"
                      className="row-bottom-toggle"
                      onClick={() => setIsSocialSectionCollapsed((prev) => !prev)}
                      aria-expanded={!isSocialSectionCollapsed}
                      aria-controls="user-social-networks-list"
                      title={isSocialSectionCollapsed ? "Expandir" : "Colapsar"}
                    >
                      {isSocialSectionCollapsed ? "▾" : "▴"}
                    </button>
                  </div>

                  {!isSocialSectionCollapsed && (
                  <div className="social-list" id="user-social-networks-list">
                    <label className="field">
                      <span className="field-icon">
                        <FaInstagram size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">ig/</span>
                        <input
                          type="text"
                          name="instagram"
                          value={form.respuestas?.redes?.instagram || ""}
                          onChange={(e) => setNested("respuestas.redes.instagram", e.target.value)}
                          placeholder="usuario"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaTiktok size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">@</span>
                        <input
                          type="text"
                          name="tiktok"
                          value={form.respuestas?.redes?.tiktok || ""}
                          onChange={(e) => setNested("respuestas.redes.tiktok", e.target.value)}
                          placeholder="usuario"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaYoutube size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">yt/</span>
                        <input
                          type="text"
                          name="youtube"
                          value={form.respuestas?.redes?.youtube || ""}
                          onChange={(e) => setNested("respuestas.redes.youtube", e.target.value)}
                          placeholder="canal o handle"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaFacebookF size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">fb/</span>
                        <input
                          type="text"
                          name="facebook"
                          value={form.respuestas?.redes?.facebook || ""}
                          onChange={(e) => setNested("respuestas.redes.facebook", e.target.value)}
                          placeholder="usuario o página"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaWhatsapp size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">+52</span>
                        <input
                          type="tel"
                          name="whatsapp"
                          value={form.respuestas?.redes?.whatsapp || ""}
                          onChange={(e) => setNested("respuestas.redes.whatsapp", e.target.value)}
                          placeholder="55 1234 5678"
                        />
                      </div>
                    </label>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">📅 {t("events_and_purchases")}</h2>
            <p
              style={{
                marginBottom: "1.5rem",
                color: "rgba(255,255,255,0.75)",
                fontSize: "0.95rem",
              }}
            >
              {t("events_and_purchases_description")}
            </p>

            <div
              style={{
                display: "grid",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/me/rsvps")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.85rem 1.25rem",
                  background: "linear-gradient(135deg, rgba(240,147,251,0.35), rgba(245,87,108,0.35))",
                  border: "1px solid rgba(240,147,251,0.6)",
                  borderRadius: 12,
                  cursor: "pointer",
                  color: colors.light,
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(240,147,251,0.45)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.15rem" }}>🎫 {t("my_rsvps")}</div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{t("view_rsvps_description")}</div>
                </div>
                <div style={{ fontSize: "1.4rem" }}>→</div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/me/compras")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.85rem 1.25rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 12,
                  cursor: "pointer",
                  color: colors.light,
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(96,165,250,0.8)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(96,165,250,0.45)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.15rem" }}>🧾 {t("my_purchases")}</div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{t("view_purchases_description")}</div>
                </div>
                <div style={{ fontSize: "1.4rem" }}>→</div>
              </button>
            </div>
          </div>

          <div
            className="editor-section glass-card-container academy-editor-card"
            style={{
              marginBottom: "3rem",
              position: "relative",
              overflow: "visible",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "linear-gradient(135deg, rgba(19,21,27,0.85), rgba(16,18,24,0.85))",
              zIndex: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: "linear-gradient(90deg, #f093fb, #f5576c, #FFD166)",
                zIndex: 1,
              }}
            />

            <div
              className="rhythms-zones-two-columns"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                padding: "1.25rem",
                position: "relative",
                zIndex: 0,
              }}
            >
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#1E88E5,#7C4DFF)",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 10px 24px rgba(30,136,229,0.35)",
                    }}
                  >
                    🎵
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.35rem",
                        fontWeight: 900,
                        color: "#fff",
                        textShadow:
                          "rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px",
                      }}
                    >
                      Ritmos que Bailas
                    </h2>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Selecciona los ritmos que bailas</div>
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Catálogo agrupado</div>
                  <RitmosSelectorEditor
                    selected={(((form as any)?.ritmos_seleccionados) || []) as string[]}
                    ritmoTags={ritmoTags}
                    setField={setField as any}
                  />
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#1976D2,#00BCD4)",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 10px 24px rgba(25,118,210,0.35)",
                    }}
                  >
                    🗺️
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.35rem",
                        fontWeight: 900,
                        color: "#fff",
                        textShadow:
                          "rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px",
                      }}
                    >
                      ¿De donde eres?
                    </h2>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Indica tu zona de origen (solo una)</div>
                  </div>
                </div>

                <div className="academy-chips-container" style={{ position: "relative" }}>
                  <ZonaGroupedChips
                    selectedIds={form.zonas}
                    allTags={allTags}
                    mode="edit"
                    onToggle={toggleZona}
                    icon="📍"
                    singleSelect={true}
                  />
                </div>
              </div>
            </div>
          </div>

         {/*  <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">💬 {t("custom_questions")}</h2>

            <div className="editor-grid">
              <div>
                <label className="editor-field">🎭 ¿Cuál es tu dato curioso favorito?</label>
                <textarea
                  id="pregunta-uno"
                  value={form.respuestas?.dato_curioso || ""}
                  onChange={(e) => {
                    setNested("respuestas.dato_curioso", e.target.value);
                  }}
                  placeholder="Comparte algo interesante sobre ti..."
                  rows={2}
                  className="editor-textarea"
                />
              </div>

              <div>
                <label className="editor-field">¿Qué te gusta más del baile?</label>
                <textarea
                  id="pregunta-dos"
                  value={form.respuestas?.gusta_bailar || ""}
                  onChange={(e) => {
                    setNested("respuestas.gusta_bailar", e.target.value);
                  }}
                  placeholder={t("tell_us_what_passionates_you")}
                  rows={2}
                  className="editor-textarea"
                />
              </div>
            </div>
          </div> */}

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">⭐ {t("filter_preferences")}</h2>
            <p style={{ marginBottom: "1.5rem", color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>
              {t("filter_preferences_description")}
            </p>
            <button
              onClick={() => setShowFilterPreferences(true)}
              style={{
                padding: "1rem 2rem",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, rgba(240,147,251,0.8), rgba(245,87,108,0.8))",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(240,147,251,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(240,147,251,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(240,147,251,0.3)";
              }}
            >
              ⚙️ {t("configure_filter_preferences")}
            </button>
          </div>

          <div
            className="photos-two-columns"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "3rem",
              alignItems: "stretch",
            }}
          >
            <PhotoManagementSection
              media={mediaWithAvatarFallback}
              uploading={uploading}
              removing={removing}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title={`📷 ${t("photo_management")}`}
              description={`👤 ${t("avatar_main_photo")}`}
              slots={["p1"]}
              isMainPhoto={true}
              imageVersion={profile?.updated_at}
            />

           {/*  <PhotoManagementSection
              media={mediaWithAvatarFallback}
              uploading={uploading}
              removing={removing}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title={`📷 ${t("featured_photos")}`}
              description={t("featured_photos_description")}
              slots={["p2", "p3"]}
              isMainPhoto={false}
              verticalLayout={true}
              imageVersion={profile?.updated_at}
            /> */}
          </div>

          {/* <PhotoManagementSection
            media={mediaWithAvatarFallback}
            uploading={uploading}
            removing={removing}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title={`📷 ${t("additional_photos")}`}
            description={t("photos_gallery_description")}
            slots={["p4", "p5", "p6", "p7", "p8", "p9", "p10"]}
            isMainPhoto={false}
            imageVersion={profile?.updated_at}
          /> */}

          {/*
          <VideoManagementSection
            media={mediaWithAvatarFallback}
            uploading={uploading}
            removing={removing}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title={`🎥 ${t("video_management")}`}
            description={t("videos_section_description")}
            slots={["v1", "v2", "v3"]}
          />
          */}
        </div>
      </div>

      <FilterPreferencesModal isOpen={showFilterPreferences} onClose={() => setShowFilterPreferences(false)} />
    </>
  );
}