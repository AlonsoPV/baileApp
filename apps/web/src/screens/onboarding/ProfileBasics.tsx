// src/pages/onboarding/ProfileBasics.tsx
import { useState, FormEvent, ChangeEvent, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@ui/index';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import { isValidDisplayName } from '../../utils/validation';
import { mergeProfile } from '../../utils/mergeProfile';

type RolBaile = 'lead' | 'follow' | 'ambos' | '';

const TIMEOUT_MS = 15_000;
const AVATAR_MAX_MB = 5;
const AVATAR_MAX_PX = 512;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

const journeyHighlights = [
  {
    title: 'Personaliza tu presencia',
    detail: 'Este nombre será visible en tu perfil y tarjetas dentro de Dónde Bailar.',
    icon: '🎯',
  },
  {
    title: 'Foto clara y auténtica',
    detail: 'Ayuda a que la comunidad te reconozca rápidamente durante eventos y clases.',
    icon: '📸',
  },
  {
    title: 'Comparte tu estilo',
    detail: 'Describe qué te mueve al bailar y cómo participas en la comunidad.',
    icon: '💬',
  },
] as const;

const roleBadges: Record<Exclude<RolBaile, ''>, { label: string; desc: string; emoji: string }> = {
  lead: { label: 'Lead (Guía)', desc: 'Llevas la iniciativa y marcas el ritmo.', emoji: '🧭' },
  follow: { label: 'Follow (Seguidor/a)', desc: 'Interpretas y fluís con la guía.', emoji: '🎧' },
  ambos: { label: 'Ambos', desc: 'Te adaptas a ambos roles según el momento.', emoji: '♻️' },
};

// ---------- Utils de imagen ----------
async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // why: liberación de URL temporal creada sólo para carga
    URL.revokeObjectURL(url);
  }
}

function blobToFile(blob: Blob, name: string, type: string): File {
  return new File([blob], name, { type });
}

/** Recorta al centro (cover), redimensiona a maxPx x maxPx y comprime. */
async function drawSquareCover(
  img: HTMLImageElement,
  maxPx: number,
  preferWebP = true,
  quality = 0.85
): Promise<{ blob: Blob; mime: string }> {
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = Math.floor((img.naturalWidth - s) / 2);
  const sy = Math.floor((img.naturalHeight - s) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = maxPx;
  canvas.height = maxPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');

  // Deshabilitar suavizado fuerte para fotos pequeñas
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, sx, sy, s, s, 0, 0, maxPx, maxPx);

  const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const mime = preferWebP && webpSupported ? 'image/webp' : 'image/jpeg';

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), mime, quality)
  );
  return { blob, mime };
}

// ---------- Subcomponents ----------
const LoadingScreen = memo(function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.25),transparent_50%),linear-gradient(135deg,#0f172a_0%,#374151_100%)] px-[clamp(1.5rem,4vw,4rem)] flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-[50px] h-[50px] border-[4px] border-white/20 border-t-[#f472b6] rounded-full animate-spin mx-auto mb-4" />
        <p className="m-0 text-base opacity-90">Estamos cargando tu sesión...</p>
        <p className="mt-2 text-sm opacity-70">Si tarda mucho, intenta refrescar la página para una carga más rápida.</p>
      </div>
    </div>
  );
});

const JourneyHighlights = memo(function JourneyHighlights() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl bg-white/10 border border-white/15">
      {journeyHighlights.map((item) => (
        <div key={item.title} className="flex gap-3">
          <div
            className="w-11 h-11 rounded-[14px] bg-white/10 flex items-center justify-center text-[1.3rem]"
            aria-hidden
          >
            {item.icon}
          </div>
          <div>
            <p className="m-0 font-bold text-white">{item.title}</p>
            <p className="mt-1 text-sm text-gray-300">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

type AvatarInputProps = {
  previewUrl: string;
  existingUrl?: string;
  disabled: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  showRequiredHint: boolean;
};
const AvatarInput = memo(function AvatarInput({
  previewUrl,
  existingUrl,
  disabled,
  onChange,
  showRequiredHint,
}: AvatarInputProps) {
  const displayUrl = previewUrl || existingUrl || '';
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-semibold text-gray-300 mb-2">
        <span>Foto de Perfil *</span>
        <span className="text-xs text-gray-500">Formato cuadrado recomendado</span>
      </label>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-center">
          <div className="w-[110px] h-[110px] rounded-[28px] border-2 border-dashed border-pink-400/70 flex items-center justify-center overflow-hidden bg-pink-400/10">
            {displayUrl ? (
              <img src={displayUrl} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🙂</span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400">Tu foto visible en la app</p>
        </div>

        <div className="flex-1 min-w-[200px]">
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            disabled={disabled}
            className="w-full p-2 bg-white/10 border border-white/10 rounded-md text-gray-200 text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-white/20 file:text-white/90"
          />
          {showRequiredHint && <div className="mt-2 text-xs text-gray-400">Sube una imagen clara de tu rostro. Este paso es obligatorio.</div>}
        </div>
      </div>
    </div>
  );
});

type RoleOptionProps = {
  rol: Exclude<RolBaile, ''>;
  selected: RolBaile;
  onChange: (rol: RolBaile) => void;
  disabled: boolean;
};
const RoleOption = memo(function RoleOption({ rol, selected, onChange, disabled }: RoleOptionProps) {
  const active = selected === rol;
  return (
    <label
      className={[
        'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all',
        active ? 'bg-white/15 border-2 border-[var(--tw-gradient-from,#f472b6)]' : 'bg-white/10 border-2 border-transparent',
      ].join(' ')}
    >
      <input
        type="radio"
        name="rolBaile"
        value={rol}
        checked={active}
        onChange={() => onChange(rol)}
        disabled={disabled}
        className="w-[18px] h-[18px] mt-1 cursor-pointer"
      />
      <div>
        <p className="m-0 text-white font-semibold">
          {roleBadges[rol].emoji} {roleBadges[rol].label}
        </p>
        <p className="mt-1 text-sm text-gray-400">{roleBadges[rol].desc}</p>
      </div>
    </label>
  );
});

// ---------- Main ----------
export function ProfileBasics() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [rolBaile, setRolBaile] = useState<RolBaile>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileInitialized, setProfileInitialized] = useState(false);
  const submitTimeoutRef = useRef<number | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfileFields } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth/login', { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile && !profileInitialized) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.bio) setBio(profile.bio);
      const pRol = (profile as any).rol_baile as RolBaile | undefined;
      if (pRol) setRolBaile(pRol);
      if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
      setProfileInitialized(true);
    }
  }, [profile, profileInitialized]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const clearSafetyTimeout = () => {
    if (submitTimeoutRef.current) {
      window.clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
  };

  const handleAvatarChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        showToast('Formato no soportado. Usa PNG, JPG o WEBP.', 'error');
        return;
      }
      if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
        showToast(`La imagen supera ${AVATAR_MAX_MB} MB.`, 'error');
        return;
      }

      setAvatarFile(file);
      const nextUrl = URL.createObjectURL(file);
      setAvatarPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    },
    [showToast]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setError('');

      const nameValidation = isValidDisplayName(displayName);
      if (!nameValidation.valid) {
        const msg =
          nameValidation.error ||
          'El nombre debe tener entre 2 y 50 caracteres y puede incluir letras con acentos, números, espacios y símbolos comunes.';
        setError(msg);
        showToast(msg, 'error');
        return;
      }

      const hasExistingAvatar = !!profile?.avatar_url;
      if (!avatarFile && !hasExistingAvatar) {
        const msg = 'La foto de perfil es requerida. Sube una imagen para continuar.';
        setError(msg);
        showToast(msg, 'error');
        return;
      }

      setIsLoading(true);
      clearSafetyTimeout();
      submitTimeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        submitTimeoutRef.current = null;
        showToast('La conexión está tardando demasiado. Intenta de nuevo en un momento.', 'error');
      }, TIMEOUT_MS);

      try {
        let avatarUrl: string | undefined;

        if (avatarFile) {
          const img = await fileToImage(avatarFile);
          const { blob, mime } = await drawSquareCover(img, AVATAR_MAX_PX, true, 0.85);

          const extFromMime = mime === 'image/webp' ? 'webp' : 'jpg';
          const fileName = `avatars/${user.id}.${extFromMime}`;
          const optimized = blobToFile(blob, fileName, mime);

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(fileName, optimized, { upsert: true, contentType: mime });

          if (uploadError) throw new Error(`Error subiendo la imagen: ${uploadError.message}`);

          avatarUrl = supabase.storage.from('media').getPublicUrl(fileName).data.publicUrl;
        }

        const updates = mergeProfile(profile as any, {
          display_name: displayName,
          bio: bio || undefined,
          avatar_url: avatarUrl ?? profile?.avatar_url,
          rol_baile: (rolBaile as RolBaile) || undefined,
        } as any);

        await updateProfileFields(updates);

        showToast('Perfil guardado exitosamente ✅', 'success');
        navigate('/onboarding/ritmos');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        showToast('Error al guardar el perfil', 'error');
      } finally {
        clearSafetyTimeout();
        setIsLoading(false);
      }
    },
    [user, displayName, profile, avatarFile, bio, rolBaile, showToast, updateProfileFields, navigate]
  );

  if (authLoading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.25),transparent_50%),linear-gradient(135deg,#0f172a_0%,#374151_100%)] px-[clamp(1.5rem,4vw,4rem)] flex justify-center">
      <div className="w-full max-w-[1100px] grid [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] gap-[clamp(1.5rem,3vw,3rem)] items-stretch">
        <section className="bg-[linear-gradient(160deg,rgba(236,72,153,0.35),rgba(124,58,237,0.25))] rounded-2xl border border-white/20 p-[clamp(1.5rem,3vw,2.75rem)] backdrop-blur-[18px] text-white shadow-[0_25px_40px_rgba(0,0,0,0.35)] flex flex-col gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/45 text-[0.85rem] font-semibold text-emerald-200">
              <span>1 / 3</span>
              <span>Datos básicos</span>
            </div>
            <h1 className="text-[clamp(2rem,3vw,2.5rem)] font-extrabold my-2">¡Bienvenido a Dónde Bailar!</h1>
            <p className="text-gray-300 text-base leading-7">
              Esta primera parada es para asegurarnos de que la comunidad pueda reconocerte y conectar contigo. Completando
              estos datos, desbloqueas el resto del onboarding para descubrir ritmos, zonas y clases.
            </p>
          </div>

          <JourneyHighlights />
        </section>

        <section className="bg-[linear-gradient(165deg,rgba(15,23,42,0.85),rgba(30,41,59,0.9))] rounded-2xl p-[clamp(1.5rem,3vw,2.75rem)] shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/10 backdrop-blur-[14px]">
          <header className="mb-4 text-left">
            <h2 className="text-[clamp(1.5rem,2vw,2rem)] font-extrabold text-white mb-1">Cuéntanos sobre ti 📝</h2>
            <p className="text-gray-400 text-sm">Estos datos se muestran en tu perfil público y ayudarán a otros bailarines a reconocerte.</p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AvatarInput
              previewUrl={avatarPreview}
              existingUrl={profile?.avatar_url}
              disabled={isLoading || profileLoading}
              onChange={handleAvatarChange}
              showRequiredHint={!avatarPreview && !profile?.avatar_url}
            />

            <div>
              <label htmlFor="displayName" className="block mb-2 text-sm font-semibold text-gray-400">
                Nombre para mostrar *
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isLoading}
                className="w-full p-2 bg-white/10 border border-white/10 rounded-md text-gray-200 text-base placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-pink-400/50"
                placeholder="Ej: Juan el Salsero"
                autoComplete="off"
                inputMode="text"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block mb-2 text-sm font-semibold text-gray-400">
                Bio (opcional)
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isLoading}
                rows={4}
                className="w-full p-2 bg-white/10 border border-white/10 rounded-md text-gray-200 text-base placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-pink-400/50 resize-y"
                placeholder="Cuéntanos sobre tu pasión por el baile..."
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-400">¿Cómo te identificas? (opcional)</label>
              <div className="grid gap-3">
                {(Object.keys(roleBadges) as Array<Exclude<RolBaile, ''>>).map((rol) => (
                  <RoleOption key={rol} rol={rol} selected={rolBaile} onChange={setRolBaile} disabled={isLoading} />
                ))}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-2 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full disabled:opacity-70 bg-gradient-to-r from-pink-400 to-violet-400"
            >
              {isLoading ? 'Guardando...' : 'Continuar →'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
