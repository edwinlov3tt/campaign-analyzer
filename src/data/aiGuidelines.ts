// AI Analysis Guidelines for Campaign Performance Analyzer
// These guidelines ensure consistent, high-quality output across all users

export const AI_GUIDELINES = {
  // Core analysis structure
  reportStructure: {
    sections: [
      "Executive Summary",
      "Performance Analysis by Tactic",
      "Trend Analysis",
      "Strategic Optimization Recommendations",
      "Analysis Time Range"
    ],
    sectionRequirements: {
      executiveSummary: {
        description: "High-level overview of campaign performance",
        bulletPoints: 3,
        focus: ["Overall performance", "Key achievements", "Critical insights"]
      },
      performanceByTactic: {
        description: "Individual analysis for each tactic",
        includePerTactic: [
          "Performance metrics with single averages (not ranges)",
          "Geographic performance insights",
          "Device/platform performance where relevant",
          "Creative performance highlights",
          "Specific strengths and opportunities"
        ]
      },
      trendAnalysis: {
        description: "Temporal patterns and trends",
        subsections: [
          "Monthly Performance Trends",
          "Pattern Analysis (Geographic, Creative, or other relevant patterns)"
        ]
      },
      strategicOptimization: {
        description: "Actionable recommendations organized by category",
        categories: [
          "Geographic Optimization",
          "Creative Strategy",
          "Audience Development",
          "Measurement Improvements"
        ]
      }
    }
  },

  // Formatting guidelines
  formatting: {
    metrics: {
      style: "single_average", // Never use ranges like "2.5-3.5%"
      precision: {
        percentage: 2, // e.g., 2.45%
        currency: 2,   // e.g., $12.34
        whole: 0       // e.g., 1,234
      },
      includeContext: true // Always explain if metric is good/bad/average
    },
    tone: {
      style: "constructive",
      characteristics: [
        "Professional yet accessible",
        "Focus on opportunities over problems",
        "Data-driven with clear reasoning",
        "Actionable and specific"
      ]
    }
  },

  // Analysis parameters
  analysisRules: {
    compareToObjective: true,
    highlightTopPerformers: true,
    identifyBottomPerformers: true,
    suggestOptimizations: true,
    prioritizeByImpact: true,
    considerSeasonality: true
  },

  // Time range specific instructions
  timeRangeInstructions: {
    "Last 30 days": "Focus on recent performance trends and immediate optimization opportunities",
    "Last 60 days": "Analyze month-over-month changes and emerging patterns",
    "Last 90 days": "Evaluate quarterly performance and seasonal trends",
    "Last 120 days": "Assess campaign evolution and long-term effectiveness",
    "Last 150 days": "Analyze extended performance patterns and strategic shifts",
    "Last 180 days": "Provide comprehensive half-year analysis with strategic insights",
    "Last Month": "Deep dive into previous month's complete performance data",
    "This Month": "Analyze month-to-date performance with projections",
    "Custom": "Analyze performance within the specified date range"
  },

  // Tactic-specific guidelines
  tacticGuidelines: {
    "Display": {
      focusAreas: ["Viewability", "CTR", "Geographic performance", "Creative effectiveness"],
      keyMetrics: ["Impressions", "CTR", "CPC", "Conversions", "View rate"]
    },
    "Meta": {
      focusAreas: ["Platform performance", "Audience engagement", "Creative resonance", "Cost efficiency"],
      keyMetrics: ["Reach", "Engagement rate", "CPM", "Link clicks", "Video completion"]
    },
    "Search": {
      focusAreas: ["Keyword performance", "Quality score", "Ad position", "Conversion optimization"],
      keyMetrics: ["Impressions", "CTR", "CPC", "Conversion rate", "ROAS"]
    },
    "Video": {
      focusAreas: ["View rates", "Completion rates", "Audience retention", "Platform optimization"],
      keyMetrics: ["Views", "View rate", "Completion rate", "CPV", "Engagement"]
    }
  },

  // Output quality checks
  qualityChecks: [
    "All metrics are presented as single values, not ranges",
    "Each tactic has individual analysis section",
    "Recommendations are specific and actionable",
    "Analysis considers campaign objectives",
    "Trends are clearly identified with supporting data",
    "Geographic insights are included where relevant",
    "Creative performance is assessed",
    "Time range context is properly applied"
  ]
};

// Function to generate system prompt based on guidelines
export function generateSystemPrompt(
  timeRange: string,
  campaignObjective?: string,
  customModifiers?: {
    temperature?: number;
    tone?: string;
    additionalInstructions?: string;
  }
): string {
  const timeInstruction = AI_GUIDELINES.timeRangeInstructions[timeRange as keyof typeof AI_GUIDELINES.timeRangeInstructions] || AI_GUIDELINES.timeRangeInstructions["Custom"];
  
  return `You are an expert digital marketing analyst. Analyze the campaign performance data following these strict guidelines:

REPORT STRUCTURE (MUST FOLLOW THIS EXACT ORDER):
${AI_GUIDELINES.reportStructure.sections.map((section, i) => `${i + 1}. ${section}`).join('\n')}

SECTION REQUIREMENTS:

1. Executive Summary:
- Provide ${AI_GUIDELINES.reportStructure.sectionRequirements.executiveSummary.bulletPoints} bullet points covering: ${AI_GUIDELINES.reportStructure.sectionRequirements.executiveSummary.focus.join(', ')}
- Keep it high-level and impactful

2. Performance Analysis by Tactic:
- Create a separate subsection for EACH tactic in the data
- For each tactic include: ${AI_GUIDELINES.reportStructure.sectionRequirements.performanceByTactic.includePerTactic.join(', ')}
- Present metrics as single averages (e.g., "CTR: 2.45%" NOT "CTR: 2-3%")

3. Trend Analysis:
- Include subsections for: ${AI_GUIDELINES.reportStructure.sectionRequirements.trendAnalysis.subsections.join(', ')}
- Use actual data to support trend identification
- Highlight significant changes or patterns

4. Strategic Optimization Recommendations:
- Organize into these categories: ${AI_GUIDELINES.reportStructure.sectionRequirements.strategicOptimization.categories.join(', ')}
- Make recommendations specific and actionable
- Prioritize by potential impact

TIME RANGE CONTEXT: ${timeInstruction}

${campaignObjective ? `CAMPAIGN OBJECTIVE: ${campaignObjective} - Ensure all analysis relates back to this objective.` : ''}

FORMATTING REQUIREMENTS:
- Present all metrics as single values with appropriate precision
- Use ${customModifiers?.tone || AI_GUIDELINES.formatting.tone.style} tone
- Focus on opportunities over problems
- Be specific with recommendations

${customModifiers?.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${customModifiers.additionalInstructions}` : ''}

Remember: Each tactic gets its own detailed analysis section. Do not group tactics into generic categories like "Funnel Analysis" or "Device Performance" - analyze each tactic individually.`;
}