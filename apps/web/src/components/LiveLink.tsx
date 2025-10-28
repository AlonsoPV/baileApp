/**
 * Link reutilizable para vistas LIVE (públicas)
 * Aplica estilos consistentes para todas las cards y enlaces a contenido público
 */

import React from "react";
import { Link, LinkProps } from "react-router-dom";

interface LiveLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
  /** Si true, usa estilos de card/tarjeta */
  asCard?: boolean;
}

/**
 * Link optimizado para contenido LIVE (público)
 * Incluye hover effects, transiciones y estilos consistentes
 */
export default function LiveLink({ 
  to, 
  className, 
  title, 
  children,
  asCard = true,
  ...props 
}: LiveLinkProps) {
  const baseCardStyles = asCard
    ? "block group rounded-2xl border border-white/10 bg-neutral-900/60 p-4 hover:bg-neutral-800 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-pink-500/10"
    : "";

  const finalClassName = className ?? baseCardStyles;

  return (
    <Link
      to={to}
      className={finalClassName}
      title={title}
      style={{ textDecoration: 'none', color: 'inherit' }}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * Link inline (sin estilos de card)
 * Útil para enlaces dentro de texto o navegación
 */
export function LiveLinkInline({ 
  to, 
  className, 
  children, 
  ...props 
}: Omit<LiveLinkProps, 'asCard'>) {
  return (
    <Link
      to={to}
      className={className ?? "text-pink-500 hover:text-pink-400 transition-colors"}
      style={{ textDecoration: 'underline' }}
      {...props}
    >
      {children}
    </Link>
  );
}

