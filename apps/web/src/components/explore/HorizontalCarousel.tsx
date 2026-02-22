import React from "react";
import HorizontalSlider from "./HorizontalSlider";

type Props<T = any> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Alto fijo de cada item en mobile (hero cards). */
  itemHeight?: number;
  /** Ancho fijo de cada item en mobile (hero cards). */
  itemWidth?: number;
  /** Sobrescribe grid-auto-columns cuando no se usa itemWidth. */
  autoColumns?: string | number | null;
  /** Si true, en escritorio deshabilita scroll por wheel/drag (solo flechas). */
  disableDesktopScroll?: boolean;
  /** Mostrar botones de navegación en escritorio. */
  showNavButtons?: boolean;
  /** 0..1 del ancho visible a desplazar por click */
  scrollStep?: number;
};

/** Wrapper estandarizado para todos los carousels horizontales (Explore). */
export default function HorizontalCarousel<T>({
  items,
  renderItem,
  gap = 16,
  className,
  style,
  itemHeight,
  itemWidth,
  autoColumns,
  disableDesktopScroll = true,
  showNavButtons = true,
  scrollStep = 0.85,
}: Props<T>) {
  return (
    <HorizontalSlider
      items={items}
      renderItem={renderItem}
      gap={gap}
      className={className}
      style={style}
      itemHeight={itemHeight}
      itemWidth={itemWidth}
      autoColumns={autoColumns}
      disableDesktopScroll={disableDesktopScroll}
      showNavButtons={showNavButtons}
      scrollStep={scrollStep}
    />
  );
}

