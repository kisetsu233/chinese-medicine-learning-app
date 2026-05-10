import { Search, Sun, Folder, Sprout, Calendar, Settings, Crown, ChevronLeft, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import ExportModal from './ExportModal';

interface SidebarProps {
  activeTab: string;
  isCollapsed?: boolean;
  onTabChange: (tab: string) => void;
  onCollapse: () => void;
}

export default function Sidebar({ activeTab, isCollapsed, onTabChange, onCollapse }: SidebarProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const navItems = [
    { id: 'today', name: 'Today', icon: Sun },
    { id: 'all-journals', name: '日历', icon: Calendar },
    { id: 'materia-medica', name: '中药图鉴', icon: Sprout },
  ];

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const getJournalData = () => {
    const saved = localStorage.getItem('journal-content');
    return saved ? JSON.parse(saved) : {};
  };

  return (
    <>
      <nav className={cn(
        "h-screen glass-panel border-r border-outline-variant/30 flex flex-col py-6 relative transition-all duration-300",
        isCollapsed ? "w-[64px]" : "w-[157px]"
      )}>
        <button 
          onClick={onCollapse}
          className={cn(
            "absolute top-6 p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-all",
            isCollapsed ? "right-1/2 translate-x-1/2" : "right-4"
          )}
          title={isCollapsed ? "Expand" : "Hide"}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", isCollapsed ? "rotate-180" : "")} />
        </button>

        <div className={cn("mb-8 transition-all px-4", isCollapsed ? "opacity-0 scale-75" : "px-6 opacity-100")}>
          {!isCollapsed && (
            <>
              <h1 className="text-xl font-bold tracking-tight mb-0.5">一味坚持</h1>
              <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Collection</p>
            </>
          )}
        </div>

        <div className={cn("px-4 mb-6 transition-all", isCollapsed ? "opacity-0 scale-90 h-0 pointer-events-none" : "opacity-100 h-auto")}>
          {!isCollapsed && (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-surface-container-low border-none rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary placeholder-on-surface-variant/40"
              />
            </div>
          )}
        </div>

        <div className="flex-1 px-2 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-4 py-2">
              <p className="text-[9px] font-bold text-on-surface-variant/30 uppercase tracking-widest">Library</p>
            </div>
          )}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg text-xs transition-all duration-200 overflow-hidden",
                isCollapsed ? "justify-center px-0 py-3" : "px-3 py-1.5",
                activeTab === item.id
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high/50"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("w-3.5 h-3.5 shrink-0", activeTab === item.id ? "fill-primary/20" : "")} />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          ))}
        </div>

        <div className="mt-auto px-2 space-y-4">
          <button 
            onClick={handleExportClick}
            className={cn(
              "w-full py-1.5 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-xs transition-all flex items-center justify-center gap-2 border border-outline-variant/30 shadow-sm font-medium overflow-hidden group",
              isCollapsed ? "p-3" : ""
            )}
            title={isCollapsed ? "导出笔记" : undefined}
          >
            <Download className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span>导出笔记</span>}
          </button>
          
          <button 
            onClick={() => onTabChange('settings')}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg text-xs transition-all overflow-hidden",
              isCollapsed ? "justify-center px-0 py-3" : "px-3 py-1.5",
              activeTab === 'settings' ? "text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-high/50"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </div>
      </nav>

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        journalData={getJournalData()}
      />
    </>
  );
}
