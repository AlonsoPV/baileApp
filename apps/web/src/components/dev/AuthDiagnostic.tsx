import { useAuth } from '@/contexts/AuthProvider';

export default function AuthDiagnostic() {
  try {
    const { user, loading } = useAuth();
    if (import.meta.env.DEV) {
      console.log('[AuthDiagnostic]', { uid: user?.id, loading });
    }
    return null;
  } catch (e) {
    console.error('❌ Auth FAIL:', e);
    return import.meta.env.DEV ? (
      <div style={{
        position: 'fixed', 
        top: 8, 
        right: 8, 
        background: 'crimson',
        color: 'white', 
        padding: '8px 12px', 
        borderRadius: 8, 
        zIndex: 9999,
        fontSize: '0.875rem',
        fontWeight: '600'
      }}>
        ❌ Auth Error — revisa consola
      </div>
    ) : null;
  }
}
