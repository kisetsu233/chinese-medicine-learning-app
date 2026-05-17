import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, Search, Leaf, Wind, Droplets, Target, Layers, Loader2, Edit3, Save, Plus, Trash2, Undo2, PanelLeftOpen, RefreshCw } from 'lucide-react';
import { Herb, WATERMARK_IMAGES } from '../types';
import { cn } from '../lib/utils';
import { fetchHerbDetails } from '../services/tcmService';
import { api } from '../services/api';

interface MateriaMedicaProps {
  initialHerbName?: string | null;
  onClearedSearch?: () => void;
  onBackToPrescription?: () => void;
  isSidebarVisible?: boolean;
  onSidebarToggle?: () => void;
}

function SafeImage({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [resolvedSrc, setResolvedSrc] = useState<string>(src || '');

  useEffect(() => {
    let isMounted = true;
    if (src?.startsWith('local://')) {
      api.resolveImageUrl(src).then(url => {
        if (isMounted) setResolvedSrc(url);
      });
    } else {
      setResolvedSrc(src || '');
    }
    return () => { isMounted = false; };
  }, [src]);

  return <img src={resolvedSrc} alt={alt} className={className} {...props} />;
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
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadLocalLibrary();
  }, []);

  const loadLocalLibrary = async () => {
    setLoading(true);
    try {
      const herbsList: Herb[] = await api.getHerbs().catch(() => []);
      setLibrary(herbsList);
    } finally {
      setLoading(false);
    }
  };

  const syncLibrary = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const journals = await api.getJournals().catch(() => ({}));
      const allHerbNames = Array.from(new Set<string>(
        Object.values(journals).flatMap((day: any) => day.tcm?.herbs || [])
      ));

      const currentLibrary = await api.getHerbs().catch(() => []);
      const libraryMap = new Map<string, Herb>(currentLibrary.map(h => [h.name, h] as [string, Herb]));
      let hasChanges = false;

      for (const name of allHerbNames) {
        const existingHerb = libraryMap.get(name);
        if (!existingHerb || 
            (!existingHerb.isManual && (
              existingHerb.category === '待完善' || 
              existingHerb.category === '获取中...' || 
              existingHerb.category === '获取失败'
            ))) {
          
          try {
            const details = await fetchHerbDetails(name);
            const newHerb = {
              id: existingHerb?.id || name,
              name,
              image: existingHerb?.image || `https://images.unsplash.com/photo-1544070078-a212eda27b49?auto=format&fit=crop&q=80&w=400&q=${encodeURIComponent(name)}`,
              ...details
            } as Herb;
            
            const savedHerb = await api.createHerb(newHerb);
            libraryMap.set(name, savedHerb || newHerb);
            hasChanges = true;
          } catch (error) {
            console.error(`Failed to fetch details for ${name}:`, error);
          }
        }
      }

      if (hasChanges) {
        setLibrary(Array.from(libraryMap.values()));
      }
    } catch (e) {
      console.error("Sync library failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (initialHerbName) {
      const herb = library.find(h => h.name === initialHerbName);
      if (herb) {
        setSelectedHerb(herb);
        onClearedSearch?.();
      }
    }
  }, [initialHerbName, library, onClearedSearch]);

  const updateHerb = async (updatedHerb: Herb) => {
    const herbId = updatedHerb.id || updatedHerb.name;
    let category = updatedHerb.category;
    if (category === '获取失败' || category === '获取中...' || category === '待完善' || !category) {
      category = '手动更新';
    }

    const herbToSave = { ...updatedHerb, id: herbId, isManual: true, category };
    const updatedLibrary = library.map(h => (h.id === herbId || h.name === updatedHerb.name) ? herbToSave : h);
    setLibrary(updatedLibrary);
    
    try {
      await api.updateHerb(herbId, herbToSave);
    } catch (e) {
      console.error('Failed to update herb in DB', e);
    }
  };

  const deleteHerb = async (name: string) => {
    if (window.confirm(`确定要删除中药“${name}”吗？`)) {
      try {
        await api.deleteHerb(name);
        setLibrary(library.filter(h => h.name !== name));
        setSelectedHerb(null);
      } catch (e) {
        console.error('Failed to delete herb', e);
        alert('删除失败');
      }
    }
  };

  const filteredHerbs = library.filter(herb => 
    herb.name.includes(searchQuery) || 
    (herb.pinyin && herb.pinyin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-white relative z-10 overflow-hidden">
      <div className="watermark-bg opacity-[0.05]" style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})` }} />
      
      <header className="h-16 border-b border-emerald-950/10 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          {!isSidebarVisible && onSidebarToggle && (
            <button onClick={onSidebarToggle} className="p-1.5 rounded-lg hover:bg-green-100/50 text-green-900 transition-all">
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          )}
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" />
            <input 
              type="text"
              placeholder="搜索中药 (支持拼音、功效、分类...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-emerald-900/5 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-emerald-500/30 transition-all font-medium text-sm"
            />
          </div>
          <div className="text-[10px] font-black text-emerald-950/40 tracking-widest bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-900/5 whitespace-nowrap">
            共 {library.length} 味中药
          </div>
          {isSyncing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-pulse">
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">同步中...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={syncLibrary}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-white border border-emerald-950/10 text-emerald-950 text-[11px] font-black uppercase tracking-widest hover:border-emerald-500/30 transition-all active:scale-95",
              isSyncing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            同步新药材
          </button>
          {onBackToPrescription && (
            <button 
              onClick={onBackToPrescription}
              className="px-4 py-2 bg-emerald-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-950 transition-all shadow-md active:scale-95"
            >
              返回药方
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-20">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-900/10 border-t-emerald-800 rounded-full animate-spin" />
                <p className="text-[11px] font-black text-emerald-900/40 uppercase tracking-widest">加载图鉴中...</p>
              </div>
            </div>
          ) : filteredHerbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                <Leaf className="w-10 h-10 text-green-200" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-950">暂无药材</h3>
                <p className="text-green-800/40">在今日记录或日历中添加药方后，点击右上角“同步新药材”即可生成图鉴。</p>
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
                    <SafeImage 
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
      </main>

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
            onDelete={deleteHerb}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HerbDetailModal({ herb, onClose, onSave, onBack, onDelete }: { herb: Herb; onClose: () => void; onSave: (herb: Herb) => void; onBack?: () => void; onDelete?: (name: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHerb, setEditedHerb] = useState<Herb>(herb);
  const [relatedPrescriptions, setRelatedPrescriptions] = useState<{ date: string; name: string }[]>([]);

  useEffect(() => {
    const findRelated = async () => {
      const data = await api.getJournals();
      const related: { date: string; name: string }[] = [];
      Object.entries(data).forEach(([date, content]: [string, any]) => {
        if (content.tcm && content.tcm.herbs?.includes(herb.name)) {
          related.push({
            date,
            name: content.tcm.name || `未命名药方 (${date})`
          });
        }
      });
      setRelatedPrescriptions(related);
    };
    findRelated();
  }, [herb.name]);

  const handleSave = () => {
    onSave(editedHerb);
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const localUrl = await api.uploadHerbImage(file.name, file);
      setEditedHerb({ ...editedHerb, image: localUrl });
    } catch (err: any) {
      console.error('Upload failed', err);
      alert(`图片上传失败: ${err.message || '未知错误'}\n请确保您已授予文件夹写入权限。`);
    }
  };

  return createPortal(
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
          {onDelete && (
            <button 
              onClick={() => onDelete(herb.name)}
              className="px-4 py-2 bg-white text-rose-600 border border-rose-900/10 hover:bg-rose-50 transition-all flex items-center gap-2"
              title="删除药材"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">删除</span>
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
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
                <div className="w-full md:w-64 space-y-4 shrink-0">
                  <div className="aspect-square bg-green-50 border border-green-900/10 overflow-hidden relative group/img">
                    <SafeImage src={editedHerb.image} alt={editedHerb.name} className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white gap-2">
                      <Plus className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">上传新图片</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">或输入图片 URL</label>
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
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600 text-sm"
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
                      <textarea 
                        value={editedHerb.natureTaste}
                        onChange={e => setEditedHerb({...editedHerb, natureTaste: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600 h-20 resize-none text-sm leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">核心功效</label>
                      <textarea 
                        value={editedHerb.functions}
                        onChange={e => setEditedHerb({...editedHerb, functions: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600 h-20 resize-none text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">用量和用法</label>
                      <textarea 
                        value={editedHerb.dosageUsage || ''}
                        onChange={e => setEditedHerb({...editedHerb, dosageUsage: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600 h-20 resize-none text-sm leading-relaxed"
                        placeholder="例：3-9g，煎服"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-900/30 uppercase tracking-widest">注意事项</label>
                      <textarea 
                        value={editedHerb.precautions || ''}
                        onChange={e => setEditedHerb({...editedHerb, precautions: e.target.value})}
                        className="w-full border border-green-900/10 px-4 py-2 outline-none focus:border-green-600 h-20 resize-none text-sm leading-relaxed"
                        placeholder="例：孕妇慎用"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-green-950/10 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-green-950 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    经典配伍 (药对)
                  </h3>
                  <button 
                    onClick={() => {
                      const pairs = [...(editedHerb.herbPairs || []), { name: "", effect: "" }];
                      setEditedHerb({...editedHerb, herbPairs: pairs});
                    }}
                    className="p-1 px-2 border border-green-900/10 hover:bg-green-50 text-green-900"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {editedHerb.herbPairs?.map((pair, i) => (
                    <div key={i} className="p-4 border border-green-900/10 space-y-2 bg-green-50/20">
                      <div className="flex justify-between items-center">
                        <input 
                          value={pair.name}
                          onChange={e => {
                            const pairs = [...(editedHerb.herbPairs || [])];
                            pairs[i] = { ...pair, name: e.target.value };
                            setEditedHerb({...editedHerb, herbPairs: pairs});
                          }}
                          className="bg-transparent border-b border-green-900/10 outline-none focus:border-green-600 font-bold text-sm w-full"
                          placeholder="配伍药名"
                        />
                        <button 
                          onClick={() => {
                            const pairs = editedHerb.herbPairs?.filter((_, index) => index !== i);
                            setEditedHerb({...editedHerb, herbPairs: pairs});
                          }}
                          className="p-1 text-red-400 hover:text-red-600 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <textarea 
                        value={pair.effect}
                        onChange={e => {
                          const pairs = [...(editedHerb.herbPairs || [])];
                          pairs[i] = { ...pair, effect: e.target.value };
                          setEditedHerb({...editedHerb, herbPairs: pairs});
                        }}
                        className="w-full bg-transparent outline-none text-[11px] leading-relaxed resize-none h-12"
                        placeholder="配伍功效..."
                      />
                    </div>
                  ))}
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
              <div className="space-y-8">
                <div className="aspect-[3/4] border border-green-950/10 bg-green-50 overflow-hidden group">
                  <SafeImage src={herb.image} alt={herb.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                
                <div className="space-y-6">
                  <div className="pb-4 border-b border-green-950/5">
                    <span className="text-[10px] font-black text-green-900/30 uppercase tracking-[0.2em] block mb-2">性味归经</span>
                    <p className="text-sm font-bold text-green-950 leading-relaxed whitespace-pre-wrap">{herb.natureTaste || '待补充'}</p>
                  </div>
                  <div className="pb-4 border-b border-green-950/5">
                    <span className="text-[10px] font-black text-green-900/30 uppercase tracking-[0.2em] block mb-2">功效作用</span>
                    <p className="text-sm font-bold text-green-950 leading-relaxed whitespace-pre-wrap">{herb.functions || '待补充'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <span className="px-2 py-0.5 bg-green-900 text-white text-[9px] font-black uppercase tracking-[0.1em] mb-4 inline-block">
                    {herb.category || '未分类'}
                  </span>
                  <h2 className="text-6xl font-bold text-green-950 tracking-tighter mb-2">{herb.name}</h2>
                  <p className="text-xs font-black text-green-900/20 uppercase tracking-[0.4em] mb-8">{herb.pinyin || 'TCM MATERIA MEDICA'}</p>
                  <p className="text-lg text-green-900/70 border-l-2 border-green-900/10 pl-6 italic leading-relaxed mb-8 whitespace-pre-wrap">
                    {herb.description || '暂无详细描述'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-green-50/30 p-6 border border-green-900/5">
                    <div>
                      <span className="text-[10px] font-black text-green-900/30 uppercase tracking-[0.2em] block mb-2">用量和用法</span>
                      <p className="text-sm font-bold text-green-950 whitespace-pre-wrap">{herb.dosageUsage || '待补充'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-green-900/30 uppercase tracking-[0.2em] block mb-2 text-rose-800/40">注意事项</span>
                      <p className="text-sm font-bold text-rose-950 whitespace-pre-wrap">{herb.precautions || '无特殊禁忌'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-green-950 border-b border-green-950/10 pb-2">临床应用 APPLICATIONS</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {herb.applications?.map((app, i) => (
                      <div key={i} className="flex gap-6 p-4 border border-green-950/5 hover:bg-green-50 transition-colors">
                        <span className="text-xs font-black text-green-900/20">0{i + 1}</span>
                        <p className="text-sm font-bold text-green-950 leading-relaxed flex-1 whitespace-pre-wrap">{app}</p>
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
                          <p className="text-xs text-green-900/60 leading-relaxed whitespace-pre-wrap">{pair.effect}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relatedPrescriptions.length > 0 && (
                  <div className="space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 border-b border-emerald-950/10 pb-2">关联药方 RELATED PRESCRIPTIONS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {relatedPrescriptions.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-900/5 hover:border-emerald-500/20 transition-all group">
                          <div>
                            <h4 className="text-sm font-bold text-emerald-950">{p.name}</h4>
                            <p className="text-[9px] text-emerald-900/30 uppercase tracking-widest">{p.date}</p>
                          </div>
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
    </div>,
    document.body
  );
}
