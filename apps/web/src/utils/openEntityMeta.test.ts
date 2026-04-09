import { describe, expect, it } from "vitest";
import {
  buildOpenClasePresentation,
  buildOpenEventoPresentation,
  buildOpenProfilePresentation,
} from "./openEntityMeta";

describe("openEntityMeta", () => {
  it("prioritizes event title and includes place in seo description", () => {
    const result = buildOpenEventoPresentation(
      {
        nombre: "Social de Salsa",
        fecha: "2026-04-11",
        hora_inicio: "21:00",
        hora_fin: "23:30",
        lugar: "Salon Caribe",
        ciudad: "CDMX",
      },
      { nombre: "Evento padre" },
    );

    expect(result.title).toBe("Social de Salsa");
    expect(result.place).toBe("Salon Caribe · CDMX");
    expect(result.seoDescription).toContain("Salon Caribe · CDMX");
  });

  it("uses the indexed class entry when available", () => {
    const result = buildOpenClasePresentation({
      nombre_publico: "Academia Central",
      cronograma: [
        { nombre: "Bachata Base", dia_semana: 1, hora: "19:00" },
        { nombre: "Salsa Intermedia", dia_semana: 3, hora: "20:00" },
      ],
      ubicaciones: [{ nombre: "Roma Norte" }],
    }, 1);

    expect(result.title).toBe("Salsa Intermedia");
    expect(result.place).toBe("Roma Norte");
    expect(result.seoDescription).toContain("Roma Norte");
  });

  it("builds profile seo copy from public display fields", () => {
    const result = buildOpenProfilePresentation("maestro", {
      nombre_publico: "Ana Ruiz",
    });

    expect(result.title).toBe("Ana Ruiz");
    expect(result.seoDescription).toContain("Ana Ruiz");
    expect(result.seoDescription).toContain("Maestro");
  });
});
