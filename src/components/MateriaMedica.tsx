import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, Search, Leaf, Wind, Droplets, Target, Layers, Loader2, Edit3, Save, Plus, Trash2, Undo2, PanelLeftOpen } from 'lucide-react';
import { Herb, WATERMARK_IMAGES } from '../types';
import { cn } from '../lib/utils';
import { fetchHerbDetails } from '../services/tcmService';

interface MateriaMedicaProps {
  initialHerbName?: string | null;
  onClearedSearch?: () => void;
  onBackToPrescription?: () => void;
  isSidebarVisible?: boolean;
  onSidebarToggle?: () => void;
}

export default function MateriaMedica({ 
  initialHerbName, 
  onClearedSearch, 
  onBackToPrescription,
  isSidebarVisible,
  onSidebarToggle
}: MateriaMedicaProps) {
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [library, setLibrary] = useState<Herb[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    syncLibrary();
  }, []);

  useEffect(() => {
    if (initialHerbName) {
      const herb = library.find(h => h.name === initialHerbName);
      if (herb) {
        setSelectedHerb(herb);
        onClearedSearch?.();
      }
    }
  }, [initialHerbName, library, onClearedSearch]);

  const syncLibrary = async () => {
    setIsSyncing(true);
    // Load herbs from storage
    const savedContent = localStorage.getItem('journal-content');
    const content = savedContent ? JSON.parse(savedContent) : {};
    const localLibrary = localStorage.getItem('herb-library');
    const libraryData = localLibrary ? JSON.parse(localLibrary) : {};

    // Extract all unique herb names from prescriptions
    const allHerbNames = Array.from(new Set<string>(
      Object.values(content).flatMap((day: any) => day.tcm?.herbs || [])
    ));

    const updatedLibraryData = { ...libraryData };
    let hasChanges = false;

    // Fetch missing details for each herb
    for (const name of allHerbNames) {
      if (!updatedLibraryData[name] || updatedLibraryData[name].category === '待完善' || updatedLibraryData[name].category === '获取中...') {
        try {
          const details = await fetchHerbDetails(name);
          updatedLibraryData[name] = {
            id: name,
            name,
            image: `https://images.unsplash.com/photo-1544070078-a212eda27b49?auto=format&fit=crop&q=80&w=400&q=${encodeURIComponent(name)}`,
            ...details
          };
          hasChanges = true;
          // Partial updates to UI for better UX
          const currentHerbs = allHerbNames.map(n => updatedLibraryData[n] || { id: n, name: n, category: '获取中...' });
          setLibrary(currentHerbs as Herb[]);
        } catch (error) {
          console.error(`Failed to fetch details for ${name}:`, error);
        }
      }
    }

    if (hasChanges) {
      localStorage.setItem('herb-library', JSON.stringify(updatedLibraryData));
    }

    const finalHerbs = allHerbNames.map(name => updatedLibraryData[name] || {
      id: name,
      name,
      image: 'https://images.unsplash.com/photo-1544070078-a212eda27b49?auto=format&fit=crop&q=80&w=400',
      category: '待完善',
      natureTaste: '加载失败',
    });

    setLibrary(finalHerbs as Herb[]);
    setIsSyncing(false);
  };

  const updateHerb = (updatedHerb: Herb) => {
    const updatedLibrary = library.map(h => h.id === updatedHerb.id ? updatedHerb : h);
    setLibrary(updatedLibrary);
    
    // Also update localStorage
    const localLibrary = localStorage.getItem('herb-library');
    const libraryData = localLibrary ? JSON.parse(localLibrary) : {};
    libraryData[updatedHerb.name] = updatedHerb;
    localStorage.setItem('herb-library', JSON.stringify(libraryData));
  };

  const filteredHerbs = library.filter(herb => 
    herb.name.includes(searchQuery) || 
    (herb.pinyin && herb.pinyin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative flex-1 p-8 overflow-y-auto">
      <div className="watermark-bg opacity-[0.05]" style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})` }} />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {!isSidebarVisible && onSidebarToggle && (
                <button 
                  onClick={onSidebarToggle}
                  className="mt-1 p-1.5 rounded-lg hover:bg-green-100/50 text-green-900 transition-all hover:scale-110 active:scale-95 group"
                  title="显示侧边栏"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-green-950">中药图鉴</h1>
                <div className="px-3 py-0.5 bg-green-900/5 text-green-900 border border-green-900/10">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">共收录 {library.length} 味中药</span>
                </div>
                {isSyncing && (
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-green-50 text-green-900 border border-green-900/10 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">同步中</span>
                  </div>
                )}
              </div>
              <p className="text-green-800/40 text-sm font-medium">自动收录您药方中的所有中药材</p>
            </div>
          </div>
          <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-800/30" />
              <input
                type="text"
                placeholder="搜索药材名称"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/60 border border-green-950/10 rounded-none pl-10 pr-4 py-2.5 text-sm focus:border-green-600 placeholder-green-800/20 shadow-sm transition-all outline-none"
              />
            </div>
          </div>
        </header>

        {filteredHerbs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
              <Leaf className="w-10 h-10 text-green-200" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-950">暂无药材</h3>
              <p className="text-green-800/40">在今日记录或日历中添加药方后，系统将自动生成图鉴。</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredHerbs.map(herb => (
              <motion.div
                layoutId={herb.id}
                key={herb.id}
                onClick={() => setSelectedHerb(herb)}
                whileHover={{ y: -2, scale: 1.01 }}
                className="bg-white rounded-none overflow-hidden border border-green-900/10 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-green-50/50">
                  <img 
                    src={herb.image} 
                    alt={herb.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {herb.category && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-900 text-white text-[8px] font-bold uppercase tracking-wider">
                      {herb.category}
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1 border-t border-green-900/5">
                  <h3 className="text-lg font-bold text-green-950 leading-tight mb-0.5">{herb.name}</h3>
                  <p className="text-[8px] font-black text-green-800/30 uppercase tracking-widest mb-3">
                    {herb.pinyin || 'TCM HERB'}
                  </p>
                  <div className="mt-auto pt-2 border-t border-green-900/5">
                    <span className="text-[9px] text-green-900/50 font-bold line-clamp-1">{herb.natureTaste || '待完善'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedHerb && (
          <HerbDetailModal 
            herb={selectedHerb} 
            onClose={() => setSelectedHerb(null)} 
            onSave={(updated) => {
              updateHerb(updated);
              setSelectedHerb(updated);
            }}
            onBack={onBackToPrescription}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HerbDetailModal({ herb, onClose, onSave, onBack }: { herb: Herb; onClose: () => void; onSave: (herb: Herb) => void; onBack?: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHerb, setEditedHerb] = useState<Herb>(herb);

  const handleSave = () => {
    onSave(editedHerb);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-green-950/20 backdrop-blur-3xl"
      />
      
      <motion.div 
        layoutId={herb.id}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-none shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)] border border-green-950/10 overflow-y-auto relative z-10 custom-scrollbar"
      >
        <div className="sticky top-0 right-0 z-50 flex justify-end gap-2 p-4 bg-white border-b border-green-950/5">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-4 py-2 bg-green-50 text-green-950 hover:bg-green-100 transition-all flex items-center gap-2 border border-green-900/10"
              title="返回药方"
            >
              <Undo2 className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">返回药方</span>
            </button>
          )}
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={cn(
              "px-4 py-2 flex items-center gap-2 transition-all border",
              isEditing ? "bg-green-600 text-white border-green-700 font-bold" : "bg-white text-green-950 border-green-900/10 hover:bg-green-50"
            )}
          >
            {isEditing ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{isEditing ? '保存修改' : '编辑图鉴'}</span>
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white text-green-950 border border-green-900/10 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 md:p-10">
          {isEditing ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
                <div className="w-full md:w-64 space-y-4 shrink-0">
                  <div className="aspect-square bg-green-50 border border-green-900/10 overflow-hidden">
                    <img src={editedHerb.image} alt={editedHerb.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">图片 URL</label>
                    <input 
                      value={editedHerb.image}
                      onChange={e => setEditedHerb({...editedHerb, image: e.target.value})}
                      className="w-full bg-green-50/50 border border-green-900/10 px-3 py-2 text-xs text-green-800 outline-none focus:border-green-600"
                    />
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">分类</label>
                      <input 
                        value={editedHerb.category}
                        onChange={e => setEditedHerb({...editedHerb, category: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">药名</label>
                      <input 
                        value={editedHerb.name}
                        onChange={e => setEditedHerb({...editedHerb, name: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">描述</label>
                    <textarea 
                      value={editedHerb.description}
                      onChange={e => setEditedHerb({...editedHerb, description: e.target.value})}
                      className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600 h-24 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">性味归经</label>
                      <input 
                        value={editedHerb.natureTaste}
                        onChange={e => setEditedHerb({...editedHerb, natureTaste: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">核心功效</label>
                      <input 
                        value={editedHerb.functions}
                        onChange={e => setEditedHerb({...editedHerb, functions: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-green-950/10 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-green-950 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    临床应用
                  </h3>
                  <button 
                    onClick={() => {
                      const apps = [...(editedHerb.applications || []), ""];
                      setEditedHerb({...editedHerb, applications: apps});
                    }}
                    className="p-1 px-2 border border-green-900/10 hover:bg-green-50 text-green-900"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {editedHerb.applications?.map((app, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        value={app}
                        onChange={e => {
                          const apps = [...(editedHerb.applications || [])];
                          apps[i] = e.target.value;
                          setEditedHerb({...editedHerb, applications: apps});
                        }}
                        className="flex-1 px-4 py-2 border border-green-900/10 outline-none focus:border-green-600 text-sm"
                      />
                      <button 
                         onClick={() => {
                           const apps = editedHerb.applications?.filter((_, index) => index !== i);
                           setEditedHerb({...editedHerb, applications: apps});
                         }}
                         className="p-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12">
              {/* Product Info Sidebar */}
              <div className="space-y-8">
                <div className="aspect-[3/4] border border-green-950/10 bg-green-50 overflow-hidden group">
                  <img src={herb.image} alt={herb.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                
                <div className="space-y-6">
                  <div className="pb-4 border-b border-green-950/5">
                    <span className="text-[10px] font-black text-green-900/30 uppercase tracking-[0.2em] block mb-2">性味归经</span>
                    <p className="text-sm font-bold text-green-950 leading-relaxed">{herb.natureTaste || '待补充'}</p>
                  </div>
                  <div className="pb-4 border-b border-green-950/5">
                    <span className="text-[10px] font-black text-green-900/30 uppercase tracking-[0.2em] block mb-2">功效作用</span>
                    <p className="text-sm font-bold text-green-950 leading-relaxed">{herb.functions || '待补充'}</p>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="space-y-12">
                <div>
                  <span className="px-2 py-0.5 bg-green-900 text-white text-[9px] font-black uppercase tracking-[0.1em] mb-4 inline-block">
                    {herb.category || '未分类'}
                  </span>
                  <h2 className="text-6xl font-bold text-green-950 tracking-tighter mb-2">{herb.name}</h2>
                  <p className="text-xs font-black text-green-900/20 uppercase tracking-[0.4em] mb-8">{herb.pinyin || 'TCM MATERIA MEDICA'}</p>
                  <p className="text-lg text-green-900/70 border-l-2 border-green-900/10 pl-6 italic leading-relaxed">
                    {herb.description || '暂无详细描述'}
                  </p>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-green-950 border-b border-green-950/10 pb-2">临床应用 APPLICATIONS</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {herb.applications?.map((app, i) => (
                      <div key={i} className="flex gap-6 p-4 border border-green-950/5 hover:bg-green-50 transition-colors">
                        <span className="text-xs font-black text-green-900/20">0{i + 1}</span>
                        <p className="text-sm font-bold text-green-950 leading-relaxed flex-1">{app}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {herb.herbPairs && herb.herbPairs.length > 0 && (
                  <div className="space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-green-950 border-b border-green-950/10 pb-2">经典配伍 HERB PAIRS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {herb.herbPairs.map((pair, i) => (
                        <div key={i} className="p-6 bg-green-50/50 border border-green-900/5">
                          <h4 className="text-base font-bold text-green-950 mb-2">{pair.name}</h4>
                          <p className="text-xs text-green-900/60 leading-relaxed">{pair.effect}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
