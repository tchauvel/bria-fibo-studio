/**
 * Profile Name Generator
 * 
 * Analyzes structured prompts to generate short, descriptive profile names
 * based on the visual style characteristics detected in the images.
 */

interface StyleAttributes {
  lighting?: string[];
  colors?: string[];
  mood?: string[];
  atmosphere?: string[];
  time?: string[];
  weather?: string[];
  location?: string[];
  technical?: string[];
}

/**
 * Extracts key style attributes from structured prompt JSON
 */
function extractStyleAttributes(structuredPrompt: string): StyleAttributes {
  try {
    const parsed = JSON.parse(structuredPrompt);
    const attributes: StyleAttributes = {
      lighting: [],
      colors: [],
      mood: [],
      atmosphere: [],
      time: [],
      weather: [],
      location: [],
      technical: [],
    };

    // Extract lighting information
    if (parsed.lighting) {
      const lightingStr = typeof parsed.lighting === 'string' ? parsed.lighting : JSON.stringify(parsed.lighting);
      attributes.lighting = extractKeywords(lightingStr, ['warm', 'cold', 'soft', 'harsh', 'natural', 'artificial', 'golden', 'blue', 'dramatic', 'even', 'high contrast', 'low key', 'bright', 'dim']);
    }

    // Extract color information
    if (parsed.colors || parsed.color_palette || parsed.palette) {
      const colorData = parsed.colors || parsed.color_palette || parsed.palette;
      attributes.colors = extractColorDescriptors(colorData);
    }

    // Extract mood
    if (parsed.mood || parsed.vibe) {
      const moodStr = parsed.mood || parsed.vibe;
      attributes.mood = extractKeywords(moodStr, ['serene', 'dramatic', 'peaceful', 'energetic', 'calm', 'vibrant', 'moody', 'cheerful', 'melancholic', 'mysterious', 'playful', 'elegant']);
    }

    // Extract atmosphere
    if (parsed.atmosphere) {
      attributes.atmosphere = extractKeywords(parsed.atmosphere, ['crisp', 'hazy', 'foggy', 'clear', 'ethereal', 'intimate', 'spacious', 'cozy', 'urban', 'rural']);
    }

    // Extract time of day
    if (parsed.time_of_day || parsed.time) {
      const timeStr = parsed.time_of_day || parsed.time;
      attributes.time = extractKeywords(timeStr, ['morning', 'afternoon', 'evening', 'night', 'dawn', 'dusk', 'twilight', 'golden hour', 'blue hour', 'midday']);
    }

    // Extract weather
    if (parsed.weather) {
      attributes.weather = extractKeywords(parsed.weather, ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'overcast', 'clear', 'stormy']);
    }

    // Extract location/environment
    if (parsed.environment || parsed.location || parsed.setting) {
      const locationStr = parsed.environment || parsed.location || parsed.setting;
      attributes.location = extractKeywords(locationStr, ['urban', 'city', 'street', 'nature', 'indoor', 'outdoor', 'studio', 'landscape', 'portrait', 'architectural']);
    }

    // Extract technical style
    if (parsed.technical || parsed.photography || parsed.camera) {
      const techData = parsed.technical || parsed.photography || parsed.camera;
      const techStr = typeof techData === 'string' ? techData : JSON.stringify(techData);
      attributes.technical = extractKeywords(techStr, ['shallow depth', 'bokeh', 'wide angle', 'telephoto', 'macro', 'long exposure', 'sharp']);
    }

    return attributes;
  } catch (error) {
    console.error('Failed to extract style attributes:', error);
    return {};
  }
}

/**
 * Extracts matching keywords from text
 */
function extractKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Extracts color descriptors from color data
 */
function extractColorDescriptors(colorData: any): string[] {
  const descriptors: string[] = [];
  
  if (Array.isArray(colorData)) {
    // Analyze hex colors or color names
    const colors = colorData.map(c => String(c).toLowerCase());
    
    // Detect cool vs warm colors
    const coolColors = ['blue', 'cyan', 'teal', 'turquoise', '#0', '#1', '#2', '#3', '#4', '#5'];
    const warmColors = ['red', 'orange', 'yellow', 'gold', '#f', '#e', '#d', '#c'];
    
    const hasCool = colors.some(c => coolColors.some(cool => c.includes(cool)));
    const hasWarm = colors.some(c => warmColors.some(warm => c.includes(warm)));
    
    if (hasCool && !hasWarm) descriptors.push('cool');
    if (hasWarm && !hasCool) descriptors.push('warm');
    if (hasCool && hasWarm) descriptors.push('balanced');
    
    // Detect specific color tones
    if (colors.some(c => c.includes('blue'))) descriptors.push('blue');
    if (colors.some(c => c.includes('gold') || c.includes('yellow'))) descriptors.push('golden');
    if (colors.some(c => c.includes('gray') || c.includes('grey'))) descriptors.push('neutral');
  } else if (typeof colorData === 'string') {
    descriptors.push(...extractKeywords(colorData, ['cool', 'warm', 'vibrant', 'muted', 'pastel', 'bold', 'neutral']));
  }
  
  return descriptors;
}

/**
 * Aggregates attributes from multiple structured prompts
 */
function aggregateAttributes(structuredPrompts: Array<{ structured_prompt: string }>): StyleAttributes {
  const allAttributes: StyleAttributes = {
    lighting: [],
    colors: [],
    mood: [],
    atmosphere: [],
    time: [],
    weather: [],
    location: [],
    technical: [],
  };

  for (const prompt of structuredPrompts) {
    const attrs = extractStyleAttributes(prompt.structured_prompt);
    
    // Merge all attributes
    Object.keys(attrs).forEach(key => {
      const k = key as keyof StyleAttributes;
      if (attrs[k] && allAttributes[k]) {
        allAttributes[k] = [...(allAttributes[k] || []), ...(attrs[k] || [])];
      }
    });
  }

  // Deduplicate
  Object.keys(allAttributes).forEach(key => {
    const k = key as keyof StyleAttributes;
    if (allAttributes[k]) {
      allAttributes[k] = Array.from(new Set(allAttributes[k]));
    }
  });

  return allAttributes;
}

/**
 * Counts frequency of each attribute value
 */
function getTopAttributes(attributes: StyleAttributes, limit: number = 3): string[] {
  const allValues: string[] = [];
  
  // Priority order for attribute types
  const priorityOrder: Array<keyof StyleAttributes> = [
    'time',
    'weather', 
    'location',
    'lighting',
    'mood',
    'colors',
    'atmosphere',
    'technical',
  ];
  
  for (const key of priorityOrder) {
    if (attributes[key] && attributes[key]!.length > 0) {
      allValues.push(...attributes[key]!);
    }
  }
  
  // Count frequency
  const frequency = new Map<string, number>();
  allValues.forEach(val => {
    frequency.set(val, (frequency.get(val) || 0) + 1);
  });
  
  // Sort by frequency and take top N
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([val]) => val);
}

/**
 * Capitalizes first letter of each word
 */
function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates a short, descriptive profile name from structured prompts
 * 
 * @param structuredPrompts - Array of structured prompts from style extraction
 * @param maxLength - Maximum length of the generated name (default: 40)
 * @returns A short, descriptive profile name
 * 
 * Examples:
 * - "Winter Blue Hour City"
 * - "Warm Golden Natural Light"
 * - "Moody Urban Night"
 * - "Soft Morning Nature"
 */
export function generateProfileName(
  structuredPrompts: Array<{ structured_prompt: string }>,
  maxLength: number = 40
): string {
  if (!structuredPrompts || structuredPrompts.length === 0) {
    return 'Untitled Style';
  }

  try {
    // Aggregate attributes from all prompts
    const attributes = aggregateAttributes(structuredPrompts);
    
    console.log('📝 Generating profile name from attributes:', attributes);
    
    // Get top 3-4 most common descriptive attributes
    const topAttributes = getTopAttributes(attributes, 4);
    
    if (topAttributes.length === 0) {
      return 'Custom Style Profile';
    }
    
    // Build name from top attributes
    let name = capitalizeWords(topAttributes.join(' '));
    
    // Trim if too long
    if (name.length > maxLength) {
      const words = name.split(' ');
      while (words.length > 2 && words.join(' ').length > maxLength) {
        words.pop();
      }
      name = words.join(' ');
    }
    
    console.log('✨ Generated profile name:', name);
    
    return name || 'Style Profile';
  } catch (error) {
    console.error('Failed to generate profile name:', error);
    return 'Style Profile';
  }
}

