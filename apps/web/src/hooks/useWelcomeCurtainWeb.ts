import { useState } from 'react';

/**
 * Stub: cortina de bienvenida web deshabilitada.
 * Mantiene el módulo para evitar errores de import; la cortina no se muestra.
 */
export function useWelcomeCurtainWeb() {
  const [shouldShow] = useState(false);
  const isReady = true;
  const markAsSeen = () => {};
  return { shouldShow, isReady, markAsSeen };
}
