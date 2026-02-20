# RSVP Validation Plan & QA Notes

## Implementation Summary

- **RSVP types:** `going` (Asistiré) and `interested` (Me interesa)
- **Data model:** `event_rsvp` with `event_date_id`, `event_parent_id`, `status`, unique `(user_id, event_date_id)`
- **Expiration:** `event_end_ts = fecha + hora_fin | hora_inicio | 23:59:59` (America/Mexico_City)
- **Cleanup:** `cleanup_expired_rsvps()` SQL function; pg_cron (if enabled) + on-read trigger when opening MyRSVPsScreen

---

## Quick Manual QA Checklist

### 1) Create RSVP

- [ ] Open an upcoming event (`/social/fecha/:dateId`)
- [ ] Tap "Me interesa" → DB row created with `status='interesado'`
- [ ] Confirm "Eventos de interés" shows it (profile)
- [ ] Confirm UserProfileEditor → Mis RSVPs → event appears
- [ ] Tap "Asistiré" on same event → same row updated to `status='going'`
- [ ] Confirm no duplicate rows (UNIQUE constraint)

### 2) Change RSVP type

- [ ] From "Me interesa" tap "Asistiré" → status becomes `going`
- [ ] From "Asistiré" tap "Me interesa" → status becomes `interesado`
- [ ] UI updates in Event detail, MyRSVPs, Eventos de interés

### 3) Remove RSVP

- [ ] Toggle off (tap active button again) → row deleted
- [ ] Remove from MyRSVPs "Ya no me interesa" → row deleted
- [ ] Confirm event disappears from all sections

### 4) Expiration behavior

- [ ] Use a test event_date with past `fecha` + `hora_fin`
- [ ] Ensure it does NOT show in "Eventos de interés" (client filter)
- [ ] Open MyRSVPs → triggers `cleanup_expired_rsvps()` → expired rows deleted
- [ ] Confirm no stale RSVPs after cleanup

### 5) Edge cases

- [ ] Event without `hora_fin`: uses `hora_inicio`; if both null, uses 23:59:59
- [ ] Recurring event: RSVP to one date only; other dates unaffected
- [ ] Offline / slow: optimistic update; rollback on error
- [ ] Multi-device: RSVP on device A appears on device B after refresh

---

## Test Commands

```bash
# Unit tests
cd apps/web && pnpm test:run src/utils/eventDateExpiration.test.ts
```

---

## DB Verification

```sql
-- Check RSVP counts
SELECT event_date_id, status, COUNT(*) 
FROM event_rsvp 
GROUP BY event_date_id, status;

-- Run cleanup manually
SELECT cleanup_expired_rsvps();
```

---

## Screenshots / Log Statements

- Event detail: `[useEventRSVP] handleRSVP called with: { eventDateId, status }`
- MyRSVPs: `[MyRSVPsScreen] cleanup_expired_rsvps` (on mount)
- Check DevTools Network for `upsert_event_rsvp` and `delete_event_rsvp` RPC calls
