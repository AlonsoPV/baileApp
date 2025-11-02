// src/pages/brand/BrandProfileEditor.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { useAuth } from "@/contexts/AuthProvider";
import { useMyBrand, useUpsertBrand } from "../../hooks/useBrand";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import ImageWithFallback from "../../components/ImageWithFallback";
import { MediaUploader } from "../../components/MediaUploader";
import { supabase } from "../../lib/supabase";

/** Por qué: Tipos fuertes evitan keys mal escritas y facilitan refactor. */
type Category = "calzado" | "ropa" | "accesorios";

type BrandPolicies = {
  shipping?: string;
  returns?: string;
  warranty?: string;
};

type FitTip = { style: string; tip: string };
type SizeRow = { mx: string; us: string; eu: string };

type ProductItem = {
  id: string;                // path en storage
  titulo: string;
  imagen_url: string;
  category: Category;
  price?: string;
  sizes?: string[];
};

type Conversion = {
  headline?: string;
  subtitle?: string;
  coupons?: string[];
};

type BrandForm = {
  nombre_publico: string;
  bio: string;
  redes_sociales: Record<string, string>;
  productos: ProductItem[];
  avatar_url: string | null;
  size_guide: SizeRow[];
  fit_tips: FitTip[];
  policies: BrandPolicies;
  conversion: Conversion;
};

const colors = { dark: "#121212", light: "#F5F5F5" };

type Action =
  | { type: "SET_ALL"; payload: Partial<BrandForm> }
  | { type: "SET_FIELD"; key: keyof Pick<BrandForm, "nombre_publico" | "bio">; value: string }
  | { type: "SET_RS"; key: string; value: string }
  | { type: "SET_AVATAR"; url: string | null }
  | { type: "ADD_SIZE" }
  | { type: "UPDATE_SIZE"; index: number; key: keyof SizeRow; value: string }
  | { type: "REMOVE_SIZE"; index: number }
  | { type: "ADD_FIT_TIP" }
  | { type: "UPDATE_FIT_TIP"; index: number; key: keyof FitTip; value: string }
  | { type: "REMOVE_FIT_TIP"; index: number }
  | { type: "SET_CONVERSION"; value: Partial<Conversion> }
  | { type: "ADD_COUPON"; code: string }
  | { type: "REMOVE_COUPON"; code: string }
  | { type: "SET_PRODUCTS"; value: ProductItem[] }
  | { type: "UPDATE_PRODUCT"; id: string; value: Partial<ProductItem> }
  | { type: "REMOVE_PRODUCT"; id: string }
  | { type: "SET_POLICIES"; value: Partial<BrandPolicies> };

const initialForm: BrandForm = {
  nombre_publico: "",
  bio: "",
  redes_sociales: {},
  productos: [],
  avatar_url: null,
  size_guide: [],
  fit_tips: [],
  policies: {},
  conversion: {},
};

function formReducer(state: BrandForm, action: Action): BrandForm {
  switch (action.type) {
    case "SET_ALL":
      return { ...state, ...action.payload };
    case "SET_FIELD":
      return { ...state, [action.key]: action.value } as BrandForm;
    case "SET_RS":
      return { ...state, redes_sociales: { ...state.redes_sociales, [action.key]: action.value } };
    case "SET_AVATAR":
      return { ...state, avatar_url: action.url };
    case "ADD_SIZE":
      return { ...state, size_guide: [...state.size_guide, { mx: "", us: "", eu: "" }] };
    case "UPDATE_SIZE":
      return {
        ...state,
        size_guide: state.size_guide.map((r, i) => (i === action.index ? { ...r, [action.key]: action.value } : r)),
      };
    case "REMOVE_SIZE":
      return { ...state, size_guide: state.size_guide.filter((_, i) => i !== action.index) };
    case "ADD_FIT_TIP":
      return { ...state, fit_tips: [...state.fit_tips, { style: "", tip: "" }] };
    case "UPDATE_FIT_TIP":
      return {
        ...state,
        fit_tips: state.fit_tips.map((r, i) => (i === action.index ? { ...r, [action.key]: action.value } : r)),
      };
    case "REMOVE_FIT_TIP":
      return { ...state, fit_tips: state.fit_tips.filter((_, i) => i !== action.index) };
    case "SET_CONVERSION":
      return { ...state, conversion: { ...(state.conversion || {}), ...action.value } };
    case "ADD_COUPON":
      return state.conversion?.coupons?.includes(action.code)
        ? state
        : { ...state, conversion: { ...state.conversion, coupons: [...(state.conversion.coupons || []), action.code] } };
    case "REMOVE_COUPON":
      return {
        ...state,
        conversion: {
          ...state.conversion,
          coupons: (state.conversion.coupons || []).filter((c) => c !== action.code),
        },
      };
    case "SET_PRODUCTS":
      return { ...state, productos: action.value };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        productos: state.productos.map((p) => (p.id === action.id ? { ...p, ...action.value } : p)),
      };
    case "REMOVE_PRODUCT":
      return { ...state, productos: state.productos.filter((p) => p.id !== action.id) };
    case "SET_POLICIES":
      return { ...state, policies: { ...(state.policies || {}), ...action.value } };
    default:
      return state;
  }
}

export default function BrandProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: brand } = useMyBrand();
  const upsert = useUpsertBrand();

  const [form, dispatch] = React.useReducer(formReducer, initialForm);
  const [tab, setTab] = React.useState<"info" | "products" | "lookbook" | "policies">("info");
  const [catFilter, setCatFilter] = React.useState<Category | "all">("all");

  React.useEffect(() => {
    if (!brand) return;
    // Por qué: Normalizar datos entrantes evita condicionales por todo el árbol.
    dispatch({
      type: "SET_ALL",
      payload: {
        nombre_publico: (brand as any).nombre_publico || "",
        bio: (brand as any).bio || "",
        redes_sociales: (brand as any).redes_sociales || {},
        productos: Array.isArray((brand as any).productos) ? (brand as any).productos : [],
        avatar_url: (brand as any).avatar_url || null,
        size_guide: Array.isArray((brand as any).size_guide) ? (brand as any).size_guide : [],
        fit_tips: Array.isArray((brand as any).fit_tips) ? (brand as any).fit_tips : [],
        policies: (brand as any).policies || {},
        conversion: (brand as any).conversion || {},
      },
    });
  }, [brand]);

  const handleSave = async () => {
    const payload: any = {
      id: (brand as any)?.id,
      nombre_publico: form.nombre_publico,
      bio: form.bio,
      redes_sociales: form.redes_sociales,
      productos: form.productos || [],
      avatar_url: form.avatar_url || null,
      size_guide: form.size_guide || [],
      fit_tips: form.fit_tips || [],
      policies: form.policies || {},
      conversion: form.conversion || {},
    };
    await upsert.mutateAsync(payload);
  };

  const media: string[] = Array.isArray((brand as any)?.media)
    ? ((brand as any).media as any[]).map((m) => (typeof m === "string" ? m : m?.url)).filter(Boolean)
    : [];
  const lookbook = media.map((url, i) => ({ id: i, image: url, caption: "", style: "" }));

  // ---------- Uploaders ----------
  const onPickCatalog = async (files: FileList) => {
    if (!(brand as any)?.id) {
      alert("Primero guarda la información básica para habilitar el catálogo.");
      return;
    }
    const brandId = (brand as any).id as number;
    const onlyImages = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length === 0) return;

    const uploaded: ProductItem[] = [];
    for (const file of onlyImages) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${brandId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("brand-media")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
      if (error) {
        console.error("[BrandCatalogUpload] Error:", error);
        alert(`Error al subir una imagen: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("brand-media").getPublicUrl(path);
      uploaded.push({ id: path, titulo: "", imagen_url: pub.publicUrl, category: "ropa" });
    }
    if (uploaded.length > 0) {
      dispatch({ type: "SET_PRODUCTS", value: [...form.productos, ...uploaded] });
    }
  };

  const removeCatalogItem = async (prodIdOrPath: string) => {
    try {
      await supabase.storage.from("brand-media").remove([prodIdOrPath]);
    } catch (e) {
      console.warn("[BrandCatalogRemove] No se pudo eliminar del storage (continuando):", e);
    }
    dispatch({ type: "REMOVE_PRODUCT", id: prodIdOrPath });
  };

  const onUploadLogo = async (file: File) => {
    if (!(brand as any)?.id) {
      alert("Primero guarda la información básica para habilitar el logo.");
      return;
    }
    const brandId = (brand as any).id as number;
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${brandId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("brand-media")
      .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type || undefined });
    if (error) {
      alert(error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("brand-media").getPublicUrl(path);
    dispatch({ type: "SET_AVATAR", url: pub.publicUrl });
  };

  const onPickLookbook = async (files: FileList) => {
    if (!(brand as any)?.id) {
      alert("Primero guarda la información básica para habilitar el lookbook.");
      return;
    }
    const brandId = (brand as any).id as number;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    const uploadedUrls: string[] = [];
    for (const file of imgs) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${brandId}/lookbook/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("brand-media")
        .upload(path, file, { upsert: false, cacheControl: "3600", contentType: file.type || undefined });
      if (error) {
        console.error(error);
        continue;
      }
      const { data: pub } = supabase.storage.from("brand-media").getPublicUrl(path);
      uploadedUrls.push(pub.publicUrl);
    }
    if (uploadedUrls.length > 0) {
      const prev = Array.isArray((brand as any)?.media) ? ((brand as any).media as any[]) : [];
      const next = [...uploadedUrls.map((url) => ({ type: "image", url })), ...prev];
      await supabase.from("profiles_brand").update({ media: next }).eq("id", (brand as any).id);
    }
  };

  // ---------- Estilos base ----------
  const btn = "px-4 py-3 rounded-xl font-semibold border transition";
  const btnGhost = `${btn} border-white/20 bg-white/10 text-white hover:bg-white/15`;
  const btnPrimary = `${btn} border-white/20 bg-gradient-to-tr from-blue-600/90 to-cyan-600/90 text-white`;
  const input = "w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white";
  const card = "border border-white/15 rounded-2xl bg-white/5 p-4";
  const h2 = "text-xl mb-4";

  return (
    <>
      <style>{`
        .editor-container { min-height: 100vh; background: ${colors.dark}; color: ${colors.light}; padding: 2rem; }
        .editor-content { max-width: 1200px; margin: 0 auto; }
        .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        @media (max-width: 768px) {
          .editor-container { padding: 1rem !important; }
          .editor-content { max-width: 100% !important; }
          .editor-header { flex-direction: column !important; gap: 1rem !important; text-align: center !important; }
        }
      `}</style>

      <div className="editor-container">
        <div className="editor-content">
          <div className="editor-header">
            <button onClick={() => navigate(-1)} className={btnGhost}>← Volver</button>
            <h1 className="text-2xl font-bold text-center flex-1">🏷️ Editar Perfil de Marca</h1>
            <div style={{ width: 100 }} />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button onClick={() => setTab("info")} className={tab === "info" ? btnPrimary : btnGhost}>Información</button>
            <button onClick={() => setTab("products")} className={tab === "products" ? btnPrimary : btnGhost}>Productos</button>
            <button onClick={() => setTab("lookbook")} className={tab === "lookbook" ? btnPrimary : btnGhost}>Lookbook</button>
            <button onClick={() => setTab("policies")} className={tab === "policies" ? btnPrimary : btnGhost}>Políticas</button>
          </div>

          <div className="flex justify-center items-center mb-4">
            <ProfileNavigationToggle currentView="edit" profileType="brand" onSave={handleSave} isSaving={upsert.isPending} />
          </div>

          {/* === INFO TAB === */}
          {tab === "info" && (
            <>
              <section className={card}>
                <h2 className={h2}>🏷️ Información de la Marca</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 font-semibold">Nombre Público</label>
                    <input
                      className={input}
                      type="text"
                      value={form.nombre_publico}
                      onChange={(e) => dispatch({ type: "SET_FIELD", key: "nombre_publico", value: e.target.value })}
                      placeholder="Nombre de la marca"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Biografía / Descripción</label>
                    <textarea
                      className={`${input} resize-y min-h-[120px]`}
                      value={form.bio}
                      onChange={(e) => dispatch({ type: "SET_FIELD", key: "bio", value: e.target.value })}
                      placeholder="Describe tu marca (materiales, enfoque, estilos)"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <ImageWithFallback
                    src={form.avatar_url || ""}
                    alt="logo"
                    style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,.2)" }}
                  />
                  <label className={btnGhost} style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => e.target.files?.[0] && onUploadLogo(e.target.files[0])}
                    />
                    Subir logo
                  </label>
                </div>
              </section>

              {/* Redes SOLO AQUÍ */}
              <section className={`${card} mt-6`}>
                <h2 className={h2}>📱 Redes Sociales</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { k: "instagram", label: "📸 Instagram", ph: "@tu_marca" },
                    { k: "tiktok", label: "🎵 TikTok", ph: "@tu_marca" },
                    { k: "youtube", label: "📺 YouTube", ph: "Canal o enlace" },
                    { k: "facebook", label: "👥 Facebook", ph: "Página o perfil" },
                    { k: "whatsapp", label: "💬 WhatsApp", ph: "Número de teléfono" },
                    { k: "web", label: "🌐 Sitio Web", ph: "https://" },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="block mb-1 font-semibold">{f.label}</label>
                      <input
                        className={input}
                        type="text"
                        value={form.redes_sociales?.[f.k] || ""}
                        onChange={(e) => dispatch({ type: "SET_RS", key: f.k, value: e.target.value })}
                        placeholder={f.ph}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <SocialMediaSection
                    respuestas={{ redes: form.redes_sociales || {} }}
                    redes_sociales={form.redes_sociales || {}}
                    title="🔗 Vista previa de Redes"
                    availablePlatforms={["instagram", "tiktok", "youtube", "facebook", "whatsapp", "web"]}
                  />
                </div>
              </section>

              {/* Guía de tallas + Tips */}
              <section className={`${card} mt-6`}>
                <h2 className={h2}>📏 Guía de tallas y ajuste</h2>

                {/* Equivalencias */}
                <h3 className="text-base font-semibold mb-2">Equivalencias (MX / US / EU)</h3>
                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr auto", gap: ".5rem", alignItems: "center" }}>
                  <b>MX</b>
                  <b>US</b>
                  <b>EU</b>
                  <span />
                  {form.size_guide.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <input className={input} value={row.mx} onChange={(e) => dispatch({ type: "UPDATE_SIZE", index: idx, key: "mx", value: e.target.value })} />
                      <input className={input} value={row.us} onChange={(e) => dispatch({ type: "UPDATE_SIZE", index: idx, key: "us", value: e.target.value })} />
                      <input className={input} value={row.eu} onChange={(e) => dispatch({ type: "UPDATE_SIZE", index: idx, key: "eu", value: e.target.value })} />
                      <button className={btnGhost} onClick={() => dispatch({ type: "REMOVE_SIZE", index: idx })}>Eliminar</button>
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <button className={btnGhost} onClick={() => dispatch({ type: "ADD_SIZE" })}>+ Agregar fila</button>
                  <button
                    className={btnGhost}
                    onClick={async () => {
                      if (!(brand as any)?.id) return;
                      await supabase.from("profiles_brand").update({ size_guide: form.size_guide || [] }).eq("id", (brand as any).id);
                    }}
                  >
                    Guardar guía
                  </button>
                </div>

                {/* Fit tips */}
                <h3 className="text-base font-semibold mt-6 mb-2">Consejos de ajuste por estilo</h3>
                {form.fit_tips.map((it, idx) => (
                  <div key={idx} className="grid mb-2" style={{ gridTemplateColumns: "1fr 3fr auto", gap: ".5rem", alignItems: "center" }}>
                    <input className={input} placeholder="Estilo (p. ej. Bachata)" value={it.style} onChange={(e) => dispatch({ type: "UPDATE_FIT_TIP", index: idx, key: "style", value: e.target.value })} />
                    <input className={input} placeholder="Tip (p. ej. tacón estable, suela flexible)" value={it.tip} onChange={(e) => dispatch({ type: "UPDATE_FIT_TIP", index: idx, key: "tip", value: e.target.value })} />
                    <button className={btnGhost} onClick={() => dispatch({ type: "REMOVE_FIT_TIP", index: idx })}>Eliminar</button>
                  </div>
                ))}
                <div className="mt-2 flex gap-2">
                  <button className={btnGhost} onClick={() => dispatch({ type: "ADD_FIT_TIP" })}>+ Agregar tip</button>
                  <button
                    className={btnGhost}
                    onClick={async () => {
                      if (!(brand as any)?.id) return;
                      await supabase.from("profiles_brand").update({ fit_tips: form.fit_tips || [] }).eq("id", (brand as any).id);
                    }}
                  >
                    Guardar tips
                  </button>
                </div>

                {/* Preview compacta */}
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <SizeGuide rows={form.size_guide} />
                  <FitTips tips={form.fit_tips} />
                </div>
              </section>

              {/* Conversión */}
              <section className={`${card} mt-6`}>
                <h2 className={h2}>🎁 Conversión</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 font-semibold">Encabezado</label>
                    <input
                      className={input}
                      value={form.conversion?.headline || ""}
                      onChange={(e) => dispatch({ type: "SET_CONVERSION", value: { headline: e.target.value } })}
                      placeholder="10% primera compra"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Subtítulo / Mensaje</label>
                    <input
                      className={input}
                      value={form.conversion?.subtitle || ""}
                      onChange={(e) => dispatch({ type: "SET_CONVERSION", value: { subtitle: e.target.value } })}
                      placeholder="Usa el cupón BAILE10"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <CouponEditor
                    coupons={(form.conversion?.coupons || []) as string[]}
                    onChange={(arr) => dispatch({ type: "SET_CONVERSION", value: { coupons: arr } })}
                    onSave={async (arr) => {
                      if (!(brand as any)?.id) return;
                      const next = { ...(form.conversion || {}), coupons: arr };
                      await supabase.from("profiles_brand").update({ conversion: next }).eq("id", (brand as any).id);
                    }}
                  />
                </div>

                <div className="mt-3 flex gap-2 flex-wrap items-center">
                  <span className="font-extrabold">{form.conversion?.headline || "10% primera compra"}</span>
                  <span className="opacity-85">{form.conversion?.subtitle || <>Usa uno de tus cupones</>}</span>
                </div>
              </section>
            </>
          )}

          {/* === PRODUCTS TAB === */}
          {tab === "products" && (
            <section className={`${card}`}>
              <h2 className={h2}>🛍️ Catálogo</h2>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="opacity-80">Sube fotos de tus productos. Se crearán entradas en el catálogo.</div>
                <MediaUploader onPick={onPickCatalog} />
              </div>

              {/* Filtro */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {(["all", "calzado", "ropa", "accesorios"] as const).map((c) => (
                  <button key={c} className={catFilter === c ? btnPrimary : btnGhost} onClick={() => setCatFilter(c)}>
                    {c === "all" ? "Todos" : c[0].toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>

              {/* Grid editable */}
              {form.productos.length > 0 ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                  {form.productos
                    .filter((p) => (catFilter === "all" ? true : p.category === catFilter))
                    .map((p) => (
                      <article key={p.id} className={card}>
                        <div className="flex justify-center">
                          <ImageWithFallback
                            src={p.imagen_url}
                            alt={p.titulo || "Producto"}
                            style={{ width: 350, maxWidth: "100%", height: "auto", borderRadius: 12, display: "block" }}
                          />
                        </div>
                        <div className="grid items-center gap-2 mt-2" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
                          <input
                            className={input}
                            value={p.titulo || ""}
                            onChange={(e) => dispatch({ type: "UPDATE_PRODUCT", id: p.id, value: { titulo: e.target.value } })}
                            placeholder="Nombre del producto"
                          />
                          <select
                            className={input}
                            value={p.category || "ropa"}
                            onChange={(e) => dispatch({ type: "UPDATE_PRODUCT", id: p.id, value: { category: e.target.value as Category } })}
                          >
                            <option value="calzado">Calzado</option>
                            <option value="ropa">Ropa</option>
                            <option value="accesorios">Accesorios</option>
                          </select>
                          <button className={btnGhost} onClick={() => removeCatalogItem(p.id)}>Eliminar</button>
                        </div>
                      </article>
                    ))}
                </div>
              ) : (
                <p className="opacity-80 m-0">Aún no hay productos en el catálogo.</p>
              )}

              {/* Vista previa por tabs */}
              <div className="mt-6">
                <h3 className="text-lg mb-2">👀 Vista previa</h3>
                <CatalogTabs
                  items={form.productos.map((p) => ({
                    id: p.id,
                    name: p.titulo || "Producto",
                    price: "",
                    image: p.imagen_url,
                    category: (p.category || "ropa") as Category,
                    sizes: p.sizes || [],
                  }))}
                />
              </div>
            </section>
          )}

          {/* === LOOKBOOK TAB === */}
          {tab === "lookbook" && (
            <section className={card}>
              <h2 className={h2}>🎥 Lookbook</h2>
              <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
                <div className="opacity-80">Sube fotos para tu lookbook.</div>
                <MediaUploader onPick={onPickLookbook} />
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                {lookbook.map((ph: any) => (
                  <div key={ph.id} className={card}>
                    <ImageWithFallback src={ph.image} alt={ph.caption || ""} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12 }} />
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">{ph.style || ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* === POLICIES TAB === */}
          {tab === "policies" && (
            <section className={card}>
              <h2 className={h2}>🔒 Políticas</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block mb-1 font-semibold">Envíos</label>
                  <textarea
                    className={`${input} min-h-[100px]`}
                    value={form.policies?.shipping || ""}
                    onChange={(e) => dispatch({ type: "SET_POLICIES", value: { shipping: e.target.value } })}
                    placeholder="Tiempos y zonas de envío"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Cambios / Devoluciones</label>
                  <textarea
                    className={`${input} min-h-[100px]`}
                    value={form.policies?.returns || ""}
                    onChange={(e) => dispatch({ type: "SET_POLICIES", value: { returns: e.target.value } })}
                    placeholder="Condiciones para cambios y devoluciones"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Garantía</label>
                  <textarea
                    className={`${input} min-h-[100px]`}
                    value={form.policies?.warranty || ""}
                    onChange={(e) => dispatch({ type: "SET_POLICIES", value: { warranty: e.target.value } })}
                    placeholder="Cobertura de garantía"
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  className={btnGhost}
                  onClick={async () => {
                    if (!(brand as any)?.id) return;
                    await supabase.from("profiles_brand").update({ policies: form.policies || {} }).eq("id", (brand as any).id);
                  }}
                >
                  Guardar políticas
                </button>
              </div>
              <div className="mt-3">
                <ul className="m-0 pl-5 leading-6 list-disc">
                  <li>
                    <b>Envíos:</b> {form.policies?.shipping || "Nacionales 2–5 días hábiles."}
                  </li>
                  <li>
                    <b>Cambios/Devoluciones:</b> {form.policies?.returns || "Dentro de 15 días (sin uso, en caja)."}
                  </li>
                  <li>
                    <b>Garantía:</b> {form.policies?.warranty || "30 días por defectos de fabricación."}
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

/** Subcomponentes */

function CatalogTabs({ items = [] as any[] }: { items?: any[] }) {
  const [tab, setTab] = React.useState<Category>("calzado");
  const filtered = items.filter((i: any) => i.category === tab);
  const tabs: Category[] = ["calzado", "ropa", "accesorios"];
  const btn = "px-3 py-2 rounded-full font-bold border border-white/20";
  const btnPrimary = `${btn} bg-gradient-to-tr from-blue-600/90 to-cyan-600/90 text-white`;
  const btnGhost = `${btn} bg-white/10 text-white`;
  const card = "border border-white/15 rounded-2xl bg-white/5 p-3 flex flex-col items-center";

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={t === tab ? btnPrimary : btnGhost}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="opacity-80">Sin productos en esta categoría.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
          {filtered.map((p: any) => (
            <article key={p.id} className={card}>
              <ImageWithFallback src={p.image} alt={p.name} style={{ width: 350, maxWidth: "100%", height: "auto", borderRadius: 12 }} />
              <div className="mt-2 text-center">
                <div className="font-extrabold">{p.name}</div>
                {p.price && <div className="opacity-85 my-1">{p.price}</div>}
                {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-center mt-1">
                    {p.sizes.slice(0, 6).map((s: string) => (
                      <span key={s} className="border border-white/20 rounded-full px-2 py-0.5 text-sm">
                        {s}
                      </span>
                    ))}
                    {p.sizes.length > 6 && (
                      <span className="border border-white/20 rounded-full px-2 py-0.5 text-sm">+{p.sizes.length - 6}</span>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SizeGuide({ rows = [] as SizeRow[] }) {
  const data: SizeRow[] =
    rows.length > 0
      ? rows
      : [
          { mx: "22", us: "5", eu: "35" },
          { mx: "23", us: "6", eu: "36-37" },
          { mx: "24", us: "7", eu: "38" },
          { mx: "25", us: "8", eu: "39-40" },
          { mx: "26", us: "9", eu: "41-42" },
        ];

  return (
    <div className="border border-white/15 rounded-xl bg-white/5 p-3">
      <b>Equivalencias (Calzado)</b>
      <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div>MX</div>
        <div>US</div>
        <div>EU</div>
        {data.map((r, i) => (
          <React.Fragment key={i}>
            <div>{r.mx}</div>
            <div>{r.us}</div>
            <div>{r.eu}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function FitTips({ tips = [] as FitTip[] }) {
  const data =
    tips.length > 0
      ? tips
      : [
          { style: "Bachata", tip: "Tacón estable, suela flexible, punta reforzada." },
          { style: "Salsa", tip: "Mayor soporte lateral, giro suave (suela gamuza)." },
          { style: "Kizomba", tip: "Confort prolongado, amortiguación talón." },
        ];
  return (
    <div className="border border-white/15 rounded-xl bg-white/5 p-3">
      <b>Fit recomendado por estilo</b>
      <ul className="mt-2 pl-5 leading-6 list-disc">
        {data.map((it, i) => (
          <li key={i}>
            <b>{it.style}:</b> {it.tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CouponEditor({
  coupons = [],
  onChange,
  onSave,
}: {
  coupons?: string[];
  onChange: (arr: string[]) => void;
  onSave?: (arr: string[]) => Promise<void> | void;
}) {
  const [val, setVal] = React.useState("");
  const add = () => {
    const v = val.trim();
    if (!v) return;
    if (coupons.includes(v)) return;
    onChange([...coupons, v]);
    setVal("");
  };
  const remove = (c: string) => onChange(coupons.filter((x) => x !== c));

  return (
    <div>
      <div className="flex gap-2 items-center mb-2">
        <input className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white" placeholder="Código (p. ej. BAILE10)" value={val} onChange={(e) => setVal(e.target.value)} />
        <button type="button" className="px-4 py-3 rounded-xl font-semibold border border-white/20 bg-white/10 text-white" onClick={add}>
          Agregar
        </button>
        {onSave && (
          <button type="button" className="px-4 py-3 rounded-xl font-semibold border border-white/20 bg-white/10 text-white" onClick={() => onSave(coupons)}>
            Guardar cupones
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {coupons.map((c) => (
          <span key={c} className="border border-white/20 rounded-full px-3 py-1 inline-flex items-center gap-2">
            <b>{c}</b>
            <button type="button" className="px-2 py-1 rounded-md border border-white/20 bg-white/10 text-white" onClick={() => remove(c)}>
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
