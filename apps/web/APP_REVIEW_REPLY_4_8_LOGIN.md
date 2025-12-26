# App Review Reply — Guideline 4.8 (Login Services)

## Respuesta para App Store Connect Resolution Center

Hello App Review team,

The app **already includes Sign in with Apple** as an equivalent login option alongside Google OAuth.

### Login Services Available

The app offers the following login options:

1. **Sign in with Apple** ✅
   - **Location**: Login screen (`/auth/login`)
   - **Button**: "Continuar con Apple" (Continue with Apple)
   - **Data minimization**: Provides only the user's **name and email address** (as allowed by the user and Apple)
   - **Private email**: Users can choose **"Hide My Email"** during account creation/sign-in, which keeps their real email private
   - **No advertising tracking**: The authentication flow is used only for account access and does not collect app interactions for advertising purposes without the user's consent

2. **Google OAuth** (Third-party)
   - **Location**: Same login screen
   - **Button**: "Continuar con Google" (Continue with Google)

3. **Email/Password** (Direct authentication)
   - Standard email and password login

4. **Magic Link** (Passwordless)
   - Email-based passwordless authentication

### Sign in with Apple Implementation

**Implementation details:**
- Provider: `supabase.auth.signInWithOAuth({ provider: 'apple' })`
- Scopes: `email name` (only what Apple grants)
- Redirect: Handled via Supabase Auth callback
- Configuration: Properly configured in Supabase Dashboard with Apple Service ID

**Code location:**
- File: `apps/web/src/screens/auth/Login.tsx`
- Function: `handleAppleAuth()` (lines 191-221)
- UI: Button visible on both login and signup tabs

### Verification Steps for App Review

1. Navigate to the login screen (`/auth/login`)
2. You will see the **"Continuar con Apple"** button with the Apple logo
3. Tapping the button initiates the Sign in with Apple flow
4. Users can choose to hide their email address during the process

### Compliance with Guideline 4.8

Sign in with Apple meets all requirements:
- ✅ Limits data collection to user's name and email address
- ✅ Allows users to keep their email address private (Hide My Email)
- ✅ Does not collect interactions for advertising purposes without consent

Thank you for your review.

---

**Reference Documents:**
- [Sign in with Apple Setup Guide](./SIGN_IN_WITH_APPLE_SETUP.md)
- [Previous 4.8 Reply](./APP_REVIEW_REPLY_4_8.md)

