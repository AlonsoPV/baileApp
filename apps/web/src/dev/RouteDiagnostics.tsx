import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius } from '@/theme/colors';
import { routes, routeHelpers } from '@/routes/registry';

export default function RouteDiagnostics() {
  const location = useLocation();
  const navigate = useNavigate();
  const [testId, setTestId] = useState('1');

  const sampleRoutes = [
    { label: 'App Home', path: routes.app.home },
    { label: 'App Profile', path: routes.app.profile },
    { label: 'App Explore', path: routes.app.explore },
    { label: 'Auth Login', path: routes.auth.login },
    { label: 'Auth Signup', path: routes.auth.signup },
    { label: 'Onboarding Basics', path: routes.onboarding.basics },
    { label: 'Onboarding Ritmos', path: routes.onboarding.ritmos },
    { label: 'Onboarding Zonas', path: routes.onboarding.zonas },
    { label: 'Organizer Edit', path: routes.organizer.edit },
    { label: 'Organizer Live', path: routes.organizer.live(testId) },
    { label: 'Organizer Event New', path: routes.organizer.eventParentEdit() },
    { label: 'Organizer Event Edit', path: routes.organizer.eventParentEdit(testId) },
    { label: 'Organizer Date New', path: routes.organizer.eventDateEdit() },
    { label: 'Organizer Date Edit', path: routes.organizer.eventDateEdit(testId) },
    { label: 'Event Parent Live', path: routes.organizer.eventParentLive(testId) },
    { label: 'Event Date Live', path: routes.organizer.eventDateLive(testId) },
    { label: 'Academy Edit', path: routes.academy.edit },
    { label: 'Academy Live', path: routes.academy.live(testId) },
    { label: 'Teacher Edit', path: routes.teacher.edit },
    { label: 'Teacher Live', path: routes.teacher.live(testId) },
    { label: 'Brand Edit', path: routes.brand.edit },
    { label: 'Brand Live', path: routes.brand.live(testId) },
    { label: 'User Live', path: routes.user.live(testId) },
    { label: '404 Page', path: routes.misc.notFound },
    { label: 'Unauthorized', path: routes.misc.unauthorized },
  ];

  const breadcrumbs = routeHelpers.getBreadcrumbs(location.pathname);

  return (
    <div style={{
      padding: spacing[6],
      background: colors.gradients.app,
      minHeight: '100vh',
      color: colors.light
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          marginBottom: spacing[6],
          color: colors.primary[500]
        }}>
          🔧 Route Diagnostics
        </h1>

        {/* Current Location Info */}
        <div style={{
          background: colors.glass.light,
          borderRadius: borderRadius.lg,
          padding: spacing[6],
          marginBottom: spacing[6],
          border: `1px solid ${colors.glass.medium}`,
          boxShadow: colors.shadows.glass
        }}>
          <h2 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[4],
            color: colors.light
          }}>
            Current Location
          </h2>
          <p style={{
            fontSize: typography.fontSize.base,
            marginBottom: spacing[2],
            fontFamily: 'monospace',
            background: colors.dark[600],
            padding: spacing[2],
            borderRadius: borderRadius.md,
            color: colors.primary[400]
          }}>
            {location.pathname}
          </p>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary
          }}>
            Search: {location.search || 'none'} | Hash: {location.hash || 'none'}
          </p>
        </div>

        {/* Breadcrumbs */}
        <div style={{
          background: colors.glass.light,
          borderRadius: borderRadius.lg,
          padding: spacing[6],
          marginBottom: spacing[6],
          border: `1px solid ${colors.glass.medium}`,
          boxShadow: colors.shadows.glass
        }}>
          <h2 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[4],
            color: colors.light
          }}>
            Breadcrumbs
          </h2>
          <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                <button
                  onClick={() => navigate(crumb.path)}
                  style={{
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.md,
                    background: index === breadcrumbs.length - 1 ? colors.primary[500] : colors.glass.medium,
                    color: colors.light,
                    border: 'none',
                    fontSize: typography.fontSize.sm,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (index !== breadcrumbs.length - 1) {
                      e.currentTarget.style.background = colors.primary[500];
                    }
                  }}
                  onMouseOut={(e) => {
                    if (index !== breadcrumbs.length - 1) {
                      e.currentTarget.style.background = colors.glass.medium;
                    }
                  }}
                >
                  {crumb.label}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span style={{ color: colors.text.secondary }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Test ID Input */}
        <div style={{
          background: colors.glass.light,
          borderRadius: borderRadius.lg,
          padding: spacing[6],
          marginBottom: spacing[6],
          border: `1px solid ${colors.glass.medium}`,
          boxShadow: colors.shadows.glass
        }}>
          <h2 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[4],
            color: colors.light
          }}>
            Test ID
          </h2>
          <input
            type="text"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            placeholder="Enter test ID"
            style={{
              padding: spacing[3],
              borderRadius: borderRadius.md,
              background: colors.dark[600],
              border: `1px solid ${colors.glass.medium}`,
              color: colors.light,
              fontSize: typography.fontSize.base,
              width: '200px'
            }}
          />
        </div>

        {/* Route Links */}
        <div style={{
          background: colors.glass.light,
          borderRadius: borderRadius.lg,
          padding: spacing[6],
          border: `1px solid ${colors.glass.medium}`,
          boxShadow: colors.shadows.glass
        }}>
          <h2 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[4],
            color: colors.light
          }}>
            Available Routes
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: spacing[4]
          }}>
            {sampleRoutes.map((route) => (
              <button
                key={route.path}
                onClick={() => navigate(route.path)}
                style={{
                  padding: spacing[4],
                  borderRadius: borderRadius.lg,
                  background: route.path === location.pathname ? colors.primary[500] : colors.glass.medium,
                  color: colors.light,
                  border: 'none',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[1]
                }}
                onMouseOver={(e) => {
                  if (route.path !== location.pathname) {
                    e.currentTarget.style.background = colors.primary[600];
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (route.path !== location.pathname) {
                    e.currentTarget.style.background = colors.glass.medium;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={{ fontWeight: typography.fontWeight.semibold }}>
                  {route.label}
                </span>
                <span style={{
                  fontSize: typography.fontSize.xs,
                  opacity: 0.8,
                  fontFamily: 'monospace'
                }}>
                  {route.path}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
