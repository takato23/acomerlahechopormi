import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnifiedPantryInput from '../UnifiedPantryInput';

jest.mock('@/features/pantry/lib/pantryParser', () => ({
  parsePantryInput: jest.fn(),
}));

jest.mock('@/features/pantry/pantryService', () => ({
  addPantryItem: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/features/pantry/components/InteractivePreview', () => ({
  InteractivePreview: (props: any) => (
    <div data-testid="interactive-preview">
      <button onClick={() => props.onConfirm({ ingredient_name: 'Mock Item' }, false)}>Confirm</button>
      <button onClick={props.onCancel}>Cancel</button>
      {props.onEditDetails && <button onClick={() => props.onEditDetails({ ingredient_name: 'Mock Item' })}>Edit</button>}
    </div>
  ),
}));

jest.mock('@/components/ui/Spinner', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>
}));

import { parsePantryInput } from '@/features/pantry/lib/pantryParser';
import { toast } from 'sonner';

const mockCategories = [{ id: 'meat', name: 'Carnes y Pescados' }];

describe('UnifiedPantryInput', () => {
  let mockOnItemAdded: jest.Mock;
  let mockOnEditRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnItemAdded = jest.fn();
    mockOnEditRequest = jest.fn();

    (parsePantryInput as jest.Mock).mockImplementation((text: string) => {
      if (text === '2 kg harina') {
        return { success: true, data: { quantity: 2, unit: 'kg', ingredientName: 'harina' } };
      } else if (text === 'error input') {
        return { success: false, error: 'unparseable', originalText: text };
      } else if (text === '') {
        return { success: false, error: 'empty_input', originalText: text };
      }
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

    await waitFor(() => {
      expect(parsePantryInput).toHaveBeenCalledWith('2 kg harina');
      expect(screen.getByTestId('interactive-preview')).toBeInTheDocument();
    });
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

    fireEvent.change(input, { target: { value: '2 kg harina' } });
    fireEvent.click(addButton);
    await screen.findByTestId('interactive-preview');

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

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

    fireEvent.change(input, { target: { value: '2 kg harina' } });
    fireEvent.click(addButton);
    await screen.findByTestId('interactive-preview');

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnItemAdded).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('"Mock Item" añadido!');
    });
    expect(screen.queryByTestId('interactive-preview')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  test('calls onEditRequest when edit button inside preview is clicked', async () => {
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
    await screen.findByTestId('interactive-preview');

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockOnEditRequest).toHaveBeenCalledWith({ ingredient_name: 'Mock Item' });
    });
    expect(screen.queryByTestId('interactive-preview')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
  });
});