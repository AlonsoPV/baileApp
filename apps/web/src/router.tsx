import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RedirectIfAuthenticated } from './components/RedirectIfAuthenticated';
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

// Sprint 3 - Profile editors
import { EventEditor } from './screens/profile/EventEditor';
import { EventDateEditor } from './screens/profile/EventDateEditor';
import { OrganizerEditor } from './screens/profile/OrganizerEditor';
import { OrganizerProfileLive as OrganizerProfileLiveNew } from './screens/profile/OrganizerProfileLive';
import { OrganizerProfileEditor } from './screens/profile/OrganizerProfileEditor';
import { OrganizerDashboardDates } from './screens/profile/OrganizerDashboardDates';
import UserPublicProfile from './screens/profile/UserPublicProfile';

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

      {/* Onboarding Routes - Protected */}
      <Route
        path="/onboarding/basics"
        element={
          <ProtectedRoute>
            <ProfileBasics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/ritmos"
        element={
          <ProtectedRoute>
            <PickRitmos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/zonas"
        element={
          <ProtectedRoute>
            <PickZonas />
          </ProtectedRoute>
        }
      />

      {/* App Routes - Protected */}
      {/* Main Profile with Switch */}
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        }
      />
      
      {/* Legacy Profile Edit (keeping for compatibility) */}
      <Route
        path="/app/profile/edit"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Sprint 3 - New Profile Routes */}
      {/* Organizer Editor */}
      <Route
        path="/profile/organizer/edit"
        element={
          <ProtectedRoute>
            <OrganizerProfileEditor />
          </ProtectedRoute>
        }
      />
      
      {/* Organizer Event Editors */}
      <Route
        path="/profile/organizer/events/new"
        element={
          <ProtectedRoute>
            <EventEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/organizer/events/:id"
        element={
          <ProtectedRoute>
            <EventEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/organizer/date/new/:parentId"
        element={
          <ProtectedRoute>
            <EventDateEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/organizer/date/:id"
        element={
          <ProtectedRoute>
            <EventDateEditor />
          </ProtectedRoute>
        }
      />

      {/* Organizer Dashboard */}
      <Route
        path="/profile/organizer/dashboard/:id"
        element={
          <ProtectedRoute>
            <OrganizerDashboardDates />
          </ProtectedRoute>
        }
      />

      {/* Sprint 2 - Event Routes */}
      
      {/* Organizer Routes */}
      <Route
        path="/organizer/edit"
        element={
          <ProtectedRoute>
            <OrganizerEditScreen />
          </ProtectedRoute>
        }
      />
      
      {/* Organizer Public Routes */}
      <Route path="/organizer/:id" element={<OrganizerPublicScreen />} />
      <Route path="/profile/organizer" element={<OrganizerProfileLiveNew />} />

      {/* User Public Profile Route */}
      <Route path="/u/:id" element={<UserPublicProfile />} />

      {/* Event Parent Routes */}
      <Route
        path="/events/parent/new"
        element={
          <ProtectedRoute>
            <EventParentEditScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/parent/:id/edit"
        element={
          <ProtectedRoute>
            <EventParentEditScreen />
          </ProtectedRoute>
        }
      />
      
      {/* Event Parent Public Route */}
      <Route path="/events/parent/:id" element={<EventParentPublicScreen />} />

      {/* Event Parent Dashboard - Fechas */}
      <Route
        path="/events/parent/:id/dates"
        element={
          <ProtectedRoute>
            <OrganizerDashboardDates />
          </ProtectedRoute>
        }
      />

      {/* Event Date Routes */}
      <Route
        path="/events/date/new/:parentId"
        element={
          <ProtectedRoute>
            <EventDateEditScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/date/:id/edit"
        element={
          <ProtectedRoute>
            <EventDateEditScreen />
          </ProtectedRoute>
        }
      />
      
      {/* Event Date Public Route */}
      <Route path="/events/date/:id" element={<EventDatePublicScreen />} />

      {/* My RSVPs Route */}
      <Route
        path="/me/rsvps"
        element={
          <ProtectedRoute>
            <MyRSVPsScreen />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
