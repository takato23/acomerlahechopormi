import { render, screen } from '@testing-library/react';
import PantryItemsView from './PantryItemsView';

const noop = () => {};

describe('PantryItemsView', () => {
  it('renders pantry skeleton while loading', () => {
    render(
      <PantryItemsView
        viewMode="list"
        processedItems={[]}
        isLoading={true}
        error={null}
        isSelectionMode={false}
        selectedItems={new Set()}
        onSelectItem={noop}
        onEditItem={noop}
        onDeleteItem={noop}
        onToggleFavorite={noop}
      />
    );

    expect(screen.getByTestId('pantry-skeleton')).toBeInTheDocument();
  });
});
