import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Suggestion } from "@/features/suggestions/types";
import { usePlanningStore } from "@/stores/planningStore";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { MealType } from "../types";

interface SuggestionsPopoverProps {
  date: string;
  mealType: MealType;
  onSuggestionSelect: (suggestion: Suggestion) => void;
}

export function SuggestionsPopover({
  date,
  mealType,
  onSuggestionSelect
}: SuggestionsPopoverProps) {
  const {
    currentSuggestions,
    isLoadingSuggestions,
    fetchSuggestions,
    clearSuggestions
  } = usePlanningStore();

  const handleTriggerClick = () => {
    if (!currentSuggestions) {
      fetchSuggestions(date, mealType);
    }
  };

  const handleClose = () => {
    clearSuggestions();
  };

  const handleRefresh = () => {
    fetchSuggestions(date, mealType);
  };

  return (
    <Popover onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTriggerClick}
          aria-label="Ver sugerencias"
          className="hover:bg-secondary"
        >
          {isLoadingSuggestions ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Sugerencias</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoadingSuggestions}
              aria-label="Refrescar sugerencias"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingSuggestions ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Cerrar sugerencias"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {currentSuggestions?.length ? (
          <div className="space-y-2">
            {currentSuggestions.map((suggestion, index) => (
              <Button
                key={suggestion.id || index}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => onSuggestionSelect(suggestion)}
              >
                <div className="flex flex-col items-start">
                  <span>{suggestion.title}</span>
                  {suggestion.reason && (
                    <span className="text-xs text-muted-foreground">
                      {suggestion.reason}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        ) : isLoadingSuggestions ? (
          <div className="py-8 text-center text-muted-foreground">
            Buscando sugerencias...
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No hay sugerencias disponibles
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}