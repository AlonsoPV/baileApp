/**
 * Centralized Route Registry
 * 
 * All application routes are defined here with strict typing to prevent typos
 * and ensure consistent navigation throughout the app.
 */

export const routes = {
  root: '/',
  
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    pin: '/auth/pin',
    pinSetup: '/auth/pin/setup',
  },
  
  onboarding: {
    basics: '/onboarding/basics',
    ritmos: '/onboarding/ritmos',
    zonas: '/onboarding/zonas',
  },
  
  app: {
    home: '/app',
    profile: '/app/profile', // perfil propio
    explore: '/app/explore',
  },
  
  user: {
    live: (userId: string) => `/u/${userId}`,
  },
  
  organizer: {
    edit: '/organizador/editar',
    live: (organizerId: number | string) => `/organizador/${organizerId}`,
    eventParentEdit: (parentId?: number | string) =>
      parentId ? `/organizador/evento/${parentId}/editar` : `/organizador/evento/nuevo`,
    eventDateEdit: (dateId?: number | string) =>
      dateId ? `/organizador/fecha/${dateId}/editar` : `/organizador/fecha/nueva`,
    eventParentLive: (parentId: number | string) => `/evento/${parentId}`,
    eventDateLive: (dateId: number | string) => `/evento/fecha/${dateId}`,
  },
  
  academy: {
    edit: '/academia/editar',
    live: (academyId: number | string) => `/academia/${academyId}`,
  },
  
  teacher: {
    edit: '/maestro/editar',
    live: (teacherId: number | string) => `/maestro/${teacherId}`,
  },
  
  brand: {
    edit: '/marca/editar',
    live: (brandId: number | string) => `/marca/${brandId}`,
  },
  
  misc: {
    notFound: '/404',
    unauthorized: '/unauthorized',
  },
} as const;

export type AppRouteKeys = keyof typeof routes;

// Helper functions for common navigation patterns
export const routeHelpers = {
  // Check if current path matches a route pattern
  isCurrentRoute: (pathname: string, route: string) => {
    return pathname === route || pathname.startsWith(route + '/');
  },
  
  // Get route parameters from pathname
  getRouteParams: (pathname: string, pattern: string) => {
    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');
    
    if (patternParts.length !== pathParts.length) return null;
    
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    
    return params;
  },
  
  // Generate breadcrumbs for current route
  getBreadcrumbs: (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Inicio', path: '/' }];
    
    let currentPath = '';
    for (const part of parts) {
      currentPath += `/${part}`;
      
      // Map route segments to readable labels
      const label = routeLabels[part] || part;
      breadcrumbs.push({ label, path: currentPath });
    }
    
    return breadcrumbs;
  },
};

// Route labels for breadcrumbs and UI
const routeLabels: Record<string, string> = {
  'auth': 'Autenticación',
  'login': 'Iniciar sesión',
  'signup': 'Registrarse',
  'onboarding': 'Configuración inicial',
  'basics': 'Información básica',
  'ritmos': 'Ritmos',
  'zonas': 'Zonas',
  'app': 'Aplicación',
  'profile': 'Mi perfil',
  'explore': 'Explorar',
  'organizador': 'Organizador',
  'editar': 'Editar',
  'evento': 'Evento',
  'fecha': 'Fecha',
  'nuevo': 'Nuevo',
  'academia': 'Academia',
  'maestro': 'Maestro',
  'marca': 'Marca',
  'u': 'Usuario',
};
