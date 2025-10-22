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

// Sprint 2 - Event screens
import { OrganizerEditScreen } from './screens/events/OrganizerEditScreen';
import { OrganizerPublicScreen } from './screens/events/OrganizerPublicScreen';
import { EventParentEditScreen } from './screens/events/EventParentEditScreen';
import { EventParentPublicScreen } from './screens/events/EventParentPublicScreen';
import { EventDateEditScreen } from './screens/events/EventDateEditScreen';
import { EventDatePublicScreen } from './screens/events/EventDatePublicScreen';
import { MyRSVPsScreen } from './screens/events/MyRSVPsScreen';
import { EventCreateWizard } from './screens/events/EventCreateWizard';

// New unified event screens
import EventCreateScreen from './screens/events/EventCreateScreen';
import EventEditScreen from './screens/events/EventEditScreen';
import EventPublicScreen from './screens/events/EventPublicScreen';

// Sprint 3 - Profile editors
import { EventEditor } from './screens/profile/EventEditor';
import { EventDateEditor } from './screens/profile/EventDateEditor';
import { OrganizerEditor } from './screens/profile/OrganizerEditor';
import { OrganizerProfileLive as OrganizerProfileLiveNew } from './screens/profile/OrganizerProfileLive';
import { OrganizerProfileEditor } from './screens/profile/OrganizerProfileEditor';
import { OrganizerDashboardDates } from './screens/profile/OrganizerDashboardDates';
import UserPublicProfile from './screens/profile/UserPublicProfile';

// Sprint 3 - Explore/Search
import ExploreHomeScreen from './screens/explore/ExploreHomeScreen';
import ExploreListScreen from './screens/explore/ExploreListScreen';

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
        <Route path="/app/profile/edit" element={<Profile />} />
        
        {/* Event Creation Wizard */}
        <Route path="/events/new" element={<EventCreateWizard />} />
        
        {/* New Unified Event Routes */}
        <Route path="/events/create" element={<EventCreateScreen />} />
        <Route path="/events/date/:dateId/edit" element={<EventEditScreen />} />

        {/* Sprint 3 - New Profile Routes */}
        <Route path="/profile/organizer/edit" element={<OrganizerProfileEditor />} />
        
        {/* Organizer Event Editors */}
        <Route path="/profile/organizer/events/new" element={<EventEditor />} />
        <Route path="/profile/organizer/events/:id" element={<EventEditor />} />
        <Route path="/profile/organizer/date/new/:parentId" element={<EventDateEditor />} />
        <Route path="/profile/organizer/date/:id" element={<EventDateEditor />} />

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

        {/* Explore/Search Routes */}
        <Route path="/explore" element={<ExploreHomeScreen />} />
        <Route path="/explore/list" element={<ExploreListScreen />} />
      </Route>

      {/* Public Routes (no authentication required) */}
      <Route path="/organizer/:id" element={<OrganizerPublicScreen />} />
      <Route path="/profile/organizer" element={<OrganizerProfileLiveNew />} />
      <Route path="/u/:id" element={<UserPublicProfile />} />
      <Route path="/events/parent/:id" element={<EventParentPublicScreen />} />
      
      {/* New unified public event view */}
      <Route path="/events/date/:id" element={<EventPublicScreen />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/app/profile" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}