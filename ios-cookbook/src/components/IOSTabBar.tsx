import React from 'react';
import { BookOpen, UtensilsCrossed, Plus } from 'lucide-react';
import { haptics } from '../hooks/useHaptics';

export type TabType = 'cookbook' | 'fridge' | 'add';

interface IOSTabBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const IOSTabBar: React.FC<IOSTabBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const handleTabClick = (tab: TabType) => {
    haptics.tap();
    onSelectTab(tab);
  };

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cookbook', label: 'Cookbook', icon: BookOpen },
    { id: 'fridge', label: 'Pantry', icon: UtensilsCrossed },
    { id: 'add', label: 'Add Recipe', icon: Plus },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-[#1c1c1e]/85 border-t border-black/[0.08] dark:border-white/[0.12] transition-colors">
      <div className="flex items-center justify-around pt-1.5 pb-1 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all active:scale-90 ${
                isActive
                  ? 'text-[#1E3A8A] dark:text-[#5B8DEF]'
                  : 'text-[#8E8E93] dark:text-[#98989D] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform ${
                    isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'
                  }`}
                />
              </div>
              <span className={`text-[10.5px] tracking-tight mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* iOS Home Indicator bar */}
      <div className="flex justify-center pb-1.5 pt-0.5">
        <div className="w-36 h-1 rounded-full bg-black/30 dark:bg-white/30" />
      </div>
    </div>
  );
};
