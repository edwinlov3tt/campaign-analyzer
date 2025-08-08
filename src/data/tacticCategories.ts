// Enhanced tactic categories mapping

export interface SubProduct {
  subProductAliasCode: string;
  medium: string;
  kpi: string[];
  dataValue: string;
}

export interface TacticInfo {
  platform: string[];
  category: string;
  product: string;
  subProducts: Record<string, SubProduct>;
}

export interface TacticCategories {
  platforms: Record<string, string[]>;
  tactics: Record<string, TacticInfo>;
}

import tacticCategoriesJson from './enhanced_tactic_categories.json';

export const tacticCategories: TacticCategories = tacticCategoriesJson;

// Helper function to map a tactic to its product and subproduct
export function mapTacticToProduct(tacticName: string): { product: string; subProducts: string[] } | null {
  // Direct match
  if (tacticCategories.tactics[tacticName]) {
    const tactic = tacticCategories.tactics[tacticName];
    return {
      product: tactic.product,
      subProducts: Object.keys(tactic.subProducts)
    };
  }

  // Search through all tactics for partial matches
  const tacticLower = tacticName.toLowerCase();
  for (const [key, value] of Object.entries(tacticCategories.tactics)) {
    if (key.toLowerCase().includes(tacticLower) || tacticLower.includes(key.toLowerCase())) {
      return {
        product: value.product,
        subProducts: Object.keys(value.subProducts)
      };
    }
  }

  // Check if it's a platform name
  for (const [platform, aliases] of Object.entries(tacticCategories.platforms)) {
    if (platform.toLowerCase() === tacticLower || 
        aliases.some(alias => alias.toLowerCase() === tacticLower)) {
      // Find tactics that use this platform
      const matchingTactics = Object.entries(tacticCategories.tactics)
        .filter(([_, tactic]) => tactic.platform.some(p => p.toLowerCase() === tacticLower));
      
      if (matchingTactics.length > 0) {
        return {
          product: matchingTactics[0][1].product,
          subProducts: matchingTactics[0][1].subProducts ? Object.keys(matchingTactics[0][1].subProducts) : []
        };
      }
    }
  }

  return null;
}

// Function to get all available products
export function getAllProducts(): string[] {
  const products = new Set<string>();
  Object.values(tacticCategories.tactics).forEach(tactic => {
    products.add(tactic.product);
  });
  return Array.from(products);
}

// Function to normalize tactic names (remove AAT, etc.)
export function normalizeTacticName(tacticName: string): string {
  // Keep YouTube unchanged
  if (tacticName.toLowerCase().includes('youtube')) {
    return tacticName;
  }
  
  // Remove AAT
  if (tacticName.toUpperCase() === 'AAT') {
    return 'Advanced Audience Targeting';
  }
  
  // Map RTG
  if (tacticName.toUpperCase() === 'RTG') {
    return 'Retargeting';
  }
  
  return tacticName;
}