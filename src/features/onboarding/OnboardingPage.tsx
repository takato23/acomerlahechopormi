import React from 'react';
import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

const OnboardingPage: React.FC = () => {
  return (
    <RoutePlaceholder
      title="Onboarding próximamente"
      description="Estamos preparando una experiencia de onboarding increíble para que puedas configurar tu cuenta de manera fácil y rápida."
      status="coming-soon"
      actionLabel="Volver al dashboard"
      actionTo="/app"
    />
  );
};

export default OnboardingPage;
