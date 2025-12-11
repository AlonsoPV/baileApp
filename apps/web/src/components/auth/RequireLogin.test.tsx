import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RequireLogin from './RequireLogin';

// Mock de useAuth
vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

// Mock parcial de react-router-dom para capturar navigate/location
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/evento/123', search: '?from=test' }),
  };
});

const mockedUseAuth = require('@/contexts/AuthProvider').useAuth as unknown as ReturnType<typeof vi.fn>;

describe('RequireLogin - guard de autenticación para acciones críticas', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('con usuario logueado renderiza el child y permite ejecutar la acción (ej. RSVP)', () => {
    mockedUseAuth.mockReturnValue({ user: { id: 'user-1' } });

    const onClick = vi.fn();

    render(
      <MemoryRouter>
        <RequireLogin>
          <button onClick={onClick}>RSVP</button>
        </RequireLogin>
      </MemoryRouter>
    );

    const button = screen.getByText('RSVP');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('sin usuario logueado no ejecuta la acción y dispara el flujo de login (ej. RSVP)', () => {
    mockedUseAuth.mockReturnValue({ user: null });

    const onClick = vi.fn();

    render(
      <MemoryRouter>
        <RequireLogin>
          <button onClick={onClick}>RSVP</button>
        </RequireLogin>
      </MemoryRouter>
    );

    // En vez del botón original se muestra el CTA de login
    const loginButton = screen.getByRole('button', { name: /inicia sesión para continuar/i });
    fireEvent.click(loginButton);

    expect(onClick).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
      state: { from: '/evento/123?from=test' },
    });
  });

  it('con usuario logueado permite ejecutar acción de "Añadir a calendario"', () => {
    mockedUseAuth.mockReturnValue({ user: { id: 'user-1' } });

    const onClick = vi.fn();

    render(
      <MemoryRouter>
        <RequireLogin>
          <button onClick={onClick}>Añadir a calendario</button>
        </RequireLogin>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Añadir a calendario'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sin usuario logueado redirige al login en lugar de abrir WhatsApp', () => {
    mockedUseAuth.mockReturnValue({ user: null });

    const onClick = vi.fn();

    render(
      <MemoryRouter>
        <RequireLogin>
          <button onClick={onClick}>Contactar por WhatsApp</button>
        </RequireLogin>
      </MemoryRouter>
    );

    const loginButton = screen.getByRole('button', { name: /inicia sesión para continuar/i });
    fireEvent.click(loginButton);

    expect(onClick).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
      state: { from: '/evento/123?from=test' },
    });
  });
});

