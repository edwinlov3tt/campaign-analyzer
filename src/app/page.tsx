// app/page.tsx - Next.js App Router compatible
'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Upload, FileText, Loader2, Calendar, Download, BarChart3, TrendingUp, Target, Copy, CheckCircle, Settings, Save, RotateCcw, MapPin, Image, ChevronDown, Info, ArrowLeft } from 'lucide-react';

// Environment variable for API key
const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

// Tactic to available tables mapping
const TACTIC_TABLES = {
  'Targeted Display': [
    'Monthly Performance',
    'Campaign Performance', 
    'Tactic Performance',
    'Creative Performance',
    'Creative By Name',
    'Creative By Size',
    'Creative Previews',
    'Performance by City',
    'Performance by Zip',
    'Device Performance',
    'Tracked Pixel Events by Day'
  ],
  'TrueView': [
    'Monthly Performance',
    'Campaign Performance',
    'Creative Performance',
    'Performance by DMA',
    'Performance by City',
    'Device Performance',
    'Placement Performance'
  ],
  'AAT': [
    'Monthly Performance',
    'Campaign Performance',
    'Tactic Performance',
    'Creative Performance',
    'Performance by City',
    'Performance by Zip',
    'Device Performance'
  ],
  'RTG': [
    'Monthly Performance',
    'Campaign Performance', 
    'Tactic Performance',
    'Creative Performance',
    'Performance by City',
    'Performance by Zip',
    'Device Performance'
  ],
  'Meta': [
    'Monthly Performance',
    'Performance by Platform',
    'Campaign Performance',
    'Ad Set Performance',
    'Facebook Ads Performance',
    'Instagram Ads Performance',
    'Conversion Events Total',
    'Conversion Events by Campaign',
    'Conversion Events by Creative',
    'Performance by Gender Clicks',
    'Region Performance',
    'DMA Performance',
    'Post Interactions by Campaign'
  ],
  'Geofencing': [
    'Monthly Performance',
    'Campaign Type',
    'Campaign Performance',
    'Tactic Performance',
    'Creative/Ad Performance',
    'Creative By Size',
    'Creative Previews',
    'Device Performance',
    'Performance by City',
    'Performance by Zip',
    'Conversion Zone Performance',
    'Target Fence Performance'
  ],
  'SEM': [
    'Monthly Performance',
    'Campaign Performance',
    'Client Performance',
    'Ad Group Performance',
    'Top 10 Keywords (Impressions)',
    'Top 10 Keywords (Clicks)',
    'Top 10 Keywords (Conversions)',
    'Overall Keyword Performance',
    'Device Performance',
    'Performance by City',
    'Performance by Zip'
  ],
  'Streaming TV': [
    'Monthly Performance',
    'Campaign Performance',
    'Tactic Performance',
    'Creative Performance',
    'Performance by City',
    'Performance by Zip',
    'Publisher Performance'
  ],
  'YouTube': [
    'Monthly Performance',
    'Campaign Performance',
    'Creative Performance',
    'Performance by DMA',
    'Performance by City',
    'Device Performance',
    'Placement Performance'
  ]
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              The application encountered an error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CampaignPerformanceAnalyzer = () => {
  const [jsonData, setJsonData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState('');
  const [companyFile, setCompanyFile] = useState(null);
  const [detectedTactics, setDetectedTactics] = useState([]);
  const [tacticUploads, setTacticUploads] = useState({});
  const [tacticData, setTacticData] = useState({});
  const [timeRange, setTimeRange] = useState('30');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);
  const [showReanalyzeModal, setShowReanalyzeModal] = useState(false);
  const [newFilesUploaded, setNewFilesUploaded] = useState([]);
  const [lastAnalysisFileCount, setLastAnalysisFileCount] = useState(0);
  const [currentView, setCurrentView] = useState('analyzer');
  const [modifierSettings, setModifierSettings] = useState(null);

  // Check for API key on mount
  useEffect(() => {
    if (!ANTHROPIC_API_KEY) {
      setError('Anthropic API key is not configured. Please add NEXT_PUBLIC_ANTHROPIC_API_KEY to your environment variables.');
    }
  }, []);

  // Load modifier settings on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedModifiers = localStorage.getItem('campaignModifiers');
      if (savedModifiers) {
        try {
          setModifierSettings(JSON.parse(savedModifiers));
        } catch (err) {
          console.error('Error loading modifier settings:', err);
        }
      }
    }
  }, []);

  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => {
        let value = v.trim().replace(/"/g, '');
        // Handle numbers with commas (like impressions)
        if (value.match(/^\d{1,3}(,\d{3})*$/)) {
          value = value.replace(/,/g, '');
        }
        return value;
      });
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return { headers, rows };
  };

  const extractTacticsFromJSON = (data: any) => {
    const tactics = new Set();
    
    if (data.lineItems) {
      data.lineItems.forEach((item: any) => {
        // Add products
        if (item.product) {
          tactics.add(item.product);
        }
        
        // Add sub-products
        if (item.subProduct) {
          const subProducts = Array.isArray(item.subProduct) ? item.subProduct : [item.subProduct];
          subProducts.forEach(sub => tactics.add(sub));
        }
        
        // Add tactic types
        if (item.tacticTypeSpecial) {
          const tacticTypes = Array.isArray(item.tacticTypeSpecial) ? item.tacticTypeSpecial : [item.tacticTypeSpecial];
          tacticTypes.forEach(tactic => tactics.add(tactic));
        }
      });
    }
    
    return Array.from(tactics).filter(tactic => TACTIC_TABLES[tactic as keyof typeof TACTIC_TABLES]);
  };

  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const data = JSON.parse(text);
      setJsonData(data);
      
      const tactics = extractTacticsFromJSON(data);
      setDetectedTactics(tactics);
      
      setError('');
    } catch (err: any) {
      setError('Error parsing JSON file: ' + err.message);
    }
  };

  const handleCompanyFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Remove Generation Costs section if present
      const cleanedText = text.replace(/Generation Costs:[\s\S]*$/i, '').trim();
      setCompanyInfo(cleanedText);
      setCompanyFile(file);
      setError('');
    } catch (err: any) {
      setError('Error reading company file: ' + err.message);
    }
  };

  const handleTacticTableUpload = async (event: React.ChangeEvent<HTMLInputElement>, tactic: string, tableName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      const parsed = parseCSVData(text);
      const key = `${tactic}_${tableName}`;
      
      // Track new files for re-analysis
      if (analysisResult) {
        const newFileEntry = `${tactic} - ${tableName}`;
        setNewFilesUploaded(prev => {
          if (!prev.includes(newFileEntry)) {
            return [...prev, newFileEntry];
          }
          return prev;
        });
      }
      
      setTacticUploads(prev => ({
        ...prev,
        [key]: file
      }));
      
      setTacticData(prev => ({
        ...prev,
        [key]: {
          fileName: file.name,
          tableName,
          tactic,
          ...parsed
        }
      }));
      
      setError('');
    } catch (err: any) {
      setError('Error parsing table file: ' + err.message);
    }
  };

  const clearAndReset = () => {
    setJsonData(null);
    setCompanyInfo('');
    setCompanyFile(null);
    setDetectedTactics([]);
    setTacticUploads({});
    setTacticData({});
    setTimeRange('30');
    setAnalysisResult(null);
    setError('');
    setCopySuccess(false);
    setShowInstructions(true);
    setSectionsCollapsed(false);
    setNewFilesUploaded([]);
    setLastAnalysisFileCount(0);
  };

  const handleReanalyzeClick = () => {
    if (analysisResult) {
      setShowReanalyzeModal(true);
    } else {
      generateAnalysis();
    }
  };

  const proceedWithReanalysis = () => {
    setShowReanalyzeModal(false);
    setNewFilesUploaded([]);
    generateAnalysis();
  };

  const copyAnalysisToClipboard = async () => {
    if (!analysisResult) return;
    
    const analysisText = `
CAMPAIGN PERFORMANCE ANALYSIS
=============================

EXECUTIVE SUMMARY
-----------------
${analysisResult.executiveSummary}

PERFORMANCE ANALYSIS
-------------------
${analysisResult.performanceAnalysis}

TREND ANALYSIS
--------------
${analysisResult.trendAnalysis}

OPTIMIZATION RECOMMENDATIONS
---------------------------
${analysisResult.recommendations}
    `.trim();
    
    try {
      await navigator.clipboard.writeText(analysisText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy analysis:', err);
    }
  };

  const generateAnalysis = async () => {
    if (!jsonData || !companyInfo.trim()) {
      setError('Please upload campaign JSON and provide company information');
      return;
    }

    if (!ANTHROPIC_API_KEY) {
      setError('Anthropic API key is not configured. Please check your environment variables.');
      return;
    }

    // Collapse sections and hide instructions when starting analysis
    setSectionsCollapsed(true);
    setShowInstructions(false);
    setIsLoading(true);
    setLoadingStatus('Analyzing campaign data and performance tables...');
    setError('');

    try {
      const currentFileCount = Object.keys(tacticData).length;
      setLastAnalysisFileCount(currentFileCount);

      // Build modifier context for AI prompt
      let modifierContext = '';
      if (modifierSettings) {
        modifierContext = `

BENCHMARK MODIFIERS:
Use these custom benchmarks when analyzing performance and making recommendations:
${JSON.stringify(modifierSettings, null, 2)}

When analyzing performance data, compare against these benchmarks rather than generic industry standards. 
Highlight when performance is above or below these customized benchmarks and provide insights based on these specific thresholds.`;
      }

      const prompt = `As a digital marketing analyst, analyze this campaign performance data and provide a comprehensive report.

COMPANY INFORMATION:
${companyInfo}

CAMPAIGN DATA:
${JSON.stringify(jsonData, null, 2)}

PERFORMANCE TABLE DATA:
${JSON.stringify(tacticData, null, 2)}

TIME RANGE: Last ${timeRange} days
${modifierContext}

Based on the uploaded performance tables${modifierSettings ? ' and custom benchmark modifiers' : ''}, provide detailed analysis including:

1. EXECUTIVE SUMMARY
   - Overall campaign performance overview with key metrics
   - Budget utilization and efficiency summary
   - Major achievements and challenges identified
   ${modifierSettings ? '- Performance comparison against custom benchmarks' : ''}

2. PERFORMANCE ANALYSIS BY TACTIC
   - Detailed breakdown for each tactic with uploaded data
   - CTR, conversion rates, and engagement metrics analysis${modifierSettings ? ' compared to your custom benchmarks' : ''}
   - Geographic performance insights (city/zip level where available)
   - Device performance breakdown
   - Creative performance comparisons where applicable
   ${modifierSettings ? '- Seasonal and monthly performance patterns analysis using your modifiers' : ''}

3. TREND ANALYSIS
   - Performance trends over the specified time period
   - Seasonal patterns or anomalies identified${modifierSettings ? ' based on your custom seasonal modifiers' : ''}
   - Cross-tactic performance comparisons
   - Geographic hotspots and underperforming areas

4. OPTIMIZATION RECOMMENDATIONS
   Focus on actionable insights based on the data${modifierSettings ? ' and custom benchmarks' : ''}:
   - Geographic targeting adjustments (expand successful areas, investigate underperforming regions)
   - Demographic targeting refinements based on performance data
   - Creative messaging optimization based on performance variations${modifierSettings ? ' and creative indicator benchmarks' : ''}
   - Audience segmentation opportunities
   - Tracking and measurement improvements
   - Content strategy adjustments based on engagement patterns
   
   DO NOT include technical bidding strategies, budget allocation suggestions, or platform-specific optimizations.

5. DATA VISUALIZATIONS
   Create 4-6 charts showing key insights from the uploaded tables:
   - Performance comparisons between tactics${modifierSettings ? ' with benchmark lines' : ''}
   - Geographic performance heatmaps
   - Device performance breakdowns
   - Creative performance rankings
   - Trend analysis over time

Format your response as JSON with this structure:
{
  "executiveSummary": "string",
  "performanceAnalysis": "string", 
  "trendAnalysis": "string",
  "recommendations": "string",
  "visualizations": [
    {
      "type": "bar_chart|line_chart|pie_chart|area_chart",
      "title": "string",
      "data": {
        "labels": ["string"],
        "values": [number],
        "colors": ["#cf0e0f", "#ff4444", "#ff6666", "#ff8888", "#ffaaaa"]
      }
    }
  ]
}

Use the red color palette throughout. Focus on insights that lead to actionable improvements in targeting, messaging, and measurement.${modifierSettings ? ' Leverage the custom benchmark modifiers to provide more precise and relevant recommendations.' : ''}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 16000,
          messages: [
            { 
              role: "user", 
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up response and parse JSON
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(responseText);
      
      setAnalysisResult(result);
    } catch (err: any) {
      setError('Error generating analysis: ' + err.message);
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const renderVisualization = (viz: any, index: number) => {
    const { type, title, data } = viz;
    const colors = data.colors || ['#cf0e0f', '#ff4444', '#ff6666', '#ff8888', '#ffaaaa'];

    const chartData = data.labels.map((label: string, idx: number) => ({
      name: label,
      value: data.values[idx]
    }));

    switch (type) {
      case 'bar_chart':
        return (
          <div key={index} className="mb-8">
            <h4 className="text-lg font-semibold mb-4" style={{color: '#cf0e0f'}}>{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={colors[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line_chart':
        return (
          <div key={index} className="mb-8">
            <h4 className="text-lg font-semibold mb-4" style={{color: '#cf0e0f'}}>{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'area_chart':
        return (
          <div key={index} className="mb-8">
            <h4 className="text-lg font-semibold mb-4" style={{color: '#cf0e0f'}}>{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[1]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie_chart':
        return (
          <div key={index} className="mb-8">
            <h4 className="text-lg font-semibold mb-4" style={{color: '#cf0e0f'}}>{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {chartData.map((entry: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  const getUploadedTablesCount = (tactic: string) => {
    const tacticTables = TACTIC_TABLES[tactic as keyof typeof TACTIC_TABLES] || [];
    return tacticTables.filter(table => tacticUploads[`${tactic}_${table}`]).length;
  };

  if (currentView === 'modifiers') {
    return <ModifierSettingsPage 
      detectedTactics={detectedTactics} 
      modifierSettings={modifierSettings}
      onBack={() => setCurrentView('analyzer')}
      onSave={(modifiers) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('campaignModifiers', JSON.stringify(modifiers));
        }
        setModifierSettings(modifiers);
        setCurrentView('analyzer');
      }}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{color: '#cf0e0f'}}>
            <BarChart3 className="inline-block mr-3" />
            Advanced Campaign Performance Analyzer
          </h1>
          
          <button
            onClick={() => setCurrentView('modifiers')}
            className="px-4 py-2 text-white rounded-lg hover:bg-red-700 flex items-center"
            style={{backgroundColor: '#cf0e0f'}}
          >
            <Settings className="w-4 h-4 mr-2" />
            Modifier Settings
          </button>
        </div>

        {/* API Key Warning */}
        {!ANTHROPIC_API_KEY && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900 mb-1">API Key Required</h3>
                <p className="text-sm text-yellow-700">
                  Add your Anthropic API key to the environment variables to enable AI analysis: 
                  <code className="bg-yellow-100 px-1 rounded text-xs ml-1">NEXT_PUBLIC_ANTHROPIC_API_KEY</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modifier Settings indicator when active */}
        {modifierSettings && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">Custom benchmark modifiers are active</span>
              <span className="text-green-600 text-sm ml-2">
                ({Object.keys(modifierSettings).length} tactics configured)
              </span>
            </div>
          </div>
        )}

        {/* Rest of the component stays the same... */}
        {/* Instructions */}
        {showInstructions && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border-l-4 relative" style={{borderLeftColor: '#cf0e0f'}}>
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-3" style={{color: '#cf0e0f'}}>How to Use</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Upload your campaign JSON file containing line items and order data</li>
              <li>Provide company information (upload text file or paste directly)</li>
              <li>Upload specific performance tables for each detected tactic (organized by table type)</li>
              <li>Optionally configure custom benchmark modifiers for more precise analysis</li>
              <li>Select your analysis time range</li>
              <li>Generate comprehensive AI analysis with detailed insights and recommendations</li>
            </ol>
          </div>
        )}

        {/* All other components remain the same... */}
        {/* For brevity, I'm not repeating the entire component, but the rest stays identical */}
      </div>
    </div>
  );
};

// Separate Modifier Settings Component
const ModifierSettingsPage = ({ detectedTactics, modifierSettings, onBack, onSave }: any) => {
  const [modifiers, setModifiers] = useState(modifierSettings || {
    'Targeted Display': {
      performancePatterns: {
        seasonal: {
          'Q1 (Winter)': { ctr: 0.42, cpm: 7.50, cpc: 1.63 },
          'Q2 (Spring)': { ctr: 0.55, cpm: 6.23, cpc: 1.27 },
          'Q3 (Summer)': { ctr: 0.50, cpm: 6.73, cpc: 1.43 },
          'Q4 (Fall/Holiday)': { ctr: 0.72, cpm: 5.37, cpc: 0.90 }
        }
      },
      geographicBaselines: {
        regions: {
          'Northeast': { ctr: 0.58, cpc: 1.35, cvr: 2.8 },
          'Southeast': { ctr: 0.52, cpc: 1.15, cvr: 3.2 },
          'Midwest': { ctr: 0.48, cpc: 1.05, cvr: 3.5 },
          'Southwest': { ctr: 0.55, cpc: 1.25, cvr: 3.0 },
          'West': { ctr: 0.62, cpc: 1.45, cvr: 2.6 }
        }
      }
    }
  });
  const [selectedTactic, setSelectedTactic] = useState(detectedTactics[0] || 'Targeted Display');
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    onSave(modifiers);
    setHasChanges(false);
  };

  const handleModifierChange = (section: string, subSection: string, key: string, metric: string, value: string) => {
    setModifiers((prev: any) => ({
      ...prev,
      [selectedTactic]: {
        ...prev[selectedTactic],
        [section]: {
          ...prev[selectedTactic]?.[section],
          [subSection]: {
            ...prev[selectedTactic]?.[section]?.[subSection],
            [key]: {
              ...prev[selectedTactic]?.[section]?.[subSection]?.[key],
              [metric]: parseFloat(value) || 0
            }
          }
        }
      }
    }));
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{color: '#cf0e0f'}}>
            <Settings className="inline-block mr-3" />
            Campaign Modifier Settings
          </h1>
          
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analyzer
          </button>
        </div>

        {/* Modifier settings content... */}
        {/* Rest of the modifier component stays the same */}
      </div>
    </div>
  );
};

// Main App with Error Boundary
export default function App() {
  return (
    <ErrorBoundary>
      <CampaignPerformanceAnalyzer />
    </ErrorBoundary>
  );
}

/*
ENVIRONMENT VARIABLES NEEDED:
Create a .env.local file in your project root:

NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here

For deployment, add this environment variable to your Vercel dashboard.
*/