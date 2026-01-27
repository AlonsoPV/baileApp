import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import i18n from '../i18n';
import { useAuth } from '@/contexts/AuthProvider';
import { userLocalStorage } from '@/storage/userScopedStorage';

export type Language = 'es' | 'en';

const STORAGE_PARTS = ['language', 'v1'] as const;

export function useLanguage() {
  const { i18n: i18nInstance, ready } = useTranslation();
  const { user } = useAuth();
  const uid = user?.id;
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Obtener idioma inicial desde i18n (user-scoped storage is applied after auth resolves)
    const i18nLang = (i18nInstance.language?.split('-')[0] || 'es') as Language;
    return i18nLang;
  });

  // Rehidratar preferencia por usuario cuando cambia uid
  useEffect(() => {
    if (!uid) return;
    try {
      const stored = userLocalStorage.getItem([...STORAGE_PARTS], uid) as Language | null;
      const next = stored === 'en' || stored === 'es' ? stored : null;
      if (next && next !== (i18nInstance.language?.split('-')[0] as any)) {
        i18n.changeLanguage(next).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [uid, i18nInstance.language]);

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
      
      // Guardar SOLO si hay usuario (regla: keys de preferencias deben ser user-scoped)
      if (uid) {
        try {
          userLocalStorage.setItem([...STORAGE_PARTS], lang, uid);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('[useLanguage] Error al guardar idioma user-scoped:', error);
          }
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
    [currentLanguage, uid]
  );

  return {
    language: currentLanguage,
    setLanguage,
    isReady: ready,
  };
}

