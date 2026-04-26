import { describe, expect, it } from 'vitest';
import {
  academyUbicacionesExceedsPlanLimit,
  countUbicaciones,
} from '@/lib/academyLocationLimits';

describe('academyLocationLimits', () => {
  it('counts array length', () => {
    expect(countUbicaciones([])).toBe(0);
    expect(countUbicaciones([{ id: '1' }])).toBe(1);
    expect(countUbicaciones(null)).toBe(0);
  });

  it('basic: at most 1', () => {
    expect(academyUbicacionesExceedsPlanLimit('basic', [])).toBe(false);
    expect(academyUbicacionesExceedsPlanLimit('basic', [{}])).toBe(false);
    expect(academyUbicacionesExceedsPlanLimit('basic', [{}, {}])).toBe(true);
  });

  it('pro/premium: unlimited', () => {
    expect(academyUbicacionesExceedsPlanLimit('pro', [{}, {}, {}])).toBe(false);
    expect(academyUbicacionesExceedsPlanLimit('premium', [{}, {}, {}])).toBe(false);
  });
});
