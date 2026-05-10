/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MateriaMedica from './components/MateriaMedica';
import CalendarView from './components/CalendarView';
import TodayView from './components/TodayView';
import NewNoteForm from './components/NewNoteForm';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
import { Menu } from 'lucide-react';

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
      // We'll pass prescriptionName back to the view via props if needed
      // Actually, we can just clear it here once handled or let the view handle it
      setSelectedHerbForView(null);
    }
  };

  const renderContent = () => {
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
      case 'calendar':
      case 'all-journals':
      default:
        return (
          <CalendarView 
            {...editorProps} 
            initialPrescriptionName={returnContext?.tab === 'calendar' ? returnContext.prescriptionName : undefined}
            onPrescriptionHandled={() => setReturnContext(null)}
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
            className="flex-1 flex flex-col h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

