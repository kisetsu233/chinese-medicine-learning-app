import React from 'react';
import { motion } from 'motion/react';
import { Grid2X2, Sun, Calendar, Plus, FileText, Leaf, Wind, Sprout } from 'lucide-react';
import { WATERMARK_IMAGES } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  onCreateNote: () => void;
  onOpenToday: () => void;
}

export default function Dashboard({ onCreateNote, onOpenToday }: DashboardProps) {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-12 min-h-screen">
      <div 
        className="watermark-bg opacity-[0.08]" 
        style={{ backgroundImage: `url(${WATERMARK_IMAGES.SCHOLAR})`, backgroundPosition: 'right bottom', backgroundSize: '70%' }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-12"
      >
        <div className="inline-flex items-center gap-3 px-8 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-outline-variant/20 shadow-xl mb-6">
          <Grid2X2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">All Journals</h1>
        </div>
        <p className="text-on-surface-variant font-medium tracking-wide">1 Active Journal</p>
      </motion.div>

      <div className="relative z-10 w-full max-w-lg space-y-4">
        <ActionButton 
          icon={Sun} 
          title="Create today's entry" 
          onClick={onOpenToday}
          badges={[Leaf, Wind]}
          primary
        />
        <ActionButton 
          icon={Calendar} 
          title="Create TCM entry on day..." 
          onClick={() => {}}
          badges={[Sprout]}
        />
        <ActionButton 
          icon={FileText} 
          title="Create a new TCM note" 
          onClick={onCreateNote}
          badges={[Sprout]}
        />
      </div>
    </div>
  );
}

function ActionButton({ 
  icon: Icon, 
  title, 
  onClick, 
  badges = [], 
  primary = false 
}: { 
  icon: any, 
  title: string, 
  onClick: () => void, 
  badges?: any[],
  primary?: boolean 
}) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-6 rounded-2xl border border-outline-variant/40 shadow-sm transition-all duration-300 group",
        primary ? "bg-white/90 backdrop-blur-xl" : "bg-white/60 backdrop-blur-md"
      )}
    >
      <div className="flex items-center gap-5">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
          primary ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xl font-semibold text-on-surface">{title}</span>
      </div>
      <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
        {badges.map((Badge, i) => (
          <Badge key={i} className="w-5 h-5 text-primary" />
        ))}
      </div>
    </motion.button>
  );
}
