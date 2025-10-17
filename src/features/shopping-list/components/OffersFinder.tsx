import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { useOffersSearch } from '../hooks/useOffersSearch';
import type { NearbyStore } from '../types/nearbyStore';

interface OffersFinderProps {
  selectedStore?: NearbyStore | null;
  nearbyStores?: NearbyStore[];
  defaultQuery?: string;
}

const SUGGESTED_TERMS = ['Leche', 'Aceite', 'Fideos', 'Arroz', 'Yerba'];

const getStoreLabel = (
  storeId: string,
  nearbyStores: NearbyStore[] | undefined,
) => {
  if (!storeId) return 'Tienda';
  const match = nearbyStores?.find(
    (store) => store.placeId === storeId || store.id === storeId,
  );
  return match?.name ?? storeId;
};

export const OffersFinder: React.FC<OffersFinderProps> = ({
  selectedStore,
  nearbyStores,
  defaultQuery,
}) => {
  const [query, setQuery] = useState(defaultQuery ?? '');
  const [hasAutofilled, setHasAutofilled] = useState(false);

  const { isSearching, results, error, lastQuery, searchOffers } = useOffersSearch();

  useEffect(() => {
    if (defaultQuery && !hasAutofilled) {
      setQuery(defaultQuery);
      setHasAutofilled(true);
    }
  }, [defaultQuery, hasAutofilled]);

  const handleSearch = useCallback(
    (term: string) => {
      const candidate = term.trim();
      if (!candidate) return;
      const storeId = selectedStore?.placeId ?? selectedStore?.id;
      searchOffers(candidate, storeId ? [storeId] : []);
    },
    [searchOffers, selectedStore],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSearch(query);
    },
    [handleSearch, query],
  );

  const nearbyStoresMemo = useMemo(() => nearbyStores ?? [], [nearbyStores]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-semibold">Buscador de ofertas</CardTitle>
          <p className="text-xs text-muted-foreground">
            Encontrá promociones vigentes en supermercados nacionales.
          </p>
          {selectedStore ? (
            <p className="text-xs text-primary" aria-live="polite">
              Priorizamos resultados cerca de {selectedStore.name}.
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej. yogur descremado"
            aria-label="Buscar ofertas"
          />
          <Button type="submit" className="sm:w-auto">
            {isSearching ? <Spinner className="mr-2" size="sm" /> : null}
            Buscar ofertas
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TERMS.map((term) => (
            <Button
              key={term}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                setQuery(term);
                handleSearch(term);
              }}
            >
              {term}
            </Button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {!error && !isSearching && lastQuery && results.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No encontramos promociones activas para "{lastQuery}". Probá con otro término o ampliá el radio de búsqueda.
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((offer) => {
              const storeLabel = getStoreLabel(offer.storeId, nearbyStoresMemo);
              const discount = offer.discountPercentage ? Math.round(offer.discountPercentage) : null;

              return (
                <div
                  key={offer.id}
                  className="rounded-md border bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-tight text-foreground">{offer.name}</p>
                      <p className="text-xs text-muted-foreground">{offer.brand}</p>
                      <p className="text-xs text-muted-foreground">{storeLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        ${offer.price.toFixed(2)}
                      </p>
                      {offer.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          ${offer.originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {discount ? (
                      <Badge variant="destructive">-{discount}%</Badge>
                    ) : (
                      <Badge variant="secondary">Precio destacado</Badge>
                    )}
                    {offer.unit ? (
                      <Badge variant="outline" className="text-[11px]">
                        {offer.unit}
                      </Badge>
                    ) : null}
                  </div>
                  {offer.description && (
                    <p className="mt-2 text-xs text-muted-foreground">{offer.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OffersFinder;
