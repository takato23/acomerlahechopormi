import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Para interacciones más realistas
import '@testing-library/jest-dom';
import { InteractivePreview } from '../InteractivePreview';
import { ParsedPantryInput } from '../../lib/pantryParser';
import { CreatePantryItemData } from '../../types'; // Importar tipo necesario
import { jest } from '@jest/globals';

// Mockear dependencias que no son relevantes para el test del componente en sí
jest.mock('../../lib/categorySuggestor', () => ({
  suggestCategory: () => 'meat', // Devolver valor directamente
}));
jest.mock('../../pantryService', () => ({
  addPantryItem: async () => {}, // Función async vacía
}));
jest.mock('sonner', () => ({
  toast: {
    success: () => {}, // Funciones vacías
    error: () => {},
    info: () => {},
  },
}));
jest.mock('@/components/ui/Spinner', () => ({
    Spinner: () => <div data-testid="spinner">Loading...</div>
}));
// Mockear Accordion para simplificar tests (opcional, pero puede ayudar)
// jest.mock('@/components/ui/accordion', () => ({
//     Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
//     AccordionItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
//     AccordionTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
//     AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
// }));


const mockInitialData: ParsedPantryInput = {
  quantity: 2,
  unit: 'kg',
  ingredientName: 'Pollo',
};

const mockCategories = [
  { id: 'meat', name: 'Carnes y Pescados' },
  { id: 'vegetables', name: 'Verduras y Frutas' },
  { id: 'dairy', name: 'Lácteos y Huevos' },
];

describe('InteractivePreview', () => {
  // Añadir tipo explícito a la declaración del mock
  // Corregir tipo de mock para usar solo la firma de la función
  let mockOnConfirm: jest.Mock<(itemData: CreatePantryItemData, addAnother: boolean) => Promise<void>>;
  let mockOnCancel: jest.Mock;
  let mockOnEditDetails: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Volver a la definición async y confiar en el tipo explícito de arriba
    mockOnConfirm = jest.fn(async () => {});
    mockOnCancel = jest.fn(); // Mantener jest.fn aquí
    mockOnEditDetails = jest.fn(); // Mantener jest.fn aquí
  });

  test('renders initial data correctly', () => {
    render(
      <InteractivePreview
        initialData={mockInitialData}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm} // Eliminar cast
        onCancel={mockOnCancel}
        onEditDetails={mockOnEditDetails}
      />
    );

    expect(screen.getByText('Pollo')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
    // Verifica que la categoría sugerida (mockeada como 'meat') esté seleccionada
    expect(screen.getByRole('combobox')).toHaveTextContent('Carnes y Pescados');
  });

   test('renders fallback indicator if usedFallback is true', () => {
    render(
      <InteractivePreview
        initialData={{ ...mockInitialData, ingredientName: 'Algo Raro' }}
        usedFallback={true}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm} // Eliminar cast
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('(Nombre inferido)')).toBeInTheDocument();
  });

  test('allows changing the category', async () => {
    render(
      <InteractivePreview
        initialData={mockInitialData}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm} // Eliminar cast
        onCancel={mockOnCancel}
        onEditDetails={mockOnEditDetails}
      />
    );

    const selectTrigger = screen.getByRole('combobox');
    await userEvent.click(selectTrigger); // Abrir el select

    // Esperar a que las opciones aparezcan y seleccionar una nueva
    const option = await screen.findByRole('option', { name: 'Verduras y Frutas' });
    await userEvent.click(option);

    // Verificar que el valor seleccionado cambió
    expect(selectTrigger).toHaveTextContent('Verduras y Frutas');
  });

  test('allows entering expiry date when details are expanded', async () => {
     render(
       <InteractivePreview
         initialData={mockInitialData}
         availableCategories={mockCategories}
         onConfirm={mockOnConfirm} // Eliminar cast
         onCancel={mockOnCancel}
         onEditDetails={mockOnEditDetails}
       />
     );

     // Encontrar y hacer clic en el trigger del acordeón
     const accordionTrigger = screen.getByRole('button', { name: /Añadir Detalles/i });
     await userEvent.click(accordionTrigger);

     // Esperar a que el input de fecha sea visible y escribir en él
     const dateInput = await screen.findByLabelText(/Fecha de Caducidad/i);
     expect(dateInput).toBeVisible(); // Asegurarse que está visible
     fireEvent.change(dateInput, { target: { value: '2025-12-31' } });
     expect(dateInput).toHaveValue('2025-12-31');
   });


  test('calls onConfirm with correct data when "Confirmar" is clicked', async () => {
    render(
      <InteractivePreview
        initialData={mockInitialData}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm} // Eliminar cast
        onCancel={mockOnCancel}
        onEditDetails={mockOnEditDetails}
      />
    );

    // Cambiar categoría y fecha para verificar que se envían los datos actualizados
    const selectTrigger = screen.getByRole('combobox');
    await userEvent.click(selectTrigger);
    const option = await screen.findByRole('option', { name: 'Verduras y Frutas' });
    await userEvent.click(option);

    const accordionTrigger = screen.getByRole('button', { name: /Añadir Detalles/i });
    await userEvent.click(accordionTrigger);
    const dateInput = await screen.findByLabelText(/Fecha de Caducidad/i);
    fireEvent.change(dateInput, { target: { value: '2025-11-30' } });

    // Click Confirmar (el que cierra)
    const confirmButton = screen.getByRole('button', { name: /^Confirmar$/i }); // Regex para evitar "Confirmar y Añadir Otro"
    await userEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredient_name: 'Pollo',
        quantity: 2,
        unit: 'kg',
        category_id: 'vegetables', // Categoría cambiada
        expiry_date: '2025-11-30', // Fecha añadida
      }),
      false // addAnother = false
    );
  });

   test('calls onConfirm with addAnother=true when "Confirmar y Añadir Otro" is clicked', async () => {
    render(
      <InteractivePreview
        initialData={mockInitialData}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm} // Eliminar cast
        onCancel={mockOnCancel}
        onEditDetails={mockOnEditDetails}
      />
    );

    const confirmAddAnotherButton = screen.getByRole('button', { name: /Confirmar y Añadir Otro/i });
    await userEvent.click(confirmAddAnotherButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredient_name: 'Pollo',
        category_id: 'meat', // Categoría sugerida por defecto
        expiry_date: null, // Sin fecha
      }),
      true // addAnother = true
    );
  });

  test('calls onCancel when cancel button is clicked', async () => {
    render(
      <InteractivePreview
        initialData={mockInitialData}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm} // Eliminar cast
        onCancel={mockOnCancel}
        onEditDetails={mockOnEditDetails}
      />
    );
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await userEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onEditDetails when "Editar Detalles" button is clicked', async () => {
    render(
      <InteractivePreview
        initialData={mockInitialData}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm} // Eliminar cast
        onCancel={mockOnCancel}
        onEditDetails={mockOnEditDetails} // Pasar el mock
      />
    );
    const editButton = screen.getByRole('button', { name: /Editar Detalles/i });
    await userEvent.click(editButton);
    expect(mockOnEditDetails).toHaveBeenCalledTimes(1);
    expect(mockOnEditDetails).toHaveBeenCalledWith(
        expect.objectContaining({
            ingredient_name: 'Pollo',
            category_id: 'meat', // Categoría sugerida
        })
    );
  });

   test('does not render edit button if onEditDetails is not provided', () => {
    render(
      <InteractivePreview
        initialData={mockInitialData}
        availableCategories={mockCategories}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        // No onEditDetails prop
      />
    );
    expect(screen.queryByRole('button', { name: /Editar Detalles/i })).not.toBeInTheDocument();
  });

});