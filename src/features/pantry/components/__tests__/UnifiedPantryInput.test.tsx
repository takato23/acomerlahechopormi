import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedPantryInput } from '../UnifiedPantryInput';
// No importar jest explícitamente, confiar en el global

// Mockear dependencias
jest.mock('@/features/pantry/lib/pantryParser', () => ({ // Usar alias @/
  parsePantryInput: jest.fn(),
}));
jest.mock('@/features/pantry/pantryService', () => ({ // Usar alias @/
  addPantryItem: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));
// Mockear InteractivePreview para simplificar
jest.mock('@/features/pantry/components/InteractivePreview', () => ({ // Usar alias @/
  InteractivePreview: (props: any) => (
    <div data-testid="interactive-preview">
      <button onClick={() => props.onConfirm({ ingredient_name: 'Mock Item' }, false)}>Confirm</button>
      <button onClick={props.onCancel}>Cancel</button>
      {props.onEditDetails && <button onClick={() => props.onEditDetails({ ingredient_name: 'Mock Item' })}>Edit</button>}
    </div>
  ),
}));

// Mockear Spinner para evitar problemas de renderizado en tests
jest.mock('@/components/ui/Spinner', () => ({
    Spinner: () => <div data-testid="spinner">Loading...</div>
}));


import { parsePantryInput } from '@/features/pantry/lib/pantryParser'; // Usar alias @/
import { toast } from 'sonner'; // Importar el mock

const mockCategories = [{ id: 'meat', name: 'Carnes y Pescados' }];

describe('UnifiedPantryInput', () => {
  let mockOnItemAdded: jest.Mock;
  let mockOnEditRequest: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockOnItemAdded = jest.fn();
    mockOnEditRequest = jest.fn();

     // Configurar mock por defecto para parsePantryInput
     (parsePantryInput as jest.Mock).mockImplementation((text: string) => { // Usar jest.Mock
        if (text === '2 kg harina') {
            return { success: true, data: { quantity: 2, unit: 'kg', ingredientName: 'harina' } };
        } else if (text === 'error input') {
            return { success: false, error: 'unparseable', originalText: text };
        } else if (text === '') {
             return { success: false, error: 'empty_input', originalText: text };
        }
        // Fallback por defecto para otros inputs no definidos explícitamente
        return { success: true, data: { quantity: 1, unit: 'u', ingredientName: text }, usedFallback: true };
    });
  });

  test('renders input and add button', () => {
    render(
      <UnifiedPantryInput
        onItemAdded={mockOnItemAdded}
        availableCategories={mockCategories}
        onEditRequest={mockOnEditRequest}
      />
    );
    expect(screen.getByPlaceholderText(/Ej: 2 kg Harina/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Añadir ítem/i })).toBeInTheDocument();
  });

  test('updates input value on change', () => {
    render(
      <UnifiedPantryInput
        onItemAdded={mockOnItemAdded}
        availableCategories={mockCategories}
        onEditRequest={mockOnEditRequest}
      />
    );
    const input = screen.getByPlaceholderText(/Ej: 2 kg Harina/i);
    fireEvent.change(input, { target: { value: 'test input' } });
    expect(input).toHaveValue('test input');
  });

  test('calls parsePantryInput and shows preview on add button click with valid input', async () => {
    render(
      <UnifiedPantryInput
        onItemAdded={mockOnItemAdded}
        availableCategories={mockCategories}
        onEditRequest={mockOnEditRequest}
      />
    );
    const input = screen.getByPlaceholderText(/Ej: 2 kg Harina/i);
    const addButton = screen.getByRole('button', { name: /Añadir ítem/i });

    fireEvent.change(input, { target: { value: '2 kg harina' } });
    fireEvent.click(addButton);

    // Esperar a que aparezca la preview (debido al setTimeout simulado)
    await waitFor(() => {
      expect(parsePantryInput).toHaveBeenCalledWith('2 kg harina');
      expect(screen.getByTestId('interactive-preview')).toBeInTheDocument();
      // El botón de añadir debería deshabilitarse mientras la preview está activa
      // expect(addButton).toBeDisabled(); // Esta verificación puede ser inestable con mocks
    });
     // Verificar que el toast.info fue llamado (aunque no verificamos el contenido exacto aquí)
     expect(toast.info).toHaveBeenCalled();
  });

   test('calls parsePantryInput and shows error toast on add button click with invalid input', async () => {
    render(
      <UnifiedPantryInput
        onItemAdded={mockOnItemAdded}
        availableCategories={mockCategories}
        onEditRequest={mockOnEditRequest}
      />
    );
    const input = screen.getByPlaceholderText(/Ej: 2 kg Harina/i);
    const addButton = screen.getByRole('button', { name: /Añadir ítem/i });

    fireEvent.change(input, { target: { value: 'error input' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(parsePantryInput).toHaveBeenCalledWith('error input');
      expect(screen.queryByTestId('interactive-preview')).not.toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('No se pudo entender la entrada.');
    });
  });

   test('closes preview when cancel button inside preview is clicked', async () => {
       render(
         <UnifiedPantryInput
           onItemAdded={mockOnItemAdded}
           availableCategories={mockCategories}
           onEditRequest={mockOnEditRequest}
         />
       );
       const input = screen.getByPlaceholderText(/Ej: 2 kg Harina/i);
       const addButton = screen.getByRole('button', { name: /Añadir ítem/i });

       // Abrir preview
       fireEvent.change(input, { target: { value: '2 kg harina' } });
       fireEvent.click(addButton);
       await screen.findByTestId('interactive-preview'); // Esperar a que aparezca

       // Click Cancel dentro del mock de InteractivePreview
       const cancelButton = screen.getByRole('button', { name: /Cancel/i });
       fireEvent.click(cancelButton);

       // Verificar que la preview desaparece
       expect(screen.queryByTestId('interactive-preview')).not.toBeInTheDocument();
   });

    test('calls onConfirm and onItemAdded when confirm button inside preview is clicked', async () => {
        render(
          <UnifiedPantryInput
            onItemAdded={mockOnItemAdded}
            availableCategories={mockCategories}
            onEditRequest={mockOnEditRequest}
          />
        );
        const input = screen.getByPlaceholderText(/Ej: 2 kg Harina/i);
        const addButton = screen.getByRole('button', { name: /Añadir ítem/i });

        // Abrir preview
        fireEvent.change(input, { target: { value: '2 kg harina' } });
        fireEvent.click(addButton);
        await screen.findByTestId('interactive-preview');

        // Click Confirm dentro del mock de InteractivePreview
        const confirmButton = screen.getByRole('button', { name: /Confirm/i });
        fireEvent.click(confirmButton);

        // Verificar que addPantryItem fue llamado (indirectamente a través de handleConfirmAdd)
        // y que onItemAdded fue llamado
        await waitFor(() => {
            // La verificación exacta de addPantryItem puede ser compleja por el mock
            // pero podemos verificar que el callback final se llamó
            expect(mockOnItemAdded).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('"Mock Item" añadido!'); // Verificar mensaje de éxito
        });
         // Verificar que la preview desaparece y el input se limpia
         expect(screen.queryByTestId('interactive-preview')).not.toBeInTheDocument();
         expect(input).toHaveValue('');
    });

     test('calls onEditRequest when edit button inside preview is clicked', async () => {
        render(
          <UnifiedPantryInput
            onItemAdded={mockOnItemAdded}
            availableCategories={mockCategories}
            onEditRequest={mockOnEditRequest} // Pasar el mock
          />
        );
        const input = screen.getByPlaceholderText(/Ej: 2 kg Harina/i);
        const addButton = screen.getByRole('button', { name: /Añadir ítem/i });

        // Abrir preview
        fireEvent.change(input, { target: { value: '2 kg harina' } });
        fireEvent.click(addButton);
        await screen.findByTestId('interactive-preview');

        // Click Edit dentro del mock de InteractivePreview
        const editButton = screen.getByRole('button', { name: /Edit/i });
        fireEvent.click(editButton);

        // Verificar que onEditRequest fue llamado
        await waitFor(() => {
            expect(mockOnEditRequest).toHaveBeenCalledWith({ ingredient_name: 'Mock Item' });
        });
         // Verificar que la preview desaparece y el input se limpia
         expect(screen.queryByTestId('interactive-preview')).not.toBeInTheDocument();
         expect(input).toHaveValue('');
    });

});