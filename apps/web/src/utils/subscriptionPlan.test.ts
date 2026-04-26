import { describe, expect, it } from 'vitest';
import { getPlan } from '@/lib/subscription';
import {
  capabilitiesForPlan,
  hasCapability,
  profileHasCapability,
  showsSubscriberVerifiedBadge,
  subscribableProfileFromRow,
} from '@/lib/planCapabilities';

describe('subscription plan + capabilities (rol ≠ plan; badge solo por plan)', () => {
  it('academy + basic → no verifiedBadge capability', () => {
    const plan = getPlan('basic');
    expect(hasCapability(plan, 'verifiedBadge')).toBe(false);
    expect(showsSubscriberVerifiedBadge('basic')).toBe(false);
  });

  it('academy + pro → verifiedBadge', () => {
    const plan = getPlan('pro');
    expect(hasCapability(plan, 'verifiedBadge')).toBe(true);
    expect(showsSubscriberVerifiedBadge('pro')).toBe(true);
  });

  it('academy + premium → verifiedBadge', () => {
    const plan = getPlan('premium');
    expect(hasCapability(plan, 'verifiedBadge')).toBe(true);
    expect(showsSubscriberVerifiedBadge('premium')).toBe(true);
  });

  it('academy sin plan (undefined) → tratado como basic', () => {
    expect(getPlan(undefined)).toBe('basic');
    expect(getPlan(null)).toBe('basic');
    expect(profileHasCapability({}, 'verifiedBadge')).toBe(false);
    expect(profileHasCapability({ subscription_plan: null }, 'verifiedBadge')).toBe(false);
    expect(showsSubscriberVerifiedBadge(undefined)).toBe(false);
    expect(showsSubscriberVerifiedBadge(null)).toBe(false);
  });

  it('capabilitiesForPlan expone mapa sin duplicar literales', () => {
    expect(capabilitiesForPlan('basic').featuredVisibility).toBe(false);
    expect(capabilitiesForPlan('pro').verifiedBadge).toBe(true);
  });

  it('subscribableProfileFromRow separa rol y plan normalizado', () => {
    const p = subscribableProfileFromRow('teacher', { subscription_plan: 'pro' });
    expect(p.role).toBe('teacher');
    expect(p.subscription_plan).toBe('pro');
  });

  it('métricas de clases: basic no, pro y premium sí', () => {
    expect(hasCapability(getPlan('basic'), 'canViewClassMetrics')).toBe(false);
    expect(hasCapability(getPlan('pro'), 'canViewClassMetrics')).toBe(true);
    expect(hasCapability(getPlan('premium'), 'canViewClassMetrics')).toBe(true);
  });

  it('métricas de alumnos: solo premium', () => {
    expect(hasCapability(getPlan('basic'), 'canViewStudentMetrics')).toBe(false);
    expect(hasCapability(getPlan('pro'), 'canViewStudentMetrics')).toBe(false);
    expect(hasCapability(getPlan('premium'), 'canViewStudentMetrics')).toBe(true);
  });

  it('asistió/pago en métricas de academia: solo premium', () => {
    expect(hasCapability(getPlan('basic'), 'canEditAcademyMetricsAttendanceAndPayment')).toBe(false);
    expect(hasCapability(getPlan('pro'), 'canEditAcademyMetricsAttendanceAndPayment')).toBe(false);
    expect(hasCapability(getPlan('premium'), 'canEditAcademyMetricsAttendanceAndPayment')).toBe(true);
  });

  it('perfil público en app: solo premium', () => {
    expect(hasCapability(getPlan('basic'), 'canHavePublicProfile')).toBe(false);
    expect(hasCapability(getPlan('pro'), 'canHavePublicProfile')).toBe(false);
    expect(hasCapability(getPlan('premium'), 'canHavePublicProfile')).toBe(true);
  });
});
