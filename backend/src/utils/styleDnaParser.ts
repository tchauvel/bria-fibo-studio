/**
 * Style DNA Parser
 * 
 * Parses Bria's structured_prompt JSON to extract ONLY style attributes
 * (lighting, colors, mood, atmosphere) and filters out scene-specific elements
 * (objects, subjects, specific compositions).
 * 
 * This enables true style transfer: applying visual characteristics to new subjects.
 */

export interface StyleDNA {
  lighting?: string | object;
  color_palette?: string[] | object;
  colors?: string[] | object;
  mood?: string;
  atmosphere?: string;
  tone?: string;
  technical?: {
    depth_of_field?: string;
    focus?: string;
    lens?: string;
    aperture?: string;
    iso?: string;
    shutter_speed?: string;
  };
  artistic_style?: string;
  photographic_style?: string;
  rendering_style?: string;
  time_of_day?: string;
  season?: string;
  weather?: string;
  // Original structured prompt for reference
  original?: any;
}

/**
 * Parses a structured_prompt JSON string and extracts style-only attributes
 */
export function parseStructuredPrompt(structuredPromptStr: string): StyleDNA {
  try {
    const parsed = JSON.parse(structuredPromptStr);
    
    console.log('📊 Parsing Structured Prompt:', {
      keys: Object.keys(parsed),
      fullObject: parsed,
    });

    // Extract style-related fields (ignore objects, subjects, compositions)
    const styleDNA: StyleDNA = {
      original: parsed,
    };

    // Lighting
    if (parsed.lighting) styleDNA.lighting = parsed.lighting;
    if (parsed.light) styleDNA.lighting = parsed.light;
    if (parsed.illumination) styleDNA.lighting = parsed.illumination;

    // Colors
    if (parsed.color_palette) styleDNA.color_palette = parsed.color_palette;
    if (parsed.colors) styleDNA.colors = parsed.colors;
    if (parsed.palette) styleDNA.color_palette = parsed.palette;

    // Mood & Atmosphere
    if (parsed.mood) styleDNA.mood = parsed.mood;
    if (parsed.atmosphere) styleDNA.atmosphere = parsed.atmosphere;
    if (parsed.tone) styleDNA.tone = parsed.tone;
    if (parsed.vibe) styleDNA.mood = parsed.vibe;

    // Technical photography details
    if (parsed.technical || parsed.camera || parsed.photography) {
      styleDNA.technical = {};
      const techSource = parsed.technical || parsed.camera || parsed.photography;
      
      if (techSource.depth_of_field) styleDNA.technical.depth_of_field = techSource.depth_of_field;
      if (techSource.dof) styleDNA.technical.depth_of_field = techSource.dof;
      if (techSource.focus) styleDNA.technical.focus = techSource.focus;
      if (techSource.lens) styleDNA.technical.lens = techSource.lens;
      if (techSource.aperture) styleDNA.technical.aperture = techSource.aperture;
      if (techSource.iso) styleDNA.technical.iso = techSource.iso;
      if (techSource.shutter_speed) styleDNA.technical.shutter_speed = techSource.shutter_speed;
    }

    // Artistic/rendering style
    if (parsed.artistic_style) styleDNA.artistic_style = parsed.artistic_style;
    if (parsed.photographic_style) styleDNA.photographic_style = parsed.photographic_style;
    if (parsed.rendering_style) styleDNA.rendering_style = parsed.rendering_style;
    if (parsed.style) styleDNA.artistic_style = parsed.style;

    // Environmental conditions (time, weather)
    if (parsed.time_of_day) styleDNA.time_of_day = parsed.time_of_day;
    if (parsed.time) styleDNA.time_of_day = parsed.time;
    if (parsed.season) styleDNA.season = parsed.season;
    if (parsed.weather) styleDNA.weather = parsed.weather;

    console.log('✨ Extracted Style DNA:', styleDNA);

    return styleDNA;
  } catch (error) {
    console.error('Failed to parse structured_prompt:', error);
    return {
      original: structuredPromptStr,
    };
  }
}

/**
 * Converts StyleDNA back into a descriptive prompt string
 * This prompt emphasizes style attributes without specifying objects/subjects
 */
export function styleDNAToPrompt(styleDNA: StyleDNA): string {
  const parts: string[] = [];

  if (styleDNA.lighting) {
    // Clean lighting to remove scene-specific references
    if (typeof styleDNA.lighting === 'string') {
      parts.push(`lighting: ${styleDNA.lighting}`);
    } else if (typeof styleDNA.lighting === 'object') {
      const lighting: any = styleDNA.lighting;
      // Only include general lighting characteristics, not directions/sources
      const cleanLighting: string[] = [];
      if (lighting.conditions) cleanLighting.push(lighting.conditions);
      if (lighting.quality) cleanLighting.push(lighting.quality);
      if (lighting.type) cleanLighting.push(lighting.type);
      // Skip "direction" as it often contains scene-specific references
      if (cleanLighting.length > 0) {
        parts.push(`lighting: ${cleanLighting.join(', ')}`);
      }
    }
  }

  if (styleDNA.color_palette || styleDNA.colors) {
    const colors = styleDNA.color_palette || styleDNA.colors;
    const colorStr = Array.isArray(colors) 
      ? colors.join(', ') 
      : JSON.stringify(colors);
    parts.push(`color palette: ${colorStr}`);
  }

  if (styleDNA.mood) {
    parts.push(`mood: ${styleDNA.mood}`);
  }

  if (styleDNA.atmosphere) {
    parts.push(`atmosphere: ${styleDNA.atmosphere}`);
  }

  if (styleDNA.tone) {
    parts.push(`tone: ${styleDNA.tone}`);
  }

  if (styleDNA.technical) {
    const tech = styleDNA.technical;
    if (tech.depth_of_field) parts.push(`depth of field: ${tech.depth_of_field}`);
    if (tech.focus) parts.push(`focus: ${tech.focus}`);
    if (tech.lens) parts.push(`lens: ${tech.lens}`);
    if (tech.aperture) parts.push(`aperture: ${tech.aperture}`);
  }

  if (styleDNA.artistic_style || styleDNA.photographic_style || styleDNA.rendering_style) {
    const style = styleDNA.artistic_style || styleDNA.photographic_style || styleDNA.rendering_style;
    parts.push(`style: ${style}`);
  }

  if (styleDNA.time_of_day) {
    parts.push(`time: ${styleDNA.time_of_day}`);
  }

  if (styleDNA.season) {
    parts.push(`season: ${styleDNA.season}`);
  }

  if (styleDNA.weather) {
    parts.push(`weather: ${styleDNA.weather}`);
  }

  return parts.join(', ');
}

/**
 * Creates a style transfer prompt by combining:
 * - User's new subject
 * - Extracted style DNA from reference images
 */
export function createStyleTransferPrompt(newSubject: string, styleDNA: StyleDNA): string {
  const styleDescription = styleDNAToPrompt(styleDNA);
  
  if (styleDescription) {
    return `${newSubject}, rendered with: ${styleDescription}`;
  }
  
  // Fallback if no style attributes were extracted
  return `${newSubject}, maintaining the same visual style, lighting, and atmosphere`;
}

/**
 * Creates a clean structured_prompt with ONLY style attributes
 * Uses WHITELIST approach: only include fields that are purely stylistic
 */
export function createStyleOnlyStructuredPrompt(styleDNA: StyleDNA): string {
  const original = styleDNA.original || {};
  const styleObj: any = {};
  
  // WHITELIST: Only these fields are allowed (pure style, no scene content)
  const styleFieldsWhitelist = [
    'lighting',
    'light',
    'illumination',
    'color_palette',
    'colors',
    'palette',
    'mood',
    'mood_atmosphere',
    'atmosphere',
    'tone',
    'vibe',
    'aesthetics',  // BUT we need to filter its sub-fields
    'photographic_characteristics',
    'technical',
    'camera',
    'photography',
    'artistic_style',
    'photographic_style',
    'rendering_style',
    'style',
    'style_medium',
    'time_of_day',
    'time',
    'season',
    'weather',
    'color_scheme'
  ];
  
  // Copy ONLY whitelisted fields
  for (const [key, value] of Object.entries(original)) {
    const lowerKey = key.toLowerCase();
    const isStyleField = styleFieldsWhitelist.some(allowed => lowerKey === allowed || lowerKey.includes(allowed));
    
    if (isStyleField && value) {
      // Special handling for aesthetics - filter out composition
      if (key === 'aesthetics' && typeof value === 'object') {
        const cleanAesthetics: any = {};
        for (const [subKey, subValue] of Object.entries(value)) {
          // Exclude composition from aesthetics
          if (!subKey.toLowerCase().includes('composition')) {
            cleanAesthetics[subKey] = subValue;
          }
        }
        if (Object.keys(cleanAesthetics).length > 0) {
          styleObj[key] = cleanAesthetics;
        }
      } else {
        styleObj[key] = value;
      }
    }
  }
  
  // Fallback: Ensure we have at least some style attributes from extracted styleDNA
  if (Object.keys(styleObj).length === 0) {
    if (styleDNA.lighting) styleObj.lighting = styleDNA.lighting;
    if (styleDNA.color_palette) styleObj.color_palette = styleDNA.color_palette;
    if (styleDNA.colors) styleObj.colors = styleDNA.colors;
    if (styleDNA.mood) styleObj.mood = styleDNA.mood;
    if (styleDNA.atmosphere) styleObj.atmosphere = styleDNA.atmosphere;
  }
  
  console.log('🎨 Original structured_prompt keys:', Object.keys(original));
  console.log('✂️  Whitelisted style-only keys:', Object.keys(styleObj));
  console.log('📊 Removed scene-specific fields:', 
    Object.keys(original).filter(k => !Object.keys(styleObj).includes(k)).join(', ')
  );
  
  return JSON.stringify(styleObj);
}

/**
 * Aggregates style DNA from multiple reference images
 * Useful when you have 5 reference images and want a combined style profile
 */
export function aggregateStyleDNA(styleDNAs: StyleDNA[]): StyleDNA {
  if (styleDNAs.length === 0) return {};
  if (styleDNAs.length === 1) return styleDNAs[0];

  // For now, return the first one as primary
  // In future, could implement intelligent merging/averaging
  console.log(`🔄 Aggregating ${styleDNAs.length} style profiles...`);
  
  return {
    ...styleDNAs[0],
    // Could add: aggregated mood, averaged colors, etc.
  };
}

