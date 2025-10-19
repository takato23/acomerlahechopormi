import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
// Mock del utilitario para la API key
vi.mock('@/utils/getGeminiApiKey', () => ({
  getGeminiApiKey: () => 'mock-api-key',
}));

import RecipeListPage from '../pages/RecipeListPage';
import React from 'react';

// Mock de dependencias externas como sonner, API, etc.
vi.mock('sonner', () => ({ toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() } }));

describe('RecipeListPage - Generación de recetas y feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra error si el input está vacío y no se marca 'usar despensa'", async () => {
    render(<RecipeListPage />);
    const botonGenerar = screen.getByRole('button', { name: /generar/i });
    fireEvent.click(botonGenerar);
    await waitFor(() => {
      expect(screen.getByText(/introduce una descripción/i)).toBeInTheDocument();
    });
  });

  it('muestra error si la despensa está vacía y se intenta sugerir desde despensa', async () => {
    // Suponiendo que hay un estado o prop que simula despensa vacía
    render(<RecipeListPage pantryItems={[]} />);
    const checkbox = screen.getByLabelText(/usar ingredientes de mi despensa/i);
    fireEvent.click(checkbox);
    const botonGenerar = screen.getByRole('button', { name: /generar/i });
    fireEvent.click(botonGenerar);
    await waitFor(() => {
      expect(screen.getByText(/tu despensa está vacía/i)).toBeInTheDocument();
    });
  });

  it('muestra feedback de éxito si la generación es exitosa', async () => {
    // Simular respuesta exitosa de la API
    // Aquí deberías mockear la función que realiza la llamada a la API
    render(<RecipeListPage />);
    const input = screen.getByPlaceholderText(/describe tu receta/i);
    fireEvent.change(input, { target: { value: 'tarta de manzana' } });
    const botonGenerar = screen.getByRole('button', { name: /generar/i });
    fireEvent.click(botonGenerar);
    await waitFor(() => {
      expect(screen.getByText(/receta generada/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error si la API falla', async () => {
    // Simular error de API
    render(<RecipeListPage />);
    const input = screen.getByPlaceholderText(/describe tu receta/i);
    fireEvent.change(input, { target: { value: 'tarta de manzana' } });
    const botonGenerar = screen.getByRole('button', { name: /generar/i });
    fireEvent.click(botonGenerar);
    await waitFor(() => {
      expect(screen.getByText(/ocurrió un error/i)).toBeInTheDocument();
    });
  });
});
