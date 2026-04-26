import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import { routes } from './routes/registry';
import { isNativeApp } from './utils/isNativeApp';
import { RouteLoadingFallback, type RouteLoadingLayout } from './components/RouteLoadingFallback';
import { ExploreHomeLoadingFallback } from './components/explore/ExploreHomeLoadingFallback';
import { RouteLoadErrorBoundary } from './components/RouteLoadErrorBoundary';

// Guards
import OnboardingGate from './guards/OnboardingGate';

// Lazy route screens (outside shell/layout to keep core boot lightweight)
const Login = React.lazy(() =>
  import('./screens/auth/Login').then((m) => ({ default: m.Login })),
);
const Signup = React.lazy(() =>
  import('./screens/auth/Signup').then((m) => ({ default: m.Signup })),
);
const EventDatePublicScreen = React.lazy(() => import('./screens/events/EventDatePublicScreen'));
const ClassPublicScreen = React.lazy(() => import('./screens/classes/ClassPublicScreen'));
const AuthCallback = React.lazy(() => import('./screens/auth/AuthCallback'));
const PinSetup = React.lazy(() => import('./screens/auth/PinSetup'));
const PinLogin = React.lazy(() => import('./screens/auth/PinLogin'));
const ResetPassword = React.lazy(() => import('./screens/auth/ResetPassword'));
const ProfileBasics = React.lazy(() =>
  import('./screens/onboarding/ProfileBasics').then((m) => ({ default: m.ProfileBasics })),
);
const PickRitmos = React.lazy(() =>
  import('./screens/onboarding/PickRitmos').then((m) => ({ default: m.PickRitmos })),
);
const PickZonas = React.lazy(() =>
  import('./screens/onboarding/PickZonas').then((m) => ({ default: m.PickZonas })),
);
const Landing = React.lazy(() => import('./pages/Landing'));
const NotFound = React.lazy(() => import('./screens/system/NotFound'));
const StripeOnboardingSuccess = React.lazy(() => import('./screens/payments/StripeOnboardingSuccess'));
const StripeOnboardingRefresh = React.lazy(() => import('./screens/payments/StripeOnboardingRefresh'));
const PaymentSuccess = React.lazy(() => import('./screens/payments/PaymentSuccess'));
const PaymentCanceled = React.lazy(() => import('./screens/payments/PaymentCanceled'));

const ProfileScreen = React.lazy(() =>
  import('./screens/profile/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const ExploreHomeScreen = React.lazy(() => import('./screens/explore/ExploreHomeScreenModern'));
const ExploreListScreen = React.lazy(() => import('./screens/explore/ExploreListScreen'));
const OrganizerEditScreen = React.lazy(() =>
  import('./screens/events/OrganizerEditScreen').then((m) => ({ default: m.OrganizerEditScreen })),
);
const OrganizerPublicScreen = React.lazy(() =>
  import('./screens/events/OrganizerPublicScreen').then((m) => ({ default: m.OrganizerPublicScreen })),
);
const OrganizerProfileEditor = React.lazy(() => import('./screens/profile/OrganizerProfileEditor'));
const OrganizerProfileLiveNew = React.lazy(() =>
  import('./screens/profile/OrganizerProfileLive').then((m) => ({ default: m.OrganizerProfileLive })),
);
const OrganizerEventParentCreateScreen = React.lazy(() => import('./screens/events/OrganizerEventParentCreateScreen'));
const OrganizerEventParentEditScreen = React.lazy(() => import('./screens/events/OrganizerEventParentEditScreen'));
const EventDateEditScreen = React.lazy(() =>
  import('./screens/events/EventDateEditScreen').then((m) => ({ default: m.EventDateEditScreen })),
);
const OrganizerEventDateEditScreen = React.lazy(() => import('./screens/events/OrganizerEventDateEditScreen'));
const OrganizerEventDateCreateScreen = React.lazy(() => import('./screens/events/OrganizerEventDateCreateScreen'));
const EventParentPublicScreenModern = React.lazy(() => import('./screens/events/EventParentPublicScreenModern'));
const MyRSVPsScreen = React.lazy(() =>
  import('./screens/events/MyRSVPsScreen').then((m) => ({ default: m.MyRSVPsScreen })),
);
const QuienesSomosScreen = React.lazy(() => import('./screens/static/QuienesSomosScreen'));
const AboutScreen = React.lazy(() => import('./screens/static/AboutScreen'));
const LegalScreen = React.lazy(() => import('./screens/static/LegalScreen'));
const DeleteAccountScreen = React.lazy(() => import('./screens/static/DeleteAccountScreen'));
const DefaultProfileSettings = React.lazy(() => import('./screens/profile/DefaultProfileSettings'));
const AcademyPublicScreen = React.lazy(() => import('./screens/academy/AcademyPublicScreen'));
const AcademyProfileEditor = React.lazy(() => import('./screens/profile/AcademyProfileEditor'));
const AcademyProfileLive = React.lazy(() => import('./screens/profile/AcademyProfileLive'));
const TeacherProfileEditor = React.lazy(() => import('./screens/profile/TeacherProfileEditor'));
const TeacherProfileLive = React.lazy(() => import('./screens/profile/TeacherProfileLive'));
const BrandProfileEditor = React.lazy(() => import('./screens/profile/BrandProfileEditor'));
const BrandProfileLive = React.lazy(() => import('./screens/profile/BrandProfileLive'));
const BrandEditorScreen = React.lazy(() => import('./screens/brand/BrandEditorScreen'));
const BrandPublicScreen = React.lazy(() => import('./screens/brand/BrandPublicScreen'));
const UserProfileEditor = React.lazy(() => import('./screens/profile/UserProfileEditor'));
const UserProfileLive = React.lazy(() =>
  import('./screens/profile/UserProfileLive').then((m) => ({ default: m.UserProfileLive })),
);
const UserPublicScreen = React.lazy(() =>
  import('./screens/profile/UserPublicScreen').then((m) => ({ default: m.UserProfileLive })),
);
const RoleSelectorScreen = React.lazy(() => import('./screens/profile/RoleSelectorScreen'));
const AdminRoleRequestsScreen = React.lazy(() => import('./screens/admin/AdminRoleRequestsScreen'));
const RequestRoleScreen = React.lazy(() => import('./screens/roles/RequestRoleScreen'));
const RolesInfoScreen = React.lazy(() => import('./screens/roles/RolesInfoScreen'));
const ValidationInfoScreen = React.lazy(() => import('./screens/static/ValidationInfoScreen'));
const IntegrityDebugScreen = React.lazy(() => import('./screens/debug/IntegrityDebugScreen'));
const SupportScreen = React.lazy(() => import('./screens/static/SupportScreen'));
const AcademyProposalScreen = React.lazy(() => import('./screens/static/AcademyProposalScreen'));
const ChallengesList = React.lazy(() => import('./screens/challenges/ChallengesList'));
const ChallengeNew = React.lazy(() => import('./screens/challenges/ChallengeNew'));
const ChallengeDetail = React.lazy(() => import('./screens/challenges/ChallengeDetail'));
const OpenEntityScreen = React.lazy(() => import('./screens/open/OpenEntityScreen'));
const TeacherPublicLive = React.lazy(() => import('./screens/profile/TeacherPublicLive'));
const TrendingDetail = React.lazy(() => import('./pages/trending/TrendingDetail'));
const TrendingAdmin = React.lazy(() => import('./pages/trending/TrendingAdmin'));
const TrendingList = React.lazy(() => import('./pages/trending/TrendingList'));
const CompetitionGroupList = React.lazy(() => import('./components/competitionGroups/CompetitionGroupList'));
const CompetitionGroupDetail = React.lazy(() => import('./components/competitionGroups/CompetitionGroupDetail'));
const CompetitionGroupForm = React.lazy(() => import('./components/competitionGroups/CompetitionGroupForm'));
const MyPurchasesScreen = React.lazy(() => import('./screens/payments/MyPurchasesScreen'));
const MyClassAttendanceScreen = React.lazy(() => import('./screens/profile/MyClassAttendanceScreen'));

function RouteSuspense({
  children,
  layout = 'fullscreen',
  fallback,
}: {
  children: React.ReactNode;
  layout?: RouteLoadingLayout;
  /** Si se omite, se usa RouteLoadingFallback con `layout`. */
  fallback?: React.ReactNode;
}) {
  return (
    <RouteLoadErrorBoundary>
      <Suspense fallback={fallback ?? <RouteLoadingFallback layout={layout} />}>
        {children}
      </Suspense>
    </RouteLoadErrorBoundary>
  );
}

function ExploreRouteSuspense({ children }: { children: React.ReactNode }) {
  return (
    <RouteSuspense layout="appContent" fallback={<ExploreHomeLoadingFallback />}>
      {children}
    </RouteSuspense>
  );
}

function PublicDeepLinkRouteSuspense({ children }: { children: React.ReactNode }) {
  return <RouteSuspense layout="appContent">{children}</RouteSuspense>;
}

function NativeAwarePublicEventDateRoute() {
  const location = useLocation();
  return (
    <PublicDeepLinkRouteSuspense key={isNativeApp(location.search) ? "native" : "web"}>
      <EventDatePublicScreen />
    </PublicDeepLinkRouteSuspense>
  );
}

function NativeAwarePublicClassRoute() {
  const location = useLocation();
  return (
    <PublicDeepLinkRouteSuspense key={isNativeApp(location.search) ? "native" : "web"}>
      <ClassPublicScreen />
    </PublicDeepLinkRouteSuspense>
  );
}

function NativeAwarePublicOrganizerRoute() {
  const location = useLocation();
  return (
    <PublicDeepLinkRouteSuspense key={isNativeApp(location.search) ? "native" : "web"}>
      <OrganizerPublicScreen />
    </PublicDeepLinkRouteSuspense>
  );
}

function OrganizerEditorRouteSuspense({ children }: { children: React.ReactNode }) {
  return <RouteSuspense layout="appContent">{children}</RouteSuspense>;
}

/**
 * HomeEntry - Determina qué mostrar en la ruta raíz (/)
 * 
 * - Si es app nativa (iOS/Android): redirige a /explore
 * - Si es web normal: muestra la Landing page
 */
function HomeEntry() {
  const location = useLocation();
  const native = isNativeApp(location.search);

  if (native) {
    // App nativa (iOS/Android): redirigir a /explore como inicio
    // Preserve query params (e.g. ?source=app) in case downstream needs them.
    return <Navigate to={{ pathname: '/explore', search: location.search }} replace />;
  }

  // Web normal: mostrar Landing page
  return (
    <RouteSuspense>
      <Landing />
    </RouteSuspense>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<RouteSuspense><Outlet /></RouteSuspense>}>
        {/* Auth */}
        <Route path={routes.auth.login} element={<Login />} />
        <Route path={routes.auth.signup} element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/pin/setup" element={<PinSetup />} />
        <Route path="/auth/pin" element={<PinLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Onboarding public */}
        <Route path={routes.onboarding.basics} element={<ProfileBasics />} />
        <Route path={routes.onboarding.ritmos} element={<PickRitmos />} />
        <Route path={routes.onboarding.zonas} element={<PickZonas />} />
      </Route>

      {/* Stripe Onboarding Routes - Public (no auth needed) */}
      <Route path="/stripe/onboarding/success" element={<RouteSuspense><StripeOnboardingSuccess /></RouteSuspense>} />
      <Route path="/stripe/onboarding/refresh" element={<RouteSuspense><StripeOnboardingRefresh /></RouteSuspense>} />
      
      {/* Payment Success/Cancel Routes - Public (no auth needed) */}
      <Route path="/pago/exitoso" element={<RouteSuspense><PaymentSuccess /></RouteSuspense>} />
      <Route path="/pago/cancelado" element={<RouteSuspense><PaymentCanceled /></RouteSuspense>} />
      {/* Redirect for double slashes in payment routes */}
      <Route path="//pago/exitoso" element={<Navigate to="/pago/exitoso" replace />} />
      <Route path="//pago/cancelado" element={<Navigate to="/pago/cancelado" replace />} />

      {/* Landing pages (sin AppShell) - Home es la landing de conversión */}
      <Route path="/" element={<HomeEntry />} />
      <Route path="/propuesta-academias" element={<RouteSuspense><AcademyProposalScreen /></RouteSuspense>} />
      <Route path="/academias/propuesta" element={<RouteSuspense><AcademyProposalScreen /></RouteSuspense>} />

      {/* Smart share pages (open in app / view in browser) - sin AppShell */}
      <Route path="/open/evento/:id" element={<RouteSuspense><OpenEntityScreen entityType="evento" /></RouteSuspense>} />
      <Route path="/open/clase/:type/:id" element={<RouteSuspense><OpenEntityScreen entityType="clase" /></RouteSuspense>} />
      <Route path="/open/academia/:id" element={<RouteSuspense><OpenEntityScreen entityType="academia" /></RouteSuspense>} />
      <Route path="/open/maestro/:id" element={<RouteSuspense><OpenEntityScreen entityType="maestro" /></RouteSuspense>} />
      <Route path="/open/organizer/:id" element={<RouteSuspense><OpenEntityScreen entityType="organizer" /></RouteSuspense>} />
      <Route path="/open/u/:id" element={<RouteSuspense><OpenEntityScreen entityType="user" /></RouteSuspense>} />
      <Route path="/open/marca/:id" element={<RouteSuspense><OpenEntityScreen entityType="marca" /></RouteSuspense>} />

      {/* AppShell layout */}
      <Route element={<AppShell />}>
        <Route element={<RouteSuspense layout="appContent"><Outlet /></RouteSuspense>}>
          {/* Public */}
          <Route path="/explore" element={<ExploreRouteSuspense><ExploreHomeScreen /></ExploreRouteSuspense>} />
          <Route path="/explore/list" element={<ExploreListScreen />} />
          <Route path="/quienes-somos" element={<QuienesSomosScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/soporte" element={<SupportScreen />} />
          <Route path="/legal" element={<LegalScreen />} />
          <Route path="/aviso-de-privacidad" element={<LegalScreen />} />
          <Route path="/eliminar-cuenta" element={<DeleteAccountScreen />} />
          <Route path="/organizer/:id" element={<NativeAwarePublicOrganizerRoute />} />
          <Route path="/organizador/:organizerId" element={<OrganizerPublicScreen />} />
          <Route path="/social/:id" element={<EventParentPublicScreenModern />} />
          <Route path="/social/fecha/:id" element={<NativeAwarePublicEventDateRoute />} />
          <Route path="/profile/organizer" element={<OrganizerProfileLiveNew />} />
          <Route path="/profile/organizer/:id" element={<OrganizerPublicScreen />} />
          <Route path="/academia/:academyId" element={<AcademyPublicScreen />} />
          <Route path="/profile/academy/:academyId" element={<AcademyPublicScreen />} />
          <Route path="/profile/academy" element={<AcademyProfileLive />} />
          <Route path="/profile/teacher" element={<TeacherProfileLive />} />
          <Route path="/u/:userId" element={<UserPublicScreen />} />
          <Route path="/marca/:brandId" element={<BrandPublicScreen />} />
          <Route path="/maestro/:teacherId" element={<TeacherPublicLive />} />
          {/* Trending público */}
          <Route path="/trending" element={<TrendingList />} />
          <Route path="/trending/:id" element={<TrendingDetail />} />
          {/* Grupos de Competencia */}
          <Route path="/competition-groups" element={<CompetitionGroupList />} />
          <Route path="/competition-groups/new" element={<CompetitionGroupForm />} />
          <Route path="/competition-groups/:id" element={<CompetitionGroupDetail />} />
          <Route path="/competition-groups/:id/edit" element={<CompetitionGroupForm />} />
          {/* Clase pública (usa query o params) */}
          <Route path="/clase" element={<NativeAwarePublicClassRoute />} />
          <Route path="/clase/:type/:id" element={<NativeAwarePublicClassRoute />} />
          {/* Challenges (público: lista y detalle) */}
          <Route path="/challenges" element={<ChallengesList />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          {/* Info screens públicas */}
          <Route path="/app/roles/info" element={<RolesInfoScreen />} />
          <Route path="/validation/info" element={<ValidationInfoScreen />} />
          {/** Public user profile by id was removed along with UserPublicProfile.tsx */}

          {/* Protected */}
          <Route element={<OnboardingGate />}>
            <Route path={routes.app.profile} element={<ProfileScreen />} />
            {/* Rutas unificadas de perfil de usuario */}
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/edit" element={<UserProfileEditor />} />
            {/* Nueva ruta explícita para el Live de usuario */}
            <Route path="/profile/user" element={<UserProfileLive />} />
            <Route path="/profile/settings" element={<DefaultProfileSettings />} />
            <Route path="/profile/teacher/edit" element={<TeacherProfileEditor />} />
            <Route path="/profile/brand" element={<BrandProfileLive />} />
            <Route path="/profile/brand/edit" element={<BrandProfileEditor />} />
            <Route path={routes.organizer.edit} element={<OrganizerEditScreen />} />
            <Route path="/profile/organizer/edit" element={<OrganizerEditorRouteSuspense><OrganizerProfileEditor /></OrganizerEditorRouteSuspense>} />
            <Route path="/events/parent/new" element={<OrganizerEventParentCreateScreen />} />
            <Route path="/events/parent/:id/edit" element={<OrganizerEventParentEditScreen />} />
            <Route path="/events/date/new/:parentId" element={<EventDateEditScreen />} />
            <Route path="/events/date/:id/edit" element={<EventDateEditScreen />} />
            <Route path="/social/new" element={<OrganizerEventParentCreateScreen />} />
            <Route path="/social/:parentId/edit" element={<OrganizerEventParentEditScreen />} />
            <Route path="/social/:parentId/fecha/nueva" element={<OrganizerEventDateCreateScreen />} />
            <Route path="/social/fecha/:dateId/edit" element={<OrganizerEventDateEditScreen />} />
            <Route path="/me/rsvps" element={<MyRSVPsScreen />} />
            <Route path="/me/compras" element={<MyPurchasesScreen />} />
            <Route path="/me/clases" element={<MyClassAttendanceScreen />} />
            <Route path={routes.academy.edit} element={<AcademyProfileEditor />} />
            <Route path="/profile/academy/edit" element={<AcademyProfileEditor />} />
            <Route path={routes.brand.edit} element={<BrandEditorScreen />} />
            <Route path="/profile/roles" element={<RoleSelectorScreen />} />
            <Route path="/profile/roles/request" element={<RequestRoleScreen />} />
            <Route path="/app/roles/request" element={<RequestRoleScreen />} />
            <Route path="/admin/roles" element={<AdminRoleRequestsScreen />} />
            <Route path="/admin" element={<AdminRoleRequestsScreen />} />
            <Route path="/admin/trending" element={<TrendingAdmin />} />
            {/* Crear challenge (protegido por rol desde UI; backend con RLS) */}
            <Route path="/challenges/new" element={<ChallengeNew />} />
            <Route path="/debug/integrity" element={<IntegrityDebugScreen />} />
          </Route>

          {/* Redirect for double slashes in Stripe routes */}
          <Route path="//stripe/onboarding/success" element={<Navigate to="/stripe/onboarding/success" replace />} />
          <Route path="//stripe/onboarding/refresh" element={<Navigate to="/stripe/onboarding/refresh" replace />} />

          {/* Default and 404 (/) ya manejado por Landing fuera de AppShell) */}
          <Route path="*" element={<RouteSuspense layout="appContent"><NotFound /></RouteSuspense>} />
        </Route>
      </Route>
    </Routes>
  );
}

