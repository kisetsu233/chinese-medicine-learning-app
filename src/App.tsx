/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MateriaMedica from './components/MateriaMedica';
import CalendarView from './components/CalendarView';
import TodayView from './components/TodayView';
import NewNoteForm from './components/NewNoteForm';
import PrescriptionSummary from './components/PrescriptionSummary';
import { parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
import { Menu, FolderOpen, ShieldCheck, HardDrive } from 'lucide-react';
import { storage } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('all-journals');
  const [subView, setSubView] = useState<'none' | 'new-note'>('none');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [selectedHerbForView, setSelectedHerbForView] = useState<string | null>(null);
  const [returnContext, setReturnContext] = useState<{
    tab: string;
    prescriptionName?: string;
  } | null>(null);
  const [isStorageConnected, setIsStorageConnected] = useState(false);
  const [targetCalendarDate, setTargetCalendarDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    storage.isConnected().then(setIsStorageConnected);
  }, []);

  const handleConnect = async () => {
    const success = await storage.connect();
    setIsStorageConnected(success);
  };

  const handleHerbClick = (name: string, prescriptionName?: string) => {
    setReturnContext({
      tab: activeTab,
      prescriptionName
    });
    setSelectedHerbForView(name);
    setActiveTab('materia-medica');
  };

  const handleBackToPrescription = () => {
    if (returnContext) {
      setActiveTab(returnContext.tab);
      setSelectedHerbForView(null);
    }
  };

  const handleArchivePrescriptionClick = (dateStr: string) => {
    setTargetCalendarDate(parseISO(dateStr));
    setActiveTab('calendar');
  };

  const renderContent = () => {
    if (!isStorageConnected) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/natural-paper.png')` }} />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center space-y-8 relative z-10"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-inner">
                <FolderOpen className="w-10 h-10 text-emerald-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-emerald-950 tracking-tight">建立您的本地药橱</h2>
              <p className="text-emerald-900/60 leading-relaxed text-sm">
                为了保障您的隐私和数据主权，请在您的电脑上选择一个文件夹作为存储空间。
                所有的笔记和图鉴都将以本地文件的形式保存在那里。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 text-left">
              {[
                { icon: ShieldCheck, title: "隐私安全", desc: "您的数据永远留在您的电脑上，不上传云端。" },
                { icon: HardDrive, title: "离线可用", desc: "没有网络也能随时记录和查看。" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl border border-emerald-900/5 shadow-sm">
                  <div className="mt-1 p-2 bg-emerald-50 rounded-lg">
                    <item.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">{item.title}</h4>
                    <p className="text-xs text-emerald-900/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleConnect}
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <FolderOpen className="w-5 h-5" />
              选择存储文件夹
            </button>
            
            <p className="text-[10px] text-emerald-900/30 uppercase tracking-widest font-bold">
              Powered by Browser File System API
            </p>
          </motion.div>
        </div>
      );
    }

    if (subView === 'new-note') {
      return (
        <NewNoteForm 
          onCancel={() => setSubView('none')} 
          onSave={() => setSubView('none')} 
        />
      );
    }

    const editorProps = {
      onEditorToggle: (isActive: boolean) => setIsEditorActive(isActive),
      isSidebarVisible,
      onSidebarToggle: () => setIsSidebarVisible(!isSidebarVisible),
      onHerbClick: handleHerbClick
    };

    switch (activeTab) {
      case 'today':
        return <TodayView {...editorProps} />;
      case 'materia-medica':
        return (
          <MateriaMedica 
            {...editorProps}
            initialHerbName={selectedHerbForView} 
            onClearedSearch={() => setSelectedHerbForView(null)} 
            onBackToPrescription={handleBackToPrescription}
          />
        );
      case 'prescriptions-summary':
        return <PrescriptionSummary onPrescriptionClick={handleArchivePrescriptionClick} onHerbClick={handleHerbClick} initialPrescriptionName={returnContext?.tab === 'prescriptions-summary' ? returnContext.prescriptionName : undefined} onPrescriptionHandled={() => setReturnContext(null)} />;
      case 'calendar':
      case 'all-journals':
      default:
        return (
          <CalendarView 
            {...editorProps} 
            initialPrescriptionName={(returnContext?.tab === 'calendar' || returnContext?.tab === 'all-journals') ? returnContext.prescriptionName : undefined}
            onPrescriptionHandled={() => {
              setReturnContext(null);
              setTargetCalendarDate(undefined);
            }}
            initialDate={targetCalendarDate}
          />
        );
    }
  };

  const isSidebarCollapsed = isEditorActive || !isSidebarVisible;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface font-sans relative">
      <AnimatePresence>
        {isSidebarVisible && (
          <motion.div
            initial={{ x: -157, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              width: isEditorActive ? 64 : 157 
            }}
            exit={{ x: -157, opacity: 0 }}
            className="fixed left-0 top-0 h-full z-40"
          >
            <Sidebar 
              activeTab={activeTab === 'today' ? 'today' : (subView === 'new-note' ? 'all-journals' : activeTab)} 
              isCollapsed={isEditorActive}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSubView('none');
              }} 
              onCollapse={() => setIsSidebarVisible(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className={cn(
        "flex-1 relative overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out",
        isSidebarVisible ? (isEditorActive ? "ml-[64px]" : "ml-[157px]") : "ml-0"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + subView}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
