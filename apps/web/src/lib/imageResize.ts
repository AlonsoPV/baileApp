/**
 * Redimensiona una imagen si su ancho excede el máximo especificado.
 * Mantiene la proporción original (height auto).
 * 
 * @param file - Archivo de imagen a redimensionar
 * @param maxWidth - Ancho máximo en píxeles (default: 800)
 * @param quality - Calidad de compresión (0-1, default: 0.9)
 * @returns Promise<File> - Archivo redimensionado o el original si no necesita redimensionarse
 */
export async function resizeImageIfNeeded(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.9
): Promise<File> {
  // Solo procesar imágenes
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Formatos soportados para redimensionamiento
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.type.toLowerCase())) {
    console.log('[ImageResize] Formato no soportado para redimensionamiento:', file.type);
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();

    // Timeout de seguridad para evitar que la promesa quede colgada
    const timeoutId = window.setTimeout(() => {
      console.warn('[ImageResize] Timeout al procesar imagen, devolviendo archivo original');
      resolve(file);
    }, 30000); // 30 segundos máximo

    let objectUrl: string | null = null;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        objectUrl = null;
      }
    };

    const process = () => {
      cleanup();

      // Validar dimensiones antes de procesar
      if (!img.width || !img.height || img.width <= 0 || img.height <= 0) {
        console.warn('[ImageResize] Dimensiones inválidas, devolviendo archivo original');
        resolve(file);
        return;
      }

      // Si la imagen es menor o igual al máximo, devolver original
      if (img.width <= maxWidth) {
        console.log(`[ImageResize] Imagen no necesita redimensionamiento (${img.width}px <= ${maxWidth}px)`);
        resolve(file);
        return;
      }

      // Calcular nuevo tamaño manteniendo proporción
      const ratio = maxWidth / img.width;
      const newWidth = maxWidth;
      const newHeight = Math.round(img.height * ratio);

      console.log(`[ImageResize] Redimensionando de ${img.width}x${img.height} a ${newWidth}x${newHeight}`);

      // Crear canvas y redimensionar
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.warn('[ImageResize] No se pudo obtener contexto del canvas, devolviendo archivo original');
        resolve(file);
        return;
      }

      // Configurar calidad de renderizado
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convertir a Blob y luego a File
      // Usar el tipo original del archivo, pero convertir PNG a JPEG si es necesario para mejor compresión
      const outputType = file.type.toLowerCase() === 'image/png' ? 'image/jpeg' : file.type;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn('[ImageResize] No se pudo crear blob, devolviendo archivo original');
            resolve(file);
            return;
          }

          // Mantener el nombre original pero cambiar extensión si cambió el tipo
          const originalName = file.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const newExt = outputType === 'image/jpeg' ? 'jpg' : (outputType.split('/')[1] || 'jpg');
          const newFileName = `${nameWithoutExt}.${newExt}`;

          const resizedFile = new File([blob], newFileName, {
            type: outputType,
            lastModified: Date.now(),
          });

          console.log(`[ImageResize] Imagen redimensionada: ${file.size} bytes -> ${resizedFile.size} bytes`);
          resolve(resizedFile);
        },
        outputType,
        quality
      );
    };

    img.onload = process;
    img.onerror = (error) => {
      cleanup();
      console.warn('[ImageResize] Error al cargar imagen, devolviendo archivo original:', error);
      resolve(file);
    };

    // Usar ObjectURL es mucho más rápido que FileReader + base64 para imágenes grandes.
    try {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } catch (e) {
      console.warn('[ImageResize] No se pudo crear ObjectURL, fallback a FileReader:', e);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          try {
            img.src = ev.target.result;
          } catch (srcError) {
            cleanup();
            console.warn('[ImageResize] Error al establecer src de imagen, devolviendo archivo original:', srcError);
            resolve(file);
          }
        } else {
          cleanup();
          console.warn('[ImageResize] No se pudo obtener resultado del FileReader, devolviendo archivo original');
          resolve(file);
        }
      };
      reader.onerror = () => {
        cleanup();
        console.warn('[ImageResize] Error al leer archivo, devolviendo archivo original');
        resolve(file);
      };
      reader.readAsDataURL(file);
    }
  });
}

