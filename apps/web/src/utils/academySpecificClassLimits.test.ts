import { describe, expect, it } from 'vitest';
import { getPlan } from '@/lib/subscription';
import { specificDateClassLimitForPlan, canCreateUnlimitedSpecificDateClasses } from '@/lib/planCapabilities';
import {
  academyCronogramaExceedsBasicSpecificDateLimit,
  countSpecificDateClassesInCronograma,
  isCronogramaClassSpecificDateItem,
  wouldExceedSpecificDateLimit,
} from '@/lib/academySpecificClassLimits';

const especificaItem = (id: number) => ({
  id,
  tipo: 'clase',
  fechaModo: 'especifica',
  fecha: '2026-04-01',
});

const semanalItem = (id: number) => ({
  id,
  tipo: 'clase',
  fechaModo: 'semanal',
  diasSemana: ['lunes'],
});

describe('academy specific-date class limits', () => {
  it('basic limit is 5 from capabilities', () => {
    expect(specificDateClassLimitForPlan('basic')).toBe(5);
    expect(canCreateUnlimitedSpecificDateClasses('basic')).toBe(false);
    expect(specificDateClassLimitForPlan('pro')).toBeNull();
    expect(canCreateUnlimitedSpecificDateClasses('premium')).toBe(true);
  });

  it('counts only tipo clase + fechaModo especifica', () => {
    const cr = [especificaItem(1), semanalItem(2), especificaItem(3)];
    expect(countSpecificDateClassesInCronograma(cr)).toBe(2);
    expect(isCronogramaClassSpecificDateItem({ tipo: 'clase', fechaModo: 'por_agendar' })).toBe(false);
  });

  it('legacy: fecha sin fechaModo cuenta como específica si no es semanal recurrente', () => {
    expect(
      isCronogramaClassSpecificDateItem({
        tipo: 'clase',
        fecha: '2026-05-01',
      })
    ).toBe(true);
    expect(
      isCronogramaClassSpecificDateItem({
        tipo: 'clase',
        fecha: '2026-05-01',
        recurrente: 'semanal',
      })
    ).toBe(false);
  });

  it('basic: 4 específicas puede añadir la quinta', () => {
    const cr = [1, 2, 3, 4].map((i) => especificaItem(i));
    expect(
      wouldExceedSpecificDateLimit({
        plan: getPlan('basic'),
        cronograma: cr,
        nextItemFechaModo: 'especifica',
      })
    ).toBe(false);
  });

  it('basic: 5 específicas no puede añadir otra', () => {
    const cr = [1, 2, 3, 4, 5].map((i) => especificaItem(i));
    expect(
      wouldExceedSpecificDateLimit({
        plan: getPlan('basic'),
        cronograma: cr,
        nextItemFechaModo: 'especifica',
      })
    ).toBe(true);
    expect(academyCronogramaExceedsBasicSpecificDateLimit(getPlan('basic'), cr)).toBe(false);
  });

  it('basic: 6 específicas en cronograma viola límite', () => {
    const cr = [1, 2, 3, 4, 5, 6].map((i) => especificaItem(i));
    expect(academyCronogramaExceedsBasicSpecificDateLimit(getPlan('basic'), cr)).toBe(true);
  });

  it('basic: 5 específicas puede añadir semanal', () => {
    const cr = [1, 2, 3, 4, 5].map((i) => especificaItem(i));
    expect(
      wouldExceedSpecificDateLimit({
        plan: getPlan('basic'),
        cronograma: cr,
        nextItemFechaModo: 'semanal',
      })
    ).toBe(false);
  });

  it('pro: más de 5 específicas puede añadir otra', () => {
    const cr = [1, 2, 3, 4, 5, 6].map((i) => especificaItem(i));
    expect(
      wouldExceedSpecificDateLimit({
        plan: getPlan('pro'),
        cronograma: cr,
        nextItemFechaModo: 'especifica',
      })
    ).toBe(false);
    expect(academyCronogramaExceedsBasicSpecificDateLimit(getPlan('pro'), cr)).toBe(false);
  });

  it('plan inválido / ausente se trata como basic en getPlan', () => {
    const cr = [1, 2, 3, 4, 5].map((i) => especificaItem(i));
    expect(
      wouldExceedSpecificDateLimit({
        plan: getPlan(null),
        cronograma: cr,
        nextItemFechaModo: 'especifica',
      })
    ).toBe(true);
  });

  it('edición: pasar de semanal a específica con 5 ya cuenta el incremento', () => {
    const cr = [1, 2, 3, 4].map((i) => especificaItem(i)).concat([semanalItem(99)]);
    expect(
      wouldExceedSpecificDateLimit({
        plan: getPlan('basic'),
        cronograma: cr,
        nextItemFechaModo: 'especifica',
        editingClassId: 99,
      })
    ).toBe(false);
    const crFull = [1, 2, 3, 4, 5].map((i) => especificaItem(i)).concat([semanalItem(99)]);
    expect(
      wouldExceedSpecificDateLimit({
        plan: getPlan('basic'),
        cronograma: crFull,
        nextItemFechaModo: 'especifica',
        editingClassId: 99,
      })
    ).toBe(true);
  });
});
