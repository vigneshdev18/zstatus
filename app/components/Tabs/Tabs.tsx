"use client";

import { ReactNode, useState } from "react";

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  badge?: number | string;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

/**
 * Reusable Tabs Component
 *
 * @param tabs - Array of tab objects with id, label, and content
 * @param defaultTab - ID of the default active tab
 * @param onChange - Callback when tab changes
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, badge: 5 }
 *   ]}
 *   defaultTab="tab1"
 * />
 */
export function Tabs({
  tabs,
  defaultTab,
  onChange,
  className = "",
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex gap-2 border-b border-white/10 mb-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                px-4 py-3 font-medium transition-smooth relative
                ${isActive ? "text-white" : "text-gray-400 hover:text-gray-300"}
              `}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300">
                    {tab.badge}
                  </span>
                )}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">{activeTabContent}</div>
    </div>
  );
}
