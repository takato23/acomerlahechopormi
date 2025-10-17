import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FavoriteRecipesWidget } from './FavoriteRecipesWidget';

describe('FavoriteRecipesWidget', () => {
  it('shows skeleton while loading', () => {
    render(
      <MemoryRouter>
        <FavoriteRecipesWidget favoriteRecipes={[]} isLoading={true} error={null} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('favorite-recipes-skeleton')).toBeInTheDocument();
  });
});
