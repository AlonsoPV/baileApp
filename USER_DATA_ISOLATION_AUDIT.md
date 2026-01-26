# User Data Isolation Audit (iOS/WebView + Web SPA + RN)

Goal: **guarantee total per-user isolation** for anything persisted or cached on-device.

This document is the **Step 1 inventory**: where we read/write storage, what keys exist today, and whether they are user-scoped.

---

## Web (apps/web) — Storage Keys & Usage

### 1) Explore filters (NOT user-scoped today → cross-user risk)
- **Key**: `ba_explore_filters_v1`
- **Stores**: explore filters \(type, q, ritmos, zonas, date range, pageSize\)
- **User-scoped?**: ❌ No
- **Used in**: `apps/web/src/state/exploreFilters.ts`

### 2) Profile mode (NOT user-scoped today → cross-user risk)
- **Key**: `ba_profile_mode`
- **Stores**: UI role mode `"usuario" | "organizador" | "maestro" | "academia" | "marca"`
- **User-scoped?**: ❌ No
- **Used in**: `apps/web/src/state/profileMode.ts`

### 3) Default profile selection (user-scoped ✅)
- **Key pattern**: `default_profile_${userId}`
- **Stores**: default profile type \(user/organizer/academy/teacher/brand\)
- **User-scoped?**: ✅ Yes (by userId)
- **Used in**: `apps/web/src/hooks/useDefaultProfile.ts`

### 4) Drafts persisted store (store key NOT user-scoped; per-entry keys may be user-scoped)
- **Persisted store name**: `baileapp:drafts:v1`
- **Stores**: a single persisted blob containing a `drafts` map
- **User-scoped?**: ⚠️ Mixed
  - Store itself: ❌ No (shared across users)
  - Draft entry keys: often ✅ (see `draft:{role}:profile:{userId}:{role}`)
- **Used in**: `apps/web/src/state/drafts.ts`, `apps/web/src/utils/draftKeys.ts`

### 5) Draft key generator (partially user-scoped; uses localStorage directly)
- **Key pattern**: `draft:${role}:profile:${userIdOrAnon}:${role}`
- **Stores**: role-specific profile draft
- **User-scoped?**: ✅ Yes for authenticated users; ⚠️ `anon` bucket exists
- **Used in**: `apps/web/src/utils/draftKeys.ts`

### 6) Language preference (NOT user-scoped today → cross-user risk per spec)
- **Key**: `db_language`
- **Stores**: language code `es|en`
- **User-scoped?**: ❌ No
- **Used in**:
  - `apps/web/src/hooks/useLanguage.ts`
  - `apps/web/src/i18n/index.ts` (language detector reads `db_language` from localStorage)

### 7) Welcome curtain (app-level; not user data)
- **Keys**:
  - `@baileapp:hasSeenWelcomeCurtain` (localStorage)
  - `@baileapp:appTerminated` (sessionStorage)
- **Stores**: first-run UI flags
- **User-scoped?**: ✅ Not user data (OK as app-level/session-level)
- **Used in**: `apps/web/src/hooks/useWelcomeCurtainWeb.ts`

### 8) PIN verify session flags (stored as a per-user map inside generic keys)
- **Keys (sessionStorage)**:
  - `ba_pin_verified_v1`
  - `ba_pin_needs_verify_v1`
- **Stores**: JSON map of `{ [userId]: timestamp }`
- **User-scoped?**: ⚠️ Stored in generic keys but keyed by userId inside blob
- **Used in**: `apps/web/src/lib/pin.ts`

### 9) Supabase auth session (session store)
- **Key pattern**: `sb-${projectRef}-auth-token` (computed from Supabase URL)
- **Stores**: session tokens/refresh
- **User-scoped?**: Session store (OK) but must be cleared on logout
- **Used in**:
  - `apps/web/src/contexts/AuthProvider.tsx` (fallback getItem)
  - `apps/web/src/lib/supabaseClient.ts` (manual removeItem fallback)

---

## Web (apps/web) — Cache/Query Keys (React Query)

High risk category: any `queryKey` that does **not include** `userId` for user-specific data.

### Confirmed risky keys (NOT user-scoped today)
- `useAcademyMy`:
  - **Key**: `["academy","my"]`
  - **User-scoped?**: ❌ No
  - **File**: `apps/web/src/hooks/useAcademyMy.ts`
- `useTeacherMy`:
  - **Key**: `["teacher","mine"]`
  - **User-scoped?**: ❌ No
  - **File**: `apps/web/src/hooks/useTeacher.ts`

### Notes
- Many other hooks already include `user?.id` in the key (good), but the repo contains **hundreds** of query usages. Step 5 requires making **all user-specific query keys include userId**.

---

## React Native (src) — Persistence & Storage

### 1) Supabase auth session (session store)
- **Storage backend**: `AsyncStorage`
- **Stores**: session tokens/refresh
- **User-scoped?**: Session store (OK), but must be cleared on logout + user change flow must clear all user-scoped stores/caches
- **Used in**: `src/lib/supabase.ts`

### 2) Welcome curtain flags (app-level; not user data)
- **Files**:
  - `hasSeenWelcomeCurtain.json`
  - `appTerminated.json`
- **Storage**: Expo FileSystem `documentDirectory`
- **User-scoped?**: ✅ Not user data (OK as app-level/session-level)
- **Used in**: `src/hooks/useWelcomeCurtain.ts`

### 3) Crash record (app-level; may include error messages)
- **File**: `last_fatal_error.json`
- **Storage**: Expo FileSystem `documentDirectory`
- **User-scoped?**: ✅ Not user profile/preference data
- **Used in**: `src/lib/crashRecorder.ts`

---

## Immediate cross-user bleed risks (from inventory)

1) **WebView / web SPA localStorage keys not namespaced**:
   - `ba_explore_filters_v1`
   - `ba_profile_mode`
   - `db_language`
   - `baileapp:drafts:v1` (store-level)

2) **React Query user-specific caches without userId**:
   - `["academy","my"]`
   - `["teacher","mine"]`

3) **Auth change handling** currently invalidates some queries, but does not guarantee:
   - full cache reset per user
   - full runtime store reset
   - strict “no unscoped storage reads”

