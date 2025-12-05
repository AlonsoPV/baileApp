import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RedirectIfAuthenticated } from './components/RedirectIfAuthenticated';
import OnboardingGate from './guards/OnboardingGate';
import { Login } from './screens/auth/Login';
import { Signup } from './screens/auth/Signup';
import { ProfileBasics } from './screens/onboarding/ProfileBasics';
import { PickRitmos } from './screens/onboarding/PickRitmos';
import { PickZonas } from './screens/onboarding/PickZonas';
import { Profile } from './screens/app/Profile';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import InfoScreen from './screens/InfoScreen';

// Sprint 2 - Event screens
import { OrganizerEditScreen } from './screens/events/OrganizerEditScreen';
import { OrganizerPublicScreen } from './screens/events/OrganizerPublicScreen';
import { EventParentEditScreen } from './screens/events/EventParentEditScreen';
import { EventDateEditScreen } from './screens/events/EventDateEditScreen';
import EventDatePublicScreen from './screens/events/EventDatePublicScreen';
import { MyRSVPsScreen } from './screens/events/MyRSVPsScreen';
import MyPurchasesScreen from './screens/payments/MyPurchasesScreen';
import { EventCreateWizard } from './screens/events/EventCreateWizard';

// New unified event screens
import EventCreateScreen from './screens/events/EventCreateScreen';
import EventEditScreen from './screens/events/EventEditScreen';
import EventPublicScreen from './screens/events/EventPublicScreen';

// Sprint 3 - Profile editors
import { EventEditor } from './screens/profile/EventEditor';
import { EventDateEditor } from './screens/profile/EventDateEditor';
import { OrganizerProfileLive as OrganizerProfileLiveNew } from './screens/profile/OrganizerProfileLive';
import OrganizerProfileEditor from './screens/profile/OrganizerProfileEditor';
import { OrganizerDashboardDates } from './screens/profile/OrganizerDashboardDates';
// UserPublicProfile removed
import UserProfileEditor from './screens/profile/UserProfileEditor';
import AcademyProfileLive from './screens/profile/AcademyProfileLive';
import AcademyProfileEditor from './screens/profile/AcademyProfileEditor';
import DefaultProfileSettings from './screens/profile/DefaultProfileSettings';

// Brand screens
import BrandEditorScreen from './screens/brand/BrandEditorScreen';
import BrandPublicScreen from './screens/brand/BrandPublicScreen';

// Academy screens
import AcademyPublicScreen from './screens/academy/AcademyPublicScreen';

// New Social/Event Flow Screens
import OrganizerEventParentCreateScreen from './screens/events/OrganizerEventParentCreateScreen';
import OrganizerEventParentEditScreen from './screens/events/OrganizerEventParentEditScreen';
import OrganizerEventDateCreateScreen from './screens/events/OrganizerEventDateCreateScreen';
import OrganizerEventDateEditScreen from './screens/events/OrganizerEventDateEditScreen';
import { SocialLiveScreen } from './screens/events/SocialLiveScreen';
import EventParentPublicScreenModern from './screens/events/EventParentPublicScreenModern';
import { DateLiveScreen } from './screens/events/DateLiveScreen';

// Sprint 3 - Explore/Search
import ExploreHomeScreen from './screens/explore/ExploreHomeScreen';
import ExploreListScreen from './screens/explore/ExploreListScreen';

// Role Selection System
import RoleSelectorScreen from './screens/profile/RoleSelectorScreen';
import AdminRoleRequestsScreen from './screens/admin/AdminRoleRequestsScreen';

// Debug/Diagnostics
import IntegrityDebugScreen from './screens/debug/IntegrityDebugScreen';

// Additional Profile Types
import TeacherProfileEditor from './screens/profile/TeacherProfileEditor';
import BrandProfileEditor from './screens/profile/BrandProfileEditor';

export function AppRouter() {
  return (
    <Routes>
      {/* Auth Routes - Redirect if authenticated */}
      <Route
        path="/auth/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <RedirectIfAuthenticated>
            <Signup />
          </RedirectIfAuthenticated>
        }
      />

      {/* Onboarding Routes - Public (no ProtectedRoute needed) */}
      <Route path="/onboarding/basics" element={<ProfileBasics />} />
      <Route path="/onboarding/ritmos" element={<PickRitmos />} />
      <Route path="/onboarding/zonas" element={<PickZonas />} />

      {/* Protected Routes with OnboardingGate */}
      <Route element={<OnboardingGate />}>
        {/* App Routes */}
        <Route path="/app/profile" element={<ProfileScreen />} />
        <Route path="/app/profile/edit" element={<ProfileScreen />} />
        
        {/* Info Screen */}
        <Route path="/info" element={<InfoScreen />} />
        
        {/* User Profile Routes (new unified) */}
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/profile/edit" element={<ProfileScreen />} />
        {/* Nueva ruta para Live de Usuario con slug explícito */}
        <Route path="/profile/user" element={<ProfileScreen />} />
        
        {/* Default Profile Settings */}
        <Route path="/profile/settings" element={<DefaultProfileSettings />} />
        
        {/* Event Creation Wizard */}
        <Route path="/events/new" element={<EventCreateWizard />} />
        
        {/* New Unified Event Routes */}
        <Route path="/events/create" element={<EventCreateScreen />} />
        <Route path="/events/date/:dateId/edit" element={<EventEditScreen />} />

        {/* Sprint 3 - New Profile Routes */}
        <Route path="/profile/organizer/edit" element={<OrganizerProfileEditor />} />
        <Route path="/profile/academy/edit" element={<AcademyProfileEditor />} />
        
        {/* Organizer Event Editors */}
        <Route path="/profile/organizer/events/new" element={<EventEditor />} />
        <Route path="/profile/organizer/events/:id" element={<EventEditor />} />
        <Route path="/profile/organizer/events/:id/edit" element={<EventEditor />} />
        <Route path="/profile/organizer/date/new/:parentId" element={<EventDateEditor />} />
        <Route path="/profile/organizer/date/:id" element={<EventDateEditor />} />
        <Route path="/profile/organizer/date/:id/edit" element={<EventDateEditor />} />
        
        {/* Event Routes - Alternative paths */}
        <Route path="/events/:id/edit" element={<EventEditor />} />
        <Route path="/events/date/:id/edit" element={<EventDateEditor />} />

        {/* Organizer Dashboard */}
        <Route path="/profile/organizer/dashboard/:id" element={<OrganizerDashboardDates />} />

        {/* Sprint 2 - Event Routes */}
        <Route path="/organizer/edit" element={<OrganizerEditScreen />} />
        
        {/* Event Parent Routes */}
        <Route path="/events/parent/new" element={<EventParentEditScreen />} />
        <Route path="/events/parent/:id/edit" element={<EventParentEditScreen />} />
        
        {/* Event Parent Dashboard - Fechas */}
        <Route path="/events/parent/:id/dates" element={<OrganizerDashboardDates />} />

        {/* Event Date Routes */}
        <Route path="/events/date/new/:parentId" element={<EventDateEditScreen />} />
        <Route path="/events/date/:id/edit" element={<EventDateEditScreen />} />

        {/* My RSVPs Route */}
        <Route path="/me/rsvps" element={<MyRSVPsScreen />} />
        <Route path="/me/compras" element={<MyPurchasesScreen />} />

        {/* New Social/Event Flow Routes */}
        {/* Social (Parent) Routes */}
        <Route path="/social/new" element={<OrganizerEventParentCreateScreen />} />
        <Route path="/social/:parentId" element={<EventParentPublicScreenModern />} />
        <Route path="/social/:parentId/edit" element={<OrganizerEventParentEditScreen />} />
        <Route path="/social/:parentId/fecha/nueva" element={<OrganizerEventDateCreateScreen />} />
        
        {/* Event Date Routes */}
        <Route path="/social/fecha/:dateId/edit" element={<OrganizerEventDateEditScreen />} />

        {/* Explore/Search Routes */}
        <Route path="/explore" element={<ExploreHomeScreen />} />
        <Route path="/explore/list" element={<ExploreListScreen />} />

        {/* Role Selection System */}
        <Route path="/profile/roles" element={<RoleSelectorScreen />} />
        
        {/* Additional Profile Types */}
        <Route path="/profile/teacher/edit" element={<TeacherProfileEditor />} />
        
        {/* Academy Routes */}
        <Route path="/academia/editar" element={<AcademyProfileEditor />} />
        
        {/* Admin Routes */}
        <Route path="/admin/roles" element={<AdminRoleRequestsScreen />} />
        
        {/* Debug Routes */}
        <Route path="/debug/integrity" element={<IntegrityDebugScreen />} />
      </Route>

      {/* Public Routes (no authentication required) */}
      <Route path="/organizer/:id" element={<OrganizerPublicScreen />} />
      <Route path="/profile/organizer" element={<OrganizerProfileLiveNew />} />
      <Route path="/profile/academy" element={<AcademyProfileLive />} />
      {/** Public user profile by id route removed */}
      <Route path="/profile/user/edit" element={<UserProfileEditor />} />
      
      {/* Social and Date Live Routes */}
      <Route path="/social/:id" element={<EventParentPublicScreenModern />} />
      <Route path="/social/fecha/:id" element={<DateLiveScreen />} />
      
      {/* Brand Public Route */}
      <Route path="/marca/:brandId" element={<BrandPublicScreen />} />
      
      {/* Academy Public Route */}
      <Route path="/academia/:academyId" element={<AcademyPublicScreen />} />
      
      {/* Legacy event routes */}
      <Route path="/events/parent/:id" element={<EventParentPublicScreenModern />} />
      <Route path="/events/date/:id" element={<EventPublicScreen />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/app/profile" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}