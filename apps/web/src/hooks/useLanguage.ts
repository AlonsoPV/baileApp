import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import i18n from '../i18n';

export type Language = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = 'db_language';

export function useLanguage() {
  const { i18n: i18nInstance, ready } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Obtener idioma inicial desde i18n o localStorage
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    const i18nLang = (i18nInstance.language?.split('-')[0] || 'es') as Language;
    return stored || i18nLang;
  });

  // Sincronizar con cambios en i18n
  useEffect(() => {
    const updateLanguage = (lng?: string) => {
      const lang = (lng?.split('-')[0] || i18nInstance.language?.split('-')[0] || 'es') as Language;
      if (import.meta.env.DEV) {
        console.log('[useLanguage] Idioma actualizado a:', lang);
      }
      setCurrentLanguage(lang);
    };

    // Actualizar inmediatamente
    updateLanguage(i18nInstance.language);
    
    // Escuchar cambios
    i18nInstance.on('languageChanged', updateLanguage);

    return () => {
      i18nInstance.off('languageChanged', updateLanguage);
    };
  }, [i18nInstance]);

  const setLanguage = useCallback(
    (lang: Language) => {
      if (import.meta.env.DEV) {
        console.log('[useLanguage] Cambiando idioma a:', lang, 'desde:', currentLanguage);
      }
      
      // Actualizar estado local inmediatamente para feedback visual
      setCurrentLanguage(lang);
      
      // Guardar en localStorage
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[useLanguage] Error al guardar idioma en localStorage:', error);
        }
      }
      
      // Cambiar el idioma en i18next
      i18n.changeLanguage(lang).then(() => {
        if (import.meta.env.DEV) {
          console.log('[useLanguage] Idioma cambiado exitosamente a:', lang);
        }
        // Forzar actualización del estado por si acaso
        setCurrentLanguage(lang);
      }).catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[useLanguage] Error al cambiar idioma:', error);
        }
        // Revertir en caso de error
        setCurrentLanguage(currentLanguage);
      });
    },
    [currentLanguage]
  );

  return {
    language: currentLanguage,
    setLanguage,
    isReady: ready,
  };
}

