import type { ReactNode } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? <CardFooter className="flex flex-col space-y-2">{footer}</CardFooter> : null}
      </Card>
    </div>
  );
}
