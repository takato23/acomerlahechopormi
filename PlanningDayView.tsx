import React from 'react';

interface PlanningDayViewProps {
  day: string;
}

const PlanningDayView: React.FC<PlanningDayViewProps> = ({ day }) => {
  console.log(`[PlanningDayView] Rendering day ${day}`);
  return (
    <div>
      {day}
    </div>
  );
};

export default React.memo(PlanningDayView); 