import React from 'react';
import { BookOpen, UtensilsCrossed, Plus, Moon, Sun, ChefHat } from 'lucide-react';
import { haptics } from '../hooks/useHaptics';
import { TabType } from './IOSTabBar';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAddRecipe: () => void;
}

const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'cookbook', label: 'Cookbook', icon: BookOpen },
  { id: 'fridge', label: 'Pantry Chef', icon: UtensilsCrossed },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  onAddRecipe,
}) => {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0 bg-white dark:bg-[#1C1C1E] border-r border-black/[0.06] dark:border-white/[0.08]">
      {/* Brand */}
      <div className="px-6 pt-7 pb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-[#5B8DEF] flex items-center gap-1.5">
          <ChefHat className="w-3.5 h-3.5" />
          Personal Kitchen
        </span>
        <h1 className="text-2xl font-black text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight mt-0.5">
          Cookbook
        </h1>
      </div>

      {/* Add Recipe */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            haptics.tap();
            onAddRecipe();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold shadow-xs hover:brightness-110 active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Recipe
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                haptics.tap();
                onSelectTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] dark:text-[#5B8DEF]'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer: dark mode toggle */}
      <div className="px-4 py-5 border-t border-black/[0.06] dark:border-white/[0.08]">
        <button
          onClick={() => {
            haptics.tap();
            onToggleDarkMode();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
};
