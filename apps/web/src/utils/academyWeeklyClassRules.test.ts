import { describe, expect, it } from 'vitest';
import {
  academyCronogramaWeeklyViolation,
  academyWeeklyFormViolation,
  isCronogramaClassWeeklyItem,
  weeklyDayCountForCronogramaItem,
  weeklyDayCountFromFormInput,
} from '@/lib/academyWeeklyClassRules';

describe('academyWeeklyClassRules', () => {
  it('detects weekly items by fechaModo or recurrente', () => {
    expect(isCronogramaClassWeeklyItem({ tipo: 'clase', fechaModo: 'semanal' })).toBe(true);
    expect(isCronogramaClassWeeklyItem({ tipo: 'clase', recurrente: 'semanal' })).toBe(true);
    expect(isCronogramaClassWeeklyItem({ tipo: 'clase', fechaModo: 'especifica' })).toBe(false);
    expect(isCronogramaClassWeeklyItem({ tipo: 'evento', fechaModo: 'semanal' })).toBe(false);
  });

  it('counts days from diasSemana or diaSemana', () => {
    expect(weeklyDayCountForCronogramaItem({ diasSemana: ['lunes', 'martes'] })).toBe(2);
    expect(weeklyDayCountForCronogramaItem({ diaSemana: 3 })).toBe(1);
    expect(weeklyDayCountForCronogramaItem({ diasSemana: [] })).toBe(0);
  });

  it('form: basic blocks semanal regardless of days', () => {
    expect(academyWeeklyFormViolation('basic', 'semanal', 0)).toBe('basic_no_weekly');
    expect(academyWeeklyFormViolation('basic', 'semanal', 1)).toBe('basic_no_weekly');
    expect(academyWeeklyFormViolation('basic', 'especifica', 0)).toBe(null);
  });

  it('form: pro allows 1 day, blocks 2+', () => {
    expect(academyWeeklyFormViolation('pro', 'semanal', 1)).toBe(null);
    expect(academyWeeklyFormViolation('pro', 'semanal', 2)).toBe('pro_multi_day');
  });

  it('form: premium allows multiple days', () => {
    expect(academyWeeklyFormViolation('premium', 'semanal', 3)).toBe(null);
  });

  it('weeklyDayCountFromFormInput respects fechaModo', () => {
    expect(
      weeklyDayCountFromFormInput({ fechaModo: 'semanal', diasSemana: [1, 2], diaSemana: null })
    ).toBe(2);
    expect(weeklyDayCountFromFormInput({ fechaModo: 'especifica', diasSemana: [1, 2] })).toBe(0);
  });

  it('cronograma: basic rejects any weekly class', () => {
    const cr = [{ tipo: 'clase', fechaModo: 'semanal', diasSemana: ['lunes'] }];
    expect(academyCronogramaWeeklyViolation('basic', cr)).toBe('basic_no_weekly');
    expect(academyCronogramaWeeklyViolation('pro', cr)).toBe(null);
  });

  it('cronograma: pro rejects multi-day weekly', () => {
    const cr = [{ tipo: 'clase', fechaModo: 'semanal', diasSemana: ['lunes', 'martes'] }];
    expect(academyCronogramaWeeklyViolation('pro', cr)).toBe('pro_multi_day');
    expect(academyCronogramaWeeklyViolation('premium', cr)).toBe(null);
  });
});
