import { useCallback, useState } from 'react';
import { ratoneandoService, type RatoneandoProduct } from '../services/ratoneandoService';

export interface OfferResult {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPercentage: number | null;
  storeId: string;
  unit: string;
}

interface OffersSearchState {
  isSearching: boolean;
  results: OfferResult[];
  error: string | null;
  lastQuery: string | null;
}

const mapProductToOffer = (product: RatoneandoProduct): OfferResult => {
  const hasOriginal = typeof product.original_price === 'number' && product.original_price > 0;
  const hasDiscount = typeof product.discount_percentage === 'number';

  const computedDiscount = hasOriginal
    ? ((product.original_price! - product.price) / product.original_price!) * 100
    : null;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    price: product.price,
    originalPrice: hasOriginal ? product.original_price ?? null : null,
    discountPercentage: hasDiscount
      ? product.discount_percentage ?? computedDiscount
      : computedDiscount,
    storeId: product.store_id,
    unit: product.unit,
  };
};

export const useOffersSearch = () => {
  const [state, setState] = useState<OffersSearchState>({
    isSearching: false,
    results: [],
    error: null,
    lastQuery: null,
  });

  const searchOffers = useCallback(async (rawQuery: string, storeIds: string[] = []) => {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) {
      setState((prev) => ({ ...prev, results: [], error: null, lastQuery: null }));
      return;
    }

    setState((prev) => ({ ...prev, isSearching: true, error: null, lastQuery: trimmedQuery }));

    try {
      const products = await ratoneandoService.searchProducts(trimmedQuery, storeIds);
      const offers = products
        .filter((product) => {
          const hasDiscount = typeof product.discount_percentage === 'number' && product.discount_percentage > 0;
          const hasOriginal = typeof product.original_price === 'number' && product.original_price > product.price;
          return hasDiscount || hasOriginal;
        })
        .map(mapProductToOffer);

      setState({
        isSearching: false,
        results: offers,
        error: null,
        lastQuery: trimmedQuery,
      });
    } catch (error) {
      setState({
        isSearching: false,
        results: [],
        error: error instanceof Error ? error.message : 'No pudimos buscar ofertas.',
        lastQuery: trimmedQuery,
      });
    }
  }, []);

  return {
    ...state,
    searchOffers,
  };
};

export default useOffersSearch;
