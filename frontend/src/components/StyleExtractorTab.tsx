'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, X, Sparkles, CheckCircle2, AlertCircle, FileJson, ArrowRight } from 'lucide-react';
import { styleExtractApi, StyleProfile } from '@/lib/api';

export default function StyleExtractorTab() {
  const [images, setImages] = useState<File[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [profileName, setProfileName] = useState('');
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const extractingRef = useRef(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length < 1) {
      setError('Please select at least 1 image');
      return;
    }
    if (files.length > 20) {
      setError('Maximum 20 images allowed');
      return;
    }
    setImages(files);
    // Initialize image names from filenames (remove extension)
    setImageNames(files.map(f => f.name.replace(/\.[^/.]+$/, '')));
    setError(null);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImageNames(imageNames.filter((_, i) => i !== index));
    setStyleProfile(null);
  };

  const extractStyle = async (imageFiles: File[]) => {
    if (extractingRef.current) return;
    
    extractingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await styleExtractApi.extract(imageFiles, profileName || undefined);
      setStyleProfile(result);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message
        || err.message 
        || 'Failed to extract style';
      
      const briaError = err.response?.data?.briaApiError;
      const fullError = briaError 
        ? `${errorMessage}\n\nBria API Error: ${JSON.stringify(briaError, null, 2)}`
        : errorMessage;
      
      console.error('Style extraction error:', {
        message: errorMessage,
        response: err.response?.data,
        briaError,
      });
      
      setError(fullError);
      setStyleProfile(null);
    } finally {
      setLoading(false);
      extractingRef.current = false;
    }
  };

  // Auto-extract when at least 1 image is uploaded
  useEffect(() => {
    if (images.length >= 1 && !loading && !extractingRef.current) {
      extractStyle(images);
    }
  }, [images.length]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden">
            {/* Profile Name Input */}
            <div className="p-5 border-b border-gray-200/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
              <label className="block mb-2">
                <span className="text-sm font-semibold text-[#1d1d1f]">Style Profile Name</span>
                <span className="text-xs text-[#86868b] ml-2">(optional - auto-generated if empty)</span>
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Leave empty for auto-generated name..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-0 focus:border-[#0071e3] transition-colors bg-white/90"
              />
              <p className="text-xs text-[#86868b] mt-1.5">
                💡 If left empty, we'll automatically generate a descriptive name based on the detected style (e.g., "Blue Hour Urban" or "Warm Golden Natural")
              </p>
            </div>
            
            <div className="p-5 border-b border-gray-200/50">
              <h3 className="text-xl font-semibold text-[#1d1d1f] mb-1">Upload Images</h3>
              <p className="text-sm text-[#86868b]">Select 1-20 images that represent your style</p>
            </div>

            <div className="p-6">
              {images.length === 0 ? (
                <label className="block cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-3 border-dashed border-gray-300 rounded-3xl p-10 text-center transition-all group-hover:border-[#0071e3] group-hover:bg-blue-50/50 min-h-[280px] flex flex-col items-center justify-center"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="w-10 h-10 text-[#0071e3]" />
                    </div>
                    <h4 className="text-lg font-semibold text-[#1d1d1f] mb-2">Drop images here</h4>
                    <p className="text-sm text-[#86868b] mb-4">or click to browse</p>
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium shadow-lg shadow-blue-500/30">
                      <Upload className="w-4 h-4" />
                      Choose Images
                    </div>
                  </motion.div>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md"
                      >
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs font-medium truncate">{image.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-[#1d1d1f] font-medium flex-1">
                      {images.length} images selected
                    </span>
                    <label className="px-4 py-2 bg-white border border-gray-200 text-[#1d1d1f] rounded-full text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                      Change
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right: Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[#1d1d1f] mb-1">Style Profile</h3>
                  <p className="text-sm text-[#86868b]">
                    {loading ? 'Analyzing...' : styleProfile ? 'Ready to use' : 'Waiting for images'}
                  </p>
                </div>
                {loading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
                  >
                    <Loader2 className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>
            </div>

            <div className="p-8 min-h-[480px] flex items-center justify-center">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h4 className="text-lg font-semibold text-[#1d1d1f] mb-2">Extracting Style DNA</h4>
                  <p className="text-sm text-[#86868b]">Analyzing your brand's visual characteristics...</p>
                </motion.div>
              ) : styleProfile ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-6"
                >
                  {/* Summary */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-green-900">Style Extracted!</h4>
                        <p className="text-sm text-green-700">
                          {styleProfile.images.length} variant{styleProfile.images.length !== 1 ? 's' : ''} ready
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-green-700 font-medium mb-1">Processed</p>
                        <p className="text-2xl font-bold text-green-900">{styleProfile.processedImages}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-green-700 font-medium mb-1">Success</p>
                        <p className="text-2xl font-bold text-green-900">{styleProfile.images.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Variants Preview */}
                  <div className="space-y-3">
                    {styleProfile.images.slice(0, 3).map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#0071e3] hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[#0071e3]">
                              {(item.imageIndex ?? index) + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1d1d1f] mb-1">
                              Style Variant {(item.imageIndex ?? index) + 1}
                            </p>
                            <p className="text-xs text-[#86868b] font-mono">Seed: {item.seed}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {styleProfile.images.length > 3 && (
                      <div className="text-center py-2">
                        <span className="text-xs text-[#86868b]">
                          +{styleProfile.images.length - 3} more variant{styleProfile.images.length - 3 !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={() => {
                        const saved = localStorage.getItem('styleProfiles');
                        const profiles = saved ? JSON.parse(saved) : [];
                        profiles.push(styleProfile);
                        localStorage.setItem('styleProfiles', JSON.stringify(profiles));
                        
                        // Show success feedback
                        const button = document.activeElement as HTMLButtonElement;
                        const originalText = button.innerHTML;
                        button.innerHTML = '<svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Saved!';
                        button.disabled = true;
                        setTimeout(() => {
                          button.innerHTML = originalText;
                          button.disabled = false;
                        }, 2000);
                      }}
                      className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 text-base"
                    >
                      <Sparkles className="w-5 h-5" />
                      Save & Use in Generator
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(styleProfile, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                        const exportFileDefaultName = `style-profile-${Date.now()}.json`;
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      className="w-full py-3 px-6 bg-white border border-gray-200 text-[#1d1d1f] rounded-full font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileJson className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-[#1d1d1f] mb-2">No Profile Yet</h4>
                  <p className="text-sm text-[#86868b]">Upload 5 images to extract your brand's style</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
