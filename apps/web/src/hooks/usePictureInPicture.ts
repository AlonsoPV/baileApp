import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePictureInPictureReturn {
  isSupported: boolean;
  isPictureInPicture: boolean;
  togglePictureInPicture: () => Promise<void>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

/**
 * Hook para manejar Picture-in-Picture (PiP) en videos HTML5
 * 
 * @returns {UsePictureInPictureReturn} Objeto con estado y funciones para controlar PiP
 */
export function usePictureInPicture(): UsePictureInPictureReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);

  // Verificar soporte de PiP
  useEffect(() => {
    const checkSupport = () => {
      const video = videoRef.current;
      if (!video) return;

      // Verificar si la API está disponible
      const hasPiPSupport = 
        document.pictureInPictureEnabled !== undefined &&
        video.requestPictureInPicture !== undefined;

      setIsSupported(hasPiPSupport);
    };

    checkSupport();

    // Re-verificar cuando el video esté listo
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', checkSupport);
      return () => {
        video.removeEventListener('loadedmetadata', checkSupport);
      };
    }
  }, []);

  // Manejar eventos de entrada/salida de PiP
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isSupported) return;

    const handleEnterPictureInPicture = () => {
      setIsPictureInPicture(true);
    };

    const handleLeavePictureInPicture = () => {
      setIsPictureInPicture(false);
    };

    video.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
    video.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
      video.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
    };
  }, [isSupported]);

  // Función para activar/desactivar PiP
  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isSupported) return;

    try {
      if (document.pictureInPictureElement) {
        // Si ya hay un video en PiP, salir
        await document.exitPictureInPicture();
      } else {
        // Entrar en modo PiP
        await video.requestPictureInPicture();
      }
    } catch (error) {
      // El usuario canceló o hubo un error
      console.warn('Error al activar Picture-in-Picture:', error);
    }
  }, [isSupported]);

  return {
    isSupported,
    isPictureInPicture,
    togglePictureInPicture,
    videoRef,
  };
}

