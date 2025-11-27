/**
 * Optimiza URLs de Supabase Storage usando el endpoint de renderizado de imágenes
 * Convierte URLs de storage a URLs optimizadas con redimensionamiento y compresión
 */

const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

/**
 * Obtiene la URL base de Supabase desde las variables de entorno
 * Si no está disponible, intenta extraerla de una URL existente
 */
function getSupabaseUrl(): string {
  try {
    // Intentar obtener desde las variables de entorno primero
    if (import.meta.env.VITE_SUPABASE_URL) {
      return import.meta.env.VITE_SUPABASE_URL;
    }
    
    // Si estamos en el navegador, intentar extraer de la URL actual
    if (typeof window !== "undefined") {
      // Si la URL actual contiene el path de storage, extraer el origen
      const currentUrl = window.location.href;
      const match = currentUrl.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        return match[1];
      }
    }
  } catch (error) {
    console.warn('[getSupabaseUrl] Error obteniendo URL de Supabase:', error);
  }
  return "";
}

/**
 * Optimiza una URL de Supabase Storage usando el endpoint de renderizado
 * Solo optimiza URLs de Supabase Storage, deja otras URLs sin cambios
 * 
 * @param url - URL a optimizar (puede ser una URL completa o una ruta relativa)
 * @param width - Ancho deseado (default: 600)
 * @param height - Alto deseado (default: 400)
 * @param quality - Calidad de compresión (default: 80)
 * @returns URL optimizada o la URL original si no es de Supabase Storage
 */
export function optimizeSupabaseImageUrl(
  url?: string | null,
  width: number = 600,
  height: number = 400,
  quality: number = 80
): string | undefined {
  if (!url) return undefined;
  
  const urlString = String(url).trim();
  
  // Si ya es una URL completa de renderizado, no hacer nada
  if (urlString.includes(SUPABASE_RENDER_PATH)) {
    return urlString;
  }
  
  // Si no es una URL HTTP/HTTPS y no empieza con /, puede ser una ruta relativa
  // Intentar construir la URL completa
  let fullUrl: string;
  
  try {
    // Si ya es una URL completa
    if (/^https?:\/\//i.test(urlString)) {
      fullUrl = urlString;
    } else if (urlString.startsWith('/')) {
      // Si es una ruta absoluta, construir con el origen actual
      fullUrl = typeof window !== "undefined" 
        ? `${window.location.origin}${urlString}`
        : `${getSupabaseUrl()}${urlString}`;
    } else {
      // Si es una ruta relativa tipo "bucket/path", convertir a URL pública primero
      // Esto requiere acceso a supabase, pero para optimización podemos intentar construirla
      const supabaseBase = getSupabaseUrl();
      if (supabaseBase) {
        // Asumir que es una ruta de storage y construir la URL pública
        fullUrl = `${supabaseBase}${SUPABASE_PUBLIC_PATH}${urlString}`;
      } else {
        // Si no podemos construir la URL, retornar original
        return urlString;
      }
    }
    
    // Verificar si es una URL de Supabase Storage
    const urlObj = new URL(fullUrl);
    if (!urlObj.pathname.includes(SUPABASE_PUBLIC_PATH)) {
      // No es una URL de Supabase Storage, retornar original
      return urlString;
    }
    
    // Extraer la ruta del archivo (bucket/path)
    const publicKey = urlObj.pathname.split(SUPABASE_PUBLIC_PATH)[1];
    if (!publicKey) {
      return urlString;
    }
    
    // Construir la URL de renderizado optimizada
    const renderUrl = `${urlObj.origin}${SUPABASE_RENDER_PATH}${publicKey}`;
    const params = new URLSearchParams();
    params.set("width", String(width));
    params.set("height", String(height));
    params.set("resize", "contain");
    params.set("quality", String(quality));
    
    return `${renderUrl}?${params.toString()}`;
  } catch (error) {
    // Si hay algún error al procesar la URL, retornar la original
    console.warn('[optimizeSupabaseImageUrl] Error procesando URL:', urlString, error);
    return urlString;
  }
}

/**
 * Normaliza una URL (compatibilidad con funciones normalizeUrl existentes)
 * y opcionalmente la optimiza si es de Supabase Storage
 * 
 * @param url - URL a normalizar
 * @param optimize - Si true, optimiza URLs de Supabase Storage (default: true)
 * @returns URL normalizada y/o optimizada
 */
export function normalizeAndOptimizeUrl(
  url?: string | null,
  optimize: boolean = true
): string | undefined {
  if (!url) return undefined;
  
  const urlString = String(url).trim();
  
  // Si ya es una URL HTTP/HTTPS o ruta absoluta, normalizarla
  if (/^https?:\/\//i.test(urlString) || urlString.startsWith('/')) {
    return optimize && optimizeSupabaseImageUrl(urlString) || urlString;
  }
  
  // Placeholder patterns
  if (/^\d+x\d+(\/.*)?$/i.test(urlString)) {
    return `https://via.placeholder.com/${urlString}`;
  }
  if (/^[0-9A-Fa-f]{6}(\/|\?).*/.test(urlString)) {
    return `https://via.placeholder.com/800x400/${urlString}`;
  }
  
  // Si es una ruta relativa y queremos optimizar, intentar optimizarla
  if (optimize) {
    const optimized = optimizeSupabaseImageUrl(urlString);
    if (optimized && optimized !== urlString) {
      return optimized;
    }
  }
  
  return urlString;
}

