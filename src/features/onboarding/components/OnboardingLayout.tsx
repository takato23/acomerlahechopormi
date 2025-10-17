import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface OnboardingLayoutProps {
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function OnboardingLayout({
  title,
  description,
  stepIndex,
  totalSteps,
  onBack,
  children,
  footer
}: OnboardingLayoutProps) {
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-emerald-700">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {onBack ? (
            <Button variant="ghost" onClick={onBack}>
              Atrás
            </Button>
          ) : null}
        </div>
        <div>
          <Progress value={progress} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            Paso {stepIndex + 1} de {totalSteps}
          </p>
        </div>
      </header>
      <main className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        {children}
      </main>
      {footer ? <footer className="flex items-center justify-end gap-4">{footer}</footer> : null}
    </div>
  );
}
