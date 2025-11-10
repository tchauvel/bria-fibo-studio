'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Wand2 } from 'lucide-react';
import StyleExtractorTab from '@/components/StyleExtractorTab';
import ImageGeneratorTab from '@/components/ImageGeneratorTab';

type Tab = 'style-extractor' | 'image-generator';

const tabs = [
  { id: 'style-extractor' as Tab, label: 'Style Extractor', icon: Palette, color: 'from-blue-500 to-cyan-500' },
  { id: 'image-generator' as Tab, label: 'Image Generator', icon: Wand2, color: 'from-violet-500 to-purple-500' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('style-extractor');

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Enhanced Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="relative max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Bria FIBO Studio
                </h1>
                <p className="text-sm text-[#86868b]">
                  Photography style transfer platform
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Navigation */}
      <div className="sticky top-[88px] z-40 bg-white/50 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex gap-3 py-5 overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-3 px-8 py-4 rounded-2xl font-medium transition-all ${
                    isActive 
                      ? 'text-white shadow-xl' 
                      : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-2xl`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'drop-shadow-sm' : ''}`} />
                  <span className="relative z-10 text-base whitespace-nowrap">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative z-10 w-2 h-2 bg-white/70 rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'style-extractor' && <StyleExtractorTab />}
            {activeTab === 'image-generator' && <ImageGeneratorTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}
