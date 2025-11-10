'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Download, Image as ImageIcon, Wand2, FileJson, Trash2, ChevronRight, Check, Plus } from 'lucide-react';
import { imageGeneratorApi, StyleProfile, StyleDNA } from '@/lib/api';

interface GeneratedImage {
  url: string;
  prompt: string;
  seed: number;
  variantIndex: number;
  styleDNA?: StyleDNA;
}

export default function ImageGeneratorTab() {
  const [savedProfiles, setSavedProfiles] = useState<StyleProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<StyleProfile | null>(null);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number>(0);
  const [subject, setSubject] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useStyleDnaParser, setUseStyleDnaParser] = useState(true);
  const [numberOfVariations, setNumberOfVariations] = useState<number>(1);

  useEffect(() => {
    const profiles = loadSavedProfiles();
    setSavedProfiles(profiles);
  }, []);

  const loadSavedProfiles = (): StyleProfile[] => {
    try {
      const stored = localStorage.getItem('styleProfiles');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load style profiles:', e);
      return [];
    }
  };

  const saveProfile = (profile: StyleProfile) => {
    const profiles = loadSavedProfiles();
    profiles.push(profile);
    localStorage.setItem('styleProfiles', JSON.stringify(profiles));
    setSavedProfiles(profiles);
  };

  const deleteProfile = (index: number) => {
    const profiles = loadSavedProfiles();
    profiles.splice(index, 1);
    localStorage.setItem('styleProfiles', JSON.stringify(profiles));
    setSavedProfiles(profiles);
    if (selectedProfile === savedProfiles[index]) {
      setSelectedProfile(null);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const profile = JSON.parse(event.target?.result as string) as StyleProfile;
        if (profile.images && Array.isArray(profile.images)) {
          saveProfile(profile);
        } else {
          setError('Invalid style profile format');
        }
      } catch (err) {
        setError('Failed to import style profile');
      }
    };
    reader.readAsText(file);
  };

  const generateWithStyle = async (variantIndex: number, seedOffset: number = 0) => {
    if (!selectedProfile || selectedProfile.images.length === 0) {
      setError('Please select a style profile');
      return;
    }
    if (!subject.trim()) {
      setError('Please describe what you want to create');
      return;
    }

    const selectedStyle = selectedProfile.images[variantIndex];
    
    setLoading(true);
    setError(null);

    try {
      // Add offset to seed for variations while maintaining style influence
      const seedToUse = selectedStyle.seed + seedOffset;
      
      console.log(`Generating with style variant ${variantIndex + 1}:`, {
        subject: subject.trim(),
        originalSeed: selectedStyle.seed,
        seedWithOffset: seedToUse,
        seedOffset,
        hasStructuredPrompt: !!selectedStyle.structured_prompt,
        useStyleDnaParser,
      });

      const result = await imageGeneratorApi.generate({
        structured_prompt: selectedStyle.structured_prompt,
        prompt: subject.trim(), // Just the subject - backend will enhance if parser enabled
        seed: seedToUse, // Use seed with offset for variation
        use_style_dna_parser: useStyleDnaParser,
      });

      console.log(`Variant ${variantIndex + 1} generated:`, {
        seed: result.seed,
        requestedSeed: seedToUse,
        seedOffset,
      });

      const newImage: GeneratedImage = {
        url: result.image_url,
        prompt: subject.trim(),
        seed: result.seed,
        variantIndex,
        styleDNA: result.style_dna,
      };

      setGeneratedImages(prev => [...prev, newImage]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message
        || err.message 
        || 'Failed to generate image';
      console.error(`Variant ${variantIndex + 1} failed:`, errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateMultipleVariants = async () => {
    if (!selectedProfile || !subject.trim()) return;
    
    setGeneratedImages([]);
    setError(null);

    console.log(`Generating ${numberOfVariations} variations...`);
    console.log(`Available style variants: ${selectedProfile.images.length}`);

    // Generate the requested number of variations
    // If we have fewer variants than requested, cycle through them
    for (let i = 0; i < numberOfVariations; i++) {
      // Cycle through available variants using modulo
      const variantIndex = i % selectedProfile.images.length;
      
      // Calculate how many times we've cycled through all variants
      const cycleNumber = Math.floor(i / selectedProfile.images.length);
      
      // Add offset to seed for variations (0 for first cycle, then increments)
      // This keeps the style influence but creates variation
      const seedOffset = cycleNumber * 1000; // Use 1000 as offset multiplier for clear separation
      
      console.log(`Generation ${i + 1}/${numberOfVariations}: Using style variant ${variantIndex + 1} (seed offset: ${seedOffset})`);
      
      await generateWithStyle(variantIndex, seedOffset);
    }
  };

  // Helper to format Style DNA values (handles strings, arrays, objects)
  const formatDnaValue = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      // Convert object to readable format
      const values = Object.values(value).filter(v => v);
      return values.length > 0 ? values.join(', ') : JSON.stringify(value);
    }
    return String(value);
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `style-${index + 1}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Style Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1d1d1f]">Your Styles</h3>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <FileJson className="w-5 h-5 text-[#86868b] hover:text-[#0071e3] transition-colors" />
                </label>
              </div>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
              {savedProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-[#86868b] mb-4">No saved styles yet</p>
                  <p className="text-xs text-[#86868b]">
                    Go to Style Extractor to create one
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedProfiles.map((profile, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedProfile(profile);
                        setSelectedStyleIndex(0);
                        setGeneratedImages([]);
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedProfile === profile
                          ? 'border-[#0071e3] bg-blue-50/50 shadow-lg'
                          : 'border-gray-200 bg-white/50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-[#1d1d1f] pr-2">
                          {profile.name || `Style ${index + 1}`}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProfile(index);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#86868b]">
                        {profile.images.length} style variant{profile.images.length !== 1 ? 's' : ''}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Generation Interface */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProfile ? (
            <>
              {/* Subject Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
              >
                <div className="p-5 border-b border-gray-200/50">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1">What do you want to create?</h3>
                  <p className="text-xs text-[#86868b]">
                    Describe the subject - it will be rendered in your extracted style
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <textarea
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., a modern coffee shop, a person walking with umbrella, snowy mountain landscape, urban street at night..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:ring-0 focus:border-[#0071e3] resize-none transition-colors bg-white/50"
                    rows={2}
                  />

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-3">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          id="dna-parser-toggle"
                          checked={useStyleDnaParser}
                          onChange={(e) => {
                            console.log('DNA Parser toggled:', e.target.checked);
                            setUseStyleDnaParser(e.target.checked);
                          }}
                          className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer mt-0.5"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-purple-900">
                          🧬 Style DNA Parser {useStyleDnaParser && '(Active)'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedProfile && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-xs text-gray-700">
                          <strong>Selected Style:</strong> {selectedProfile.name} • {selectedProfile.images.length} variant{selectedProfile.images.length !== 1 ? 's' : ''} • Seeds: {selectedProfile.images.slice(0, 3).map(img => img.seed).join(', ')}
                          {selectedProfile.images.length > 3 && '...'}
                        </p>
                        {numberOfVariations > selectedProfile.images.length && (
                          <p className="text-xs text-purple-600 mt-1.5">
                            ℹ️ Generating {numberOfVariations} images with {selectedProfile.images.length} variant{selectedProfile.images.length !== 1 ? 's' : ''} - variants will be reused
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Number of Variations Selector */}
                  <div className="bg-white/80 border-2 border-gray-200 rounded-2xl p-3">
                    <label className="block mb-2">
                      <span className="text-xs font-semibold text-[#1d1d1f]">Number of Variations</span>
                      <span className="text-xs text-[#86868b] ml-2">
                        ({selectedProfile?.images.length || 0} variant{(selectedProfile?.images.length || 0) !== 1 ? 's' : ''})
                      </span>
                    </label>
                    
                    <div className="grid grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((num) => {
                        const isSelected = numberOfVariations === num;
                        
                        return (
                          <button
                            key={num}
                            onClick={() => setNumberOfVariations(num)}
                            disabled={!selectedProfile}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                : selectedProfile
                                ? 'bg-gray-100 text-[#1d1d1f] hover:bg-gray-200'
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    
                    <p className="text-xs text-[#86868b] mt-3">
                      {!selectedProfile ? (
                        'Select a style profile to enable generation'
                      ) : numberOfVariations === 1 ? (
                        'Generate 1 image using the first style variant'
                      ) : selectedProfile && numberOfVariations > selectedProfile.images.length ? (
                        `Generate ${numberOfVariations} images (style variants will be reused)`
                      ) : (
                        `Generate ${numberOfVariations} images using different style variants`
                      )}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => generateMultipleVariants()}
                      disabled={loading || !subject.trim()}
                      className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating {numberOfVariations}...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Generate {numberOfVariations} Variation{numberOfVariations !== 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Generated Results */}
              {(generatedImages.length > 0 || error) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
                >
                  <div className="p-8 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-[#1d1d1f] mb-1">Your Results</h3>
                        <p className="text-sm text-[#86868b]">
                          {generatedImages.length} variation{generatedImages.length !== 1 ? 's' : ''} generated
                        </p>
                      </div>
                      {generatedImages.length > 0 && (
                        <button
                          onClick={() => {
                            setGeneratedImages([]);
                            setSubject('');
                          }}
                          className="px-4 py-2 bg-gray-100 text-[#1d1d1f] rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8">
                    {error ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <h4 className="text-lg font-semibold text-red-700 mb-2">Generation Failed</h4>
                        <p className="text-sm text-[#86868b] mb-4">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="px-6 py-2 bg-gray-100 text-[#1d1d1f] rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {generatedImages.map((img, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden relative group"
                          >
                            <img
                              src={img.url}
                              alt={`Style variant ${img.variantIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-4 max-h-full overflow-y-auto">
                                <p className="text-xs text-white/90 mb-1 font-medium">
                                  {selectedProfile?.name || 'Style Profile'} • Variant {img.variantIndex + 1} • Seed: {img.seed}
                                </p>
                                <p className="text-xs text-white/70 mb-2 line-clamp-2">
                                  {img.prompt}
                                </p>
                                
                                {img.styleDNA && (
                                  <div className="mb-3 space-y-1">
                                    <p className="text-xs text-purple-300 font-semibold">Style DNA Applied:</p>
                                    {img.styleDNA.lighting && (
                                      <p className="text-xs text-white/60">• Lighting: {formatDnaValue(img.styleDNA.lighting).substring(0, 50)}</p>
                                    )}
                                    {(img.styleDNA.color_palette || img.styleDNA.colors) && (
                                      <p className="text-xs text-white/60">• Colors: {formatDnaValue(img.styleDNA.color_palette || img.styleDNA.colors).substring(0, 50)}</p>
                                    )}
                                    {img.styleDNA.mood && (
                                      <p className="text-xs text-white/60">• Mood: {formatDnaValue(img.styleDNA.mood)}</p>
                                    )}
                                    {img.styleDNA.atmosphere && (
                                      <p className="text-xs text-white/60">• Atmosphere: {formatDnaValue(img.styleDNA.atmosphere)}</p>
                                    )}
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => downloadImage(img.url, index)}
                                  className="w-full py-2 bg-white/90 backdrop-blur-sm text-[#1d1d1f] rounded-lg text-xs font-medium hover:bg-white transition-colors flex items-center justify-center gap-2"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl p-16 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-12 h-12 text-[#0071e3]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-3">Select a Style to Begin</h3>
              <p className="text-[#86868b] mb-6 max-w-md mx-auto">
                Choose one of your saved photography styles from the left, then describe what you want to create in that style.
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 max-w-lg mx-auto text-left">
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-3">Example Workflow:</h4>
                <ol className="space-y-2 text-sm text-[#86868b]">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#0071e3] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Upload 5 winter city photos to Style Extractor</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#0071e3] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Extract the photographic style (lighting, mood, colors)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#0071e3] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Generate "a coffee shop" in that winter city style</span>
                  </li>
                </ol>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
