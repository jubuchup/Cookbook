import React, { useEffect, useState } from 'react';
import { Wifi, Battery } from 'lucide-react';

interface IOSStatusBarProps {
  isMockupFrame: boolean;
  onToggleFrame?: () => void;
}

export const IOSStatusBar: React.FC<IOSStatusBarProps> = ({ isMockupFrame, onToggleFrame }) => {
  const [timeStr, setTimeStr] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const formatted = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
      setTimeStr(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full select-none z-40 bg-inherit transition-all duration-300">
      {/* Dynamic Island on Frame mode */}
      {isMockupFrame && (
        <div className="flex justify-center pt-2">
          <div className="w-28 h-7 bg-black rounded-full flex items-center justify-between px-3 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] border border-neutral-800" />
            <div className="w-2 h-2 rounded-full bg-[#0a84ff]/60 animate-pulse" />
          </div>
        </div>
      )}

      {/* Status Bar row */}
      <div className="flex items-center justify-between px-7 py-2 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
        {/* Left: Time */}
        <span className="tracking-tight text-[15px] font-medium">{timeStr}</span>

        {/* Right: Cellular, Wifi, Battery */}
        <div className="flex items-center gap-2">
          {/* 4 Cell bars */}
          <div className="flex items-end gap-[1.5px] h-3">
            <span className="w-[3px] h-1.5 bg-current rounded-xs" />
            <span className="w-[3px] h-2 bg-current rounded-xs" />
            <span className="w-[3px] h-2.5 bg-current rounded-xs" />
            <span className="w-[3px] h-3 bg-current rounded-xs" />
          </div>

          {/* Wifi */}
          <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />

          {/* Battery */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium">98%</span>
            <div className="relative flex items-center">
              <Battery className="w-5 h-5" strokeWidth={2} />
              <div className="absolute left-[3px] top-[6.5px] h-[7px] w-[10px] bg-current rounded-[1px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
