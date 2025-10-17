import { render } from '@testing-library/react';
import { VirtualizedShoppingList } from '../VirtualizedShoppingList';
import type { ShoppingListUIItem } from '@/stores/shoppingListStore';
import { act } from 'react';

const mockOnDragEndHandlers: Array<(event: any) => void> = [];

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 60,
    getVirtualItems: () =>
      Array.from({ length: count }).map((_, index) => ({
        index,
        key: index,
        start: index * 60,
        size: 60,
      })),
  }),
}));

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: any) => void }) => {
    mockOnDragEndHandlers.push(onDragEnd);
    return <div data-testid="dnd-context">{children}</div>;
  },
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
  arrayMove: <T,>(items: T[], from: number, to: number) => {
    const clone = [...items];
    const [moved] = clone.splice(from, 1);
    clone.splice(to, 0, moved);
    return clone;
  },
  verticalListSortingStrategy: jest.fn(),
}));

const createItem = (overrides: Partial<ShoppingListUIItem>): ShoppingListUIItem => ({
  id: overrides.id ?? crypto.randomUUID(),
  user_id: overrides.user_id ?? 'user-1',
  name: overrides.name ?? 'Item',
  quantity: overrides.quantity ?? null,
  unit: overrides.unit ?? null,
  is_purchased: overrides.is_purchased ?? false,
  notes: overrides.notes ?? null,
  created_at: overrides.created_at ?? new Date().toISOString(),
  updated_at: overrides.updated_at ?? new Date().toISOString(),
  category_id: overrides.category_id ?? null,
  category_label: overrides.category_label ?? null,
});

describe('VirtualizedShoppingList', () => {
  beforeEach(() => {
    mockOnDragEndHandlers.length = 0;
  });

  it('renders virtualized rows without drag-and-drop support', () => {
    const items = [
      createItem({ id: '1', name: 'Tomate', is_purchased: false }),
      createItem({ id: '2', name: 'Queso', is_purchased: false }),
      createItem({ id: '3', name: 'Pan', is_purchased: true }),
    ];

    const { getByLabelText } = render(
      <VirtualizedShoppingList
        items={items}
        onToggleItem={jest.fn()}
        onDeleteItem={jest.fn()}
        onShowPriceDetails={jest.fn()}
        onRefreshItemPrice={jest.fn()}
        pricingByItemId={{}}
        selectedPriceItemId={null}
        onManualOrderChange={jest.fn()}
        isReorderEnabled
        emptyState={null}
      />
    );

    expect(getByLabelText('Marcar Tomate')).toBeInTheDocument();
    expect(mockOnDragEndHandlers).toHaveLength(0);
  });
});
