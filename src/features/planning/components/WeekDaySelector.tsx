import React from 'react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeekDaySelectorProps {
  days: Date[];
  selectedDay: Date;
  onDaySelect: (day: Date) => void;
  className?: string;
}

export function WeekDaySelector({
  days,
  selectedDay,
  onDaySelect,
  className
}: WeekDaySelectorProps) {
  const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');

  return (
    <div className={cn(
      "flex items-stretch justify-between p-1 gap-1",
      "bg-card/80 backdrop-blur-sm rounded-lg border border-border/30",
      className
    )}>
      {days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isSelected = dateStr === selectedDateStr;
        const isCurrentDay = isToday(day);
        
        return (
          <button
            key={dateStr}
            onClick={() => onDaySelect(day)}
            className={cn(
              // Base
              "flex-1 flex flex-col items-center justify-center py-1.5 px-1",
              "rounded-md transition-all duration-300",
              // Estados
              "hover:bg-muted/50",
              isSelected && "bg-primary/10 text-primary ring-1 ring-primary/20",
              !isSelected && isCurrentDay && "ring-1 ring-primary/10",
              // Espaciado y tamaño mínimo
              "min-w-[3rem]"
            )}
          >
            {/* Día de la semana */}
            <span className={cn(
              "text-xs font-medium mb-1",
              isSelected ? "text-primary" : "text-foreground/70"
            )}>
              {format(day, 'EEE', { locale: es })}
            </span>

            {/* Número del día */}
            <span className={cn(
              "w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors",
              isSelected ? "bg-primary/20 font-medium" : "text-muted-foreground",
              isCurrentDay && !isSelected && "bg-primary/5"
            )}>
              {format(day, 'd')}
            </span>

            {/* Indicador de día actual */}
            {isCurrentDay && !isSelected && (
              <span className="mt-1 w-1 h-1 rounded-full bg-primary/40" />
            )}
          </button>
        );
      })}
    </div>
  );
}