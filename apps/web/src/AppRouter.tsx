import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import ExploreHomeScreen from './screens/explore/ExploreHomeScreen';
import ExploreListScreen from './screens/explore/ExploreListScreen';

// Organizer Screens
import { OrganizerEditScreen } from './screens/events/OrganizerEditScreen';
import { OrganizerPublicScreen } from './screens/events/OrganizerPublicScreen';
import OrganizerProfileEditor from './screens/profile/OrganizerProfileEditor';
import { OrganizerProfileLive as OrganizerProfileLiveNew } from './screens/profile/OrganizerProfileLive';

// Event Screens
import { EventParentEditScreen } from './screens/events/EventParentEditScreen';
import { EventDateEditScreen } from './screens/events/EventDateEditScreen';
import EventParentPublicScreen from './screens/events/EventParentPublicScreen';
import EventDatePublicScreen from './screens/events/EventDatePublicScreen';
import { SocialLiveScreen } from './screens/events/SocialLiveScreen';
import { DateLiveScreen } from './screens/events/DateLiveScreen';
import { MyRSVPsScreen } from './screens/events/MyRSVPsScreen';

// Academy Screens
import AcademyEditorScreen from './screens/academy/AcademyEditorScreen';
import AcademyPublicScreen from './screens/academy/AcademyPublicScreen';
import AcademyProfileEditor from './screens/profile/AcademyProfileEditor';
import AcademyProfileLive from './screens/profile/AcademyProfileLive';

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
import IntegrityDebugScreen from './screens/debug/IntegrityDebugScreen';

// Dev-only components
import RouteDiagnostics from './dev/RouteDiagnostics';

export default function AppRouter() {
  return (
    <Routes>
        {/* Auth Routes - Redirect if authenticated */}
        <Route
          path={routes.auth.login}
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path={routes.auth.signup}
          element={
            <RedirectIfAuthenticated>
              <Signup />
            </RedirectIfAuthenticated>
          }
        />

        {/* Onboarding Routes */}
        <Route path={routes.onboarding.basics} element={<ProfileBasics />} />
        <Route path={routes.onboarding.ritmos} element={<PickRitmos />} />
        <Route path={routes.onboarding.zonas} element={<PickZonas />} />

        {/* Protected Routes with OnboardingGate */}
        <Route element={<OnboardingGate />}>
          {/* App Routes */}
          <Route path={routes.app.profile} element={<ProfileScreen />} />
          <Route path={routes.app.explore} element={<ExploreHomeScreen />} />
          <Route path="/explore/list" element={<ExploreListScreen />} />
          
          {/* Info Screen */}
          <Route path="/info" element={<InfoScreen />} />
          
          {/* User Profile Routes */}
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/profile/edit" element={<ProfileScreen />} />
          <Route path="/profile/settings" element={<ProfileScreen />} />
          
          {/* Organizer Routes */}
          <Route path={routes.organizer.edit} element={<OrganizerEditScreen />} />
          <Route path="/profile/organizer/edit" element={<OrganizerProfileEditor />} />
          
          {/* Event Routes */}
          <Route path="/events/parent/new" element={<EventParentEditScreen />} />
          <Route path="/events/parent/:id/edit" element={<EventParentEditScreen />} />
          <Route path="/events/date/new/:parentId" element={<EventDateEditScreen />} />
          <Route path="/events/date/:id/edit" element={<EventDateEditScreen />} />
          
          {/* Social/Event Flow Routes */}
          <Route path="/social/new" element={<EventParentEditScreen />} />
          <Route path="/social/:parentId/edit" element={<EventParentEditScreen />} />
          <Route path="/social/:parentId/fecha/nueva" element={<EventDateEditScreen />} />
          <Route path="/social/fecha/:dateId/edit" element={<EventDateEditScreen />} />
          
          {/* My RSVPs */}
          <Route path="/me/rsvps" element={<MyRSVPsScreen />} />
          
          {/* Academy Routes */}
          <Route path={routes.academy.edit} element={<AcademyEditorScreen />} />
          <Route path="/profile/academy/edit" element={<AcademyProfileEditor />} />
          
          {/* Brand Routes */}
          <Route path={routes.brand.edit} element={<BrandEditorScreen />} />
          
          {/* Role Selection */}
          <Route path="/profile/roles" element={<RoleSelectorScreen />} />
          
          {/* Admin Routes */}
          <Route path="/admin/roles" element={<AdminRoleRequestsScreen />} />
          
          {/* Debug Routes */}
          <Route path="/debug/integrity" element={<IntegrityDebugScreen />} />
        </Route>

        {/* Public Routes (no authentication required) */}
        
        {/* Organizer Public */}
        <Route path="/organizador/:organizerId" element={<OrganizerPublicScreen />} />
        <Route path="/profile/organizer" element={<OrganizerProfileLiveNew />} />
        
        {/* Academy Public */}
        <Route path="/academia/:academyId" element={<AcademyPublicScreen />} />
        <Route path="/profile/academy" element={<AcademyProfileLive />} />
        
        {/* Brand Public */}
        <Route path="/marca/:brandId" element={<BrandPublicScreen />} />
        
        {/* User Public */}
        <Route path="/u/:userId" element={<UserPublicProfile />} />
        <Route path="/profile/user/edit" element={<UserProfileEditor />} />
        
        {/* Event Live Routes */}
        <Route path="/evento/:parentId" element={<EventParentPublicScreen />} />
        <Route path="/evento/fecha/:dateId" element={<EventDatePublicScreen />} />
        <Route path="/social/:id" element={<SocialLiveScreen />} />
        <Route path="/social/fecha/:id" element={<DateLiveScreen />} />
        
        {/* Legacy event routes */}
        <Route path="/events/parent/:id" element={<EventParentPublicScreen />} />
        <Route path="/events/date/:id" element={<EventDatePublicScreen />} />

        {/* System Routes */}
        <Route path={routes.misc.unauthorized} element={<Unauthorized />} />
        <Route path={routes.misc.notFound} element={<NotFound />} />

        {/* Dev-only Route Diagnostics */}
        {import.meta.env.DEV && (
          <Route path="/__routes" element={<RouteDiagnostics />} />
        )}

        {/* Default redirect */}
        <Route path={routes.root} element={<Navigate to={routes.app.profile} replace />} />

        {/* Catch all - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}
