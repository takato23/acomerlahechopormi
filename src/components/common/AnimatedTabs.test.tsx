import { render, screen, fireEvent } from '@testing-library/react';
import { AnimatedTabs, TabItem } from './AnimatedTabs';

describe('AnimatedTabs', () => {
  const tabs: TabItem[] = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3' },
  ];

  it('renders all tabs', () => {
    render(
      <AnimatedTabs
        tabs={tabs}
        activeTabId="tab1"
        onChange={jest.fn()}
      />
    );

    tabs.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  it('applies active styles to the active tab', () => {
    render(
      <AnimatedTabs
        tabs={tabs}
        activeTabId="tab2"
        onChange={jest.fn()}
      />
    );

    const activeTab = screen.getByText('Tab 2');
    expect(activeTab).toHaveClass('text-slate-900');
  });

  it('calls onChange with the correct tab ID when a tab is clicked', () => {
    const handleChange = jest.fn();
    render(
      <AnimatedTabs
        tabs={tabs}
        activeTabId="tab1"
        onChange={handleChange}
      />
    );

    const tabToClick = screen.getByText('Tab 3');
    fireEvent.click(tabToClick);

    expect(handleChange).toHaveBeenCalledWith('tab3');
  });
});