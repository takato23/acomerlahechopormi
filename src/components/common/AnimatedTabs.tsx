// src/components/common/AnimatedTabs.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTabIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
}

export function AnimatedTabs({
  tabs,
  activeTabIds,
  onChange,
  className,
  tabClassName,
  activeTabClassName = "bg-primary text-white",
  inactiveTabClassName = "bg-muted text-muted-foreground hover:bg-primary/10",
}: AnimatedTabsProps) {
  const [selectedTabs, setSelectedTabs] = useState<string[]>(activeTabIds);

  const handleTabClick = (id: string) => {
    const isSelected = selectedTabs.includes(id);
    const updatedTabs = isSelected
      ? selectedTabs.filter((tabId) => tabId !== id)
      : [...selectedTabs, id];

    setSelectedTabs(updatedTabs);
    onChange(updatedTabs);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 p-2 bg-muted rounded-lg",
        className
      )}
      role="group"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-all duration-300",
            tabClassName,
            selectedTabs.includes(tab.id) ? activeTabClassName : inactiveTabClassName
          )}
          aria-pressed={selectedTabs.includes(tab.id)}
        >
          {tab.icon && <span className="w-4 h-4 mr-1">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}