import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';

i18n
  // Detecta el idioma del navegador
  .use(LanguageDetector)
  // Pasa la instancia de i18n a react-i18next
  .use(initReactI18next)
  // Inicializa i18next
  .init({
    // Idioma por defecto: español
    fallbackLng: 'es',
    // Namespace por defecto
    defaultNS: 'common',
    // Namespaces disponibles
    ns: ['common'],
    
    // Recursos de traducción
    resources: {
      es: {
        common: esCommon,
      },
      en: {
        common: enCommon,
      },
    },

    // Configuración del detector de idioma
    detection: {
      // Orden de detección:
      // 1. localStorage con clave 'db_language' (prioridad)
      // 2. navigator.language (solo si no hay en localStorage)
      // 3. fallback a 'es'
      lookupLocalStorage: 'db_language',
      caches: ['localStorage'],
      order: ['localStorage', 'navigator'],
      // No detectar automáticamente después de la inicialización
      // Solo usar el valor guardado o el navegador en la primera carga
      checkWhitelist: false,
    },

    // React ya escapa los valores, no necesitamos escapeValue
    interpolation: {
      escapeValue: false,
    },

    // Configuración de react-i18next
    react: {
      useSuspense: false, // No usar Suspense para evitar problemas de renderizado
    },

    // Debug solo en desarrollo
    debug: import.meta.env.DEV,
  });

export default i18n;

