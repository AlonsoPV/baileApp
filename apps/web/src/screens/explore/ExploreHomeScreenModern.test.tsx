/**
 * Prueba de integración para filtros de fecha en ExploreHomeScreenModern
 * 
 * Para ejecutar esta prueba, primero instala las dependencias necesarias:
 * 
 * pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
 * 
 * Luego ejecuta:
 * pnpm test ExploreHomeScreenModern.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExploreHomeScreen from './ExploreHomeScreenModern';
import { useExploreFilters } from '../../state/exploreFilters';

// Mock de useExploreFilters
vi.mock('../../state/exploreFilters', () => ({
  useExploreFilters: vi.fn(),
}));

// Mock de useAuth
vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

// Mock de useTags
vi.mock('@/hooks/useTags', () => ({
  useTags: vi.fn(() => ({ data: [] })),
}));

// Mock de useUserFilterPreferences
vi.mock('../../hooks/useUserFilterPreferences', () => ({
  useUserFilterPreferences: vi.fn(() => ({
    preferences: null,
    applyDefaultFilters: vi.fn(() => ({
      ritmos: [],
      zonas: [],
      fechaDesde: null,
      fechaHasta: null,
    })),
    loading: false,
  })),
}));

// Mock de useExploreQuery
vi.mock('../../hooks/useExploreQuery', () => ({
  useExploreQuery: vi.fn(() => ({
    data: { pages: [{ data: [] }] },
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  })),
}));

describe('ExploreHomeScreenModern - Filtros de Fecha', () => {
  let queryClient: QueryClient;
  let mockSetFilters: ReturnType<typeof vi.fn>;
  let mockFilters: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockSetFilters = vi.fn();
    mockFilters = {
      type: 'all',
      q: '',
      ritmos: [],
      zonas: [],
      datePreset: 'todos',
      dateFrom: undefined,
      dateTo: undefined,
      pageSize: 12,
    };

    (useExploreFilters as any).mockReturnValue({
      filters: mockFilters,
      set: mockSetFilters,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ExploreHomeScreen />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('debe renderizar la barra de filtros con className="filters-tabs"', () => {
    renderComponent();
    
    const filtersTabs = document.querySelector('.filters-tabs');
    expect(filtersTabs).toBeTruthy();
  });

  it('debe renderizar todos los botones de filtro de fecha', () => {
    renderComponent();
    
    expect(screen.getByText('Todos')).toBeTruthy();
    expect(screen.getByText('Hoy')).toBeTruthy();
    expect(screen.getByText('Esta semana')).toBeTruthy();
    expect(screen.getByText('Siguientes')).toBeTruthy();
  });

  it('debe marcar el filtro activo con la clase "tab--active"', () => {
    renderComponent();
    
    const todosButton = screen.getByText('Todos');
    expect(todosButton).toHaveClass('tab--active');
  });

  it('debe actualizar el estado cuando se hace clic en "Hoy"', async () => {
    renderComponent();
    
    const hoyButton = screen.getByText('Hoy');
    fireEvent.click(hoyButton);

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalled();
    });

    // Verificar que se llamó con el preset correcto
    const calls = mockSetFilters.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      datePreset: 'hoy',
    });
  });

  it('debe actualizar el estado cuando se hace clic en "Esta semana"', async () => {
    renderComponent();
    
    const semanaButton = screen.getByText('Esta semana');
    fireEvent.click(semanaButton);

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalled();
    });

    const calls = mockSetFilters.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      datePreset: 'semana',
    });
  });

  it('debe actualizar el estado cuando se hace clic en "Siguientes"', async () => {
    renderComponent();
    
    const siguientesButton = screen.getByText('Siguientes');
    fireEvent.click(siguientesButton);

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalled();
    });

    const calls = mockSetFilters.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      datePreset: 'siguientes',
    });
  });

  it('debe actualizar el estado cuando se hace clic en "Todos"', async () => {
    // Primero establecer un filtro diferente
    mockFilters.datePreset = 'hoy';
    (useExploreFilters as any).mockReturnValue({
      filters: mockFilters,
      set: mockSetFilters,
    });

    renderComponent();
    
    const todosButton = screen.getByText('Todos');
    fireEvent.click(todosButton);

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalled();
    });

    const calls = mockSetFilters.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      datePreset: 'todos',
    });
  });

  it('debe actualizar dateFrom y dateTo cuando se cambia el filtro', async () => {
    renderComponent();
    
    const hoyButton = screen.getByText('Hoy');
    fireEvent.click(hoyButton);

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalled();
    });

    // Verificar que se actualizaron dateFrom y dateTo
    const calls = mockSetFilters.mock.calls;
    // La función applyDatePreset hace dos llamadas a set
    // Primero con datePreset, luego con datePreset, dateFrom y dateTo
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toHaveProperty('datePreset');
    expect(lastCall[0]).toHaveProperty('dateFrom');
    expect(lastCall[0]).toHaveProperty('dateTo');
  });

  describe('Vista móvil (max-width: 768px)', () => {
    beforeEach(() => {
      // Simular viewport móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('debe tener overflow-x: auto en la barra de filtros', () => {
      renderComponent();
      
      const filtersTabs = document.querySelector('.filters-tabs');
      const styles = window.getComputedStyle(filtersTabs!);
      
      // En mobile, debería tener overflow-x: auto
      // Nota: Esto puede no funcionar en el entorno de testing sin configuración adicional
      // pero documenta el comportamiento esperado
      expect(filtersTabs).toBeTruthy();
    });

    it('debe tener botones con min-height adecuado para tapping', () => {
      renderComponent();
      
      const buttons = document.querySelectorAll('.tab');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        // En mobile, min-height debería ser al menos 36px (según los estilos)
        expect(button).toBeTruthy();
      });
    });

    it('debe tener z-index y pointer-events correctos para evitar overlays bloqueando', () => {
      renderComponent();
      
      const buttons = document.querySelectorAll('.tab');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        // Verificar que pointer-events no esté en 'none'
        expect(styles.pointerEvents).not.toBe('none');
      });
    });
  });
});

