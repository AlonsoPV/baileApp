import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import { routes } from './routes/registry';

// Guards
import { ProtectedRoute } from './components/ProtectedRoute';
import { RedirectIfAuthenticated } from './components/RedirectIfAuthenticated';
import OnboardingGate from './guards/OnboardingGate';

// Auth Screens
import { Login } from './screens/auth/Login';
import { Signup } from './screens/auth/Signup';

// Onboarding Screens
import { ProfileBasics } from './screens/onboarding/ProfileBasics';
import { PickRitmos } from './screens/onboarding/PickRitmos';
import { PickZonas } from './screens/onboarding/PickZonas';

// App Screens
import { ProfileScreen } from './screens/profile/ProfileScreen';
import ExploreHomeScreen from './screens/explore/ExploreHomeScreenModern';
import ExploreListScreen from './screens/explore/ExploreListScreen';

// Organizer Screens
import { OrganizerEditScreen } from './screens/events/OrganizerEditScreen';
import { OrganizerPublicScreen } from './screens/events/OrganizerPublicScreen';
import OrganizerProfileEditor from './screens/profile/OrganizerProfileEditor';
import { OrganizerProfileLive as OrganizerProfileLiveNew } from './screens/profile/OrganizerProfileLive';

// Event Screens
import { EventParentEditScreen } from './screens/events/EventParentEditScreen';
import OrganizerEventParentCreateScreen from './screens/events/OrganizerEventParentCreateScreen';
import OrganizerEventParentEditScreen from './screens/events/OrganizerEventParentEditScreen';
import { EventDateEditScreen } from './screens/events/EventDateEditScreen';
import OrganizerEventDateEditScreen from './screens/events/OrganizerEventDateEditScreen';
import EventParentPublicScreen from './screens/events/EventParentPublicScreen';
import EventParentPublicScreenModern from './screens/events/EventParentPublicScreenModern';
import EventDatePublicScreen from './screens/events/EventDatePublicScreen';
import { SocialLiveScreen } from './screens/events/SocialLiveScreen';
import { DateLiveScreen } from './screens/events/DateLiveScreen';
import { MyRSVPsScreen } from './screens/events/MyRSVPsScreen';
import QuienesSomosScreen from './screens/static/QuienesSomosScreen';
import AboutScreen from './screens/static/AboutScreen';
import LegalScreen from './screens/static/LegalScreen';

// Academy Screens
import AcademyPublicScreen from './screens/academy/AcademyPublicScreen';
import AcademyProfileEditor from './screens/profile/AcademyProfileEditor';
import AcademyProfileLive from './screens/profile/AcademyProfileLive';
import TeacherProfileEditor from './screens/profile/TeacherProfileEditor';
import TeacherProfileLive from './screens/profile/TeacherProfileLive';
import BrandProfileEditor from './screens/profile/BrandProfileEditor';

// Brand Screens
import BrandEditorScreen from './screens/brand/BrandEditorScreen';
import BrandPublicScreen from './screens/brand/BrandPublicScreen';

// Teacher Screens (placeholder - create these if needed)
// import TeacherEditorScreen from './screens/teacher/TeacherEditorScreen';
// import TeacherPublicScreen from './screens/teacher/TeacherPublicScreen';

// User Screens
import UserPublicProfile from './screens/profile/UserPublicProfile';
import UserProfileEditor from './screens/profile/UserProfileEditor';

// System Screens
import NotFound from './screens/system/NotFound';
import Unauthorized from './screens/system/Unauthorized';

// Additional Screens
import InfoScreen from './screens/InfoScreen';
import RoleSelectorScreen from './screens/profile/RoleSelectorScreen';
import AdminRoleRequestsScreen from './screens/admin/AdminRoleRequestsScreen';
import RequestRoleScreen from './screens/roles/RequestRoleScreen';
import IntegrityDebugScreen from './screens/debug/IntegrityDebugScreen';

// Dev-only components
import RouteDiagnostics from './dev/RouteDiagnostics';
import PinSetup from './screens/auth/PinSetup';
import PinLogin from './screens/auth/PinLogin';
import AuthCallback from './screens/auth/AuthCallback';

export default function AppRouter() {
  return (
    <Routes>
      {/* Auth */}
      <Route path={routes.auth.login} element={<Login />} />
      <Route path={routes.auth.signup} element={<Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/pin/setup" element={<PinSetup />} />
      <Route path="/auth/pin" element={<PinLogin />} />

      {/* Onboarding public */}
      <Route path={routes.onboarding.basics} element={<ProfileBasics />} />
      <Route path={routes.onboarding.ritmos} element={<PickRitmos />} />
      <Route path={routes.onboarding.zonas} element={<PickZonas />} />

      {/* AppShell layout */}
      <Route element={<AppShell />}>
        {/* Public */}
        <Route path="/explore" element={<ExploreHomeScreen />} />
        <Route path="/explore/list" element={<ExploreListScreen />} />
        <Route path="/quienes-somos" element={<QuienesSomosScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/legal" element={<LegalScreen />} />
        <Route path="/organizer/:id" element={<OrganizerPublicScreen />} />
        <Route path="/organizador/:organizerId" element={<OrganizerPublicScreen />} />
        <Route path="/social/:id" element={<EventParentPublicScreenModern />} />
        <Route path="/social/fecha/:id" element={<EventDatePublicScreen />} />
        <Route path="/profile/organizer" element={<OrganizerProfileLiveNew />} />
        <Route path="/profile/organizer/:id" element={<OrganizerPublicScreen />} />
        <Route path="/academia/:academyId" element={<AcademyPublicScreen />} />
        <Route path="/profile/academy/:academyId" element={<AcademyPublicScreen />} />
        <Route path="/profile/academy" element={<AcademyProfileLive />} />
        <Route path="/profile/teacher" element={<TeacherProfileLive />} />
        <Route path="/marca/:brandId" element={<BrandPublicScreen />} />
        <Route path="/maestro/:teacherId" element={<TeacherProfileLive />} />
        <Route path="/u/:userId" element={<UserPublicProfile />} />

        {/* Protected */}
        <Route element={<OnboardingGate />}>
          <Route path={routes.app.profile} element={<ProfileScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/profile/edit" element={<ProfileScreen />} />
          <Route path="/profile/settings" element={<ProfileScreen />} />
          <Route path="/profile/teacher/edit" element={<TeacherProfileEditor />} />
          <Route path="/profile/brand" element={<BrandProfileEditor />} />
          <Route path={routes.organizer.edit} element={<OrganizerEditScreen />} />
          <Route path="/profile/organizer/edit" element={<OrganizerProfileEditor />} />
          <Route path="/events/parent/new" element={<OrganizerEventParentCreateScreen />} />
          <Route path="/events/parent/:id/edit" element={<OrganizerEventParentEditScreen />} />
          <Route path="/events/date/new/:parentId" element={<EventDateEditScreen />} />
          <Route path="/events/date/:id/edit" element={<EventDateEditScreen />} />
          <Route path="/social/new" element={<OrganizerEventParentCreateScreen />} />
          <Route path="/social/:parentId/edit" element={<OrganizerEventParentEditScreen />} />
          <Route path="/social/:parentId/fecha/nueva" element={<EventDateEditScreen />} />
          <Route path="/social/fecha/:dateId/edit" element={<OrganizerEventDateEditScreen />} />
          <Route path="/me/rsvps" element={<MyRSVPsScreen />} />
          <Route path={routes.academy.edit} element={<AcademyProfileEditor />} />
          <Route path="/profile/academy/edit" element={<AcademyProfileEditor />} />
          <Route path={routes.brand.edit} element={<BrandEditorScreen />} />
          <Route path="/profile/roles" element={<RoleSelectorScreen />} />
          <Route path="/profile/roles/request" element={<RequestRoleScreen />} />
          <Route path="/app/roles/request" element={<RequestRoleScreen />} />
          <Route path="/admin/roles" element={<AdminRoleRequestsScreen />} />
          <Route path="/admin" element={<AdminRoleRequestsScreen />} />
          <Route path="/debug/integrity" element={<IntegrityDebugScreen />} />
        </Route>

        {/* Default and 404 */}
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

