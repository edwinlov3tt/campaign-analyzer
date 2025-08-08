// app/page.tsx - Complete Production-Ready Version
'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Upload, FileText, Loader2, Calendar, BarChart3, TrendingUp, Target, Copy, CheckCircle, Settings, Save, ChevronDown, Info, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { getTablesForTactic } from '@/data/tacticTables';
import { mapTacticToProduct, normalizeTacticName } from '@/data/tacticCategories';
import { generateSystemPrompt } from '@/data/aiGuidelines';

// TypeScript interfaces
interface TacticData {
  fileName: string;
  tableName: string;
  tactic: string;
  headers: string[];
  rows: Record<string, string | number>[];
}

interface AnalysisResult {
  executiveSummary: string;
  performanceAnalysis: string;
  trendAnalysis: string;
  recommendations: string;
  visualizations: VisualizationData[];
}

interface VisualizationData {
  type: 'bar_chart' | 'line_chart' | 'pie_chart' | 'area_chart';
  title: string;
  data: {
    labels: string[];
    values: number[];
    colors: string[];
  };
}

interface ModifierData {
  [tactic: string]: {
    performancePatterns?: {
      seasonal?: {
        [quarter: string]: {
          [key: string]: number;
        };
      };
      monthly?: {
        [month: string]: {
          [key: string]: number;
        };
      };
    };
    geographicBaselines?: {
      regions?: {
        [region: string]: {
          [key: string]: number;
        };
      };
    };
  };
}

interface AIModifiers {
  temperature: number;
  tone: 'Concise' | 'Professional' | 'Conversational' | 'Encouraging' | 'Casual';
  additionalInstructions: string;
  hideChartsAndTables: boolean;
}

interface CampaignTiming {
  campaignStart: Date | null;
  campaignEnd: Date | null;
  reportGenerationTime: Date;
  status: 'not_started' | 'ongoing' | 'completed';
  isPartialPeriod: boolean;
  daysRemaining?: number;
  daysElapsed?: number;
}

// Environment variable for API key
const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

// Default modifier settings
const DEFAULT_MODIFIERS: ModifierData = {
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
  },
  'TrueView': {
    performancePatterns: {
      seasonal: {
        'Q1 (Winter)': { ctr: 0.68, cpv: 0.16, viewRate: 32.5 },
        'Q2 (Spring)': { ctr: 0.75, cpv: 0.13, viewRate: 36.4 },
        'Q3 (Summer)': { ctr: 0.68, cpv: 0.15, viewRate: 32.5 },
        'Q4 (Fall/Holiday)': { ctr: 0.92, cpv: 0.10, viewRate: 43.8 }
      }
    },
    geographicBaselines: {
      regions: {
        'Northeast': { ctr: 0.78, cpv: 0.14, viewRate: 37.2 },
        'Southeast': { ctr: 0.72, cpv: 0.12, viewRate: 35.8 },
        'Midwest': { ctr: 0.68, cpv: 0.11, viewRate: 34.5 },
        'Southwest': { ctr: 0.75, cpv: 0.13, viewRate: 36.1 },
        'West': { ctr: 0.82, cpv: 0.15, viewRate: 38.9 }
      }
    }
  },
  'Meta': {
    performancePatterns: {
      seasonal: {
        'Q1 (Winter)': { ctr: 0.92, cpm: 11.50, cpc: 2.08 },
        'Q2 (Spring)': { ctr: 1.08, cpm: 10.23, cpc: 1.60 },
        'Q3 (Summer)': { ctr: 0.95, cpm: 11.20, cpc: 1.90 },
        'Q4 (Fall/Holiday)': { ctr: 1.32, cpm: 9.40, cpc: 1.20 }
      }
    },
    geographicBaselines: {
      regions: {
        'Northeast': { ctr: 1.18, cpc: 1.75, cvr: 4.2 },
        'Southeast': { ctr: 1.05, cpc: 1.55, cvr: 4.8 },
        'Midwest': { ctr: 0.98, cpc: 1.45, cvr: 5.1 },
        'Southwest': { ctr: 1.12, cpc: 1.65, cvr: 4.5 },
        'West': { ctr: 1.25, cpc: 1.85, cvr: 3.9 }
      }
    }
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
  const [jsonData, setJsonData] = useState<Record<string, unknown> | null>(null);
  const [companyInfo, setCompanyInfo] = useState('');
  const [luminaLink, setLuminaLink] = useState('');
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [detectedTactics, setDetectedTactics] = useState<string[]>([]);
  const [tacticUploads, setTacticUploads] = useState<Record<string, File>>({});
  const [tacticData, setTacticData] = useState<Record<string, TacticData>>({});
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);
  const [showReanalyzeModal, setShowReanalyzeModal] = useState(false);
  const [newFilesUploaded, setNewFilesUploaded] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState('analyzer');
  const [modifierSettings, setModifierSettings] = useState<ModifierData | null>(null);
  const [aiModifiers, setAiModifiers] = useState<AIModifiers>({
    temperature: 0.7,
    tone: 'Professional',
    additionalInstructions: '',
    hideChartsAndTables: false
  });
  const [campaignTiming, setCampaignTiming] = useState<CampaignTiming>({
    campaignStart: null,
    campaignEnd: null,
    reportGenerationTime: new Date(),
    status: 'ongoing',
    isPartialPeriod: false
  });
  const [showChartsAndTables, setShowChartsAndTables] = useState(true);

  // Check for API key on mount
  useEffect(() => {
    if (!ANTHROPIC_API_KEY) {
      setError('Anthropic API key is not configured. Please add NEXT_PUBLIC_ANTHROPIC_API_KEY to your environment variables.');
    }
  }, []);

  // Load modifier settings on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load modifier settings
      const savedModifiers = localStorage.getItem('campaignModifiers');
      if (savedModifiers) {
        try {
          setModifierSettings(JSON.parse(savedModifiers));
        } catch (err) {
          console.error('Error loading modifier settings:', err);
        }
      }
      // Load AI modifiers
      const savedAiModifiers = localStorage.getItem('aiModifiers');
      if (savedAiModifiers) {
        try {
          setAiModifiers(JSON.parse(savedAiModifiers));
        } catch (err) {
          console.error('Error loading AI modifier settings:', err);
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
      
      const row: Record<string, string | number> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return { headers, rows };
  };

  const extractTacticsFromJSON = (data: Record<string, unknown>) => {
    const tactics = new Set<string>();
    const productMappings = new Map<string, { product: string; subProducts: string[] }>();
    
    if (data.lineItems && Array.isArray(data.lineItems)) {
      data.lineItems.forEach((item: Record<string, unknown>) => {
        // Add products
        if (item.product && typeof item.product === 'string') {
          const normalizedTactic = normalizeTacticName(item.product);
          tactics.add(normalizedTactic);
          
          // Map to product/subproduct using tactic categories
          const mapping = mapTacticToProduct(normalizedTactic);
          if (mapping) {
            productMappings.set(normalizedTactic, mapping);
          }
        }
        
        // Add sub-products
        if (item.subProduct) {
          const subProducts = Array.isArray(item.subProduct) ? item.subProduct : [item.subProduct];
          subProducts.forEach(sub => {
            if (typeof sub === 'string') {
              const normalizedSub = normalizeTacticName(sub);
              tactics.add(normalizedSub);
              
              const mapping = mapTacticToProduct(normalizedSub);
              if (mapping) {
                productMappings.set(normalizedSub, mapping);
              }
            }
          });
        }
        
        // Add tactic types
        if (item.tacticTypeSpecial) {
          const tacticTypes = Array.isArray(item.tacticTypeSpecial) ? item.tacticTypeSpecial : [item.tacticTypeSpecial];
          tacticTypes.forEach(tactic => {
            if (typeof tactic === 'string') {
              const normalizedTactic = normalizeTacticName(tactic);
              tactics.add(normalizedTactic);
              
              const mapping = mapTacticToProduct(normalizedTactic);
              if (mapping) {
                productMappings.set(normalizedTactic, mapping);
              }
            }
          });
        }
      });
    }
    
    // Analyze campaign timing
    const timing = analyzeCampaignTiming(data);
    setCampaignTiming(timing);
    
    // Return tactics that have available tables
    return Array.from(tactics).filter(tactic => getTablesForTactic(tactic).length > 0);
  };

  const extractOrderNumberFromLuminaLink = (link: string): string | null => {
    try {
      // Remove the base URL and any query parameters
      const cleanedLink = link
        .replace(/^https:\/\/townsquarelumina\.com\/lumina\/view\/order\//, '')
        .split('?')[0];
      
      // Validate it looks like a valid order ID (MongoDB ObjectId format)
      if (cleanedLink.match(/^[0-9a-fA-F]{24}$/)) {
        return cleanedLink;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Helper function to analyze campaign timing
  const analyzeCampaignTiming = (campaignData: Record<string, unknown>) => {
    const now = new Date();
    const timing: CampaignTiming = {
      campaignStart: null,
      campaignEnd: null,
      reportGenerationTime: now,
      status: 'ongoing',
      isPartialPeriod: false
    };

    // Try to extract dates from campaign data
    if (campaignData.startDate && typeof campaignData.startDate === 'string') {
      timing.campaignStart = new Date(campaignData.startDate);
    }
    if (campaignData.endDate && typeof campaignData.endDate === 'string') {
      timing.campaignEnd = new Date(campaignData.endDate);
    }
    
    // Also check flightDates if available
    const flightDates = campaignData.flightDates as Record<string, unknown> | undefined;
    if (!timing.campaignStart && flightDates?.startDate && typeof flightDates.startDate === 'string') {
      timing.campaignStart = new Date(flightDates.startDate);
    }
    if (!timing.campaignEnd && flightDates?.endDate && typeof flightDates.endDate === 'string') {
      timing.campaignEnd = new Date(flightDates.endDate);
    }

    // Determine campaign status
    if (timing.campaignStart && timing.campaignEnd) {
      if (now < timing.campaignStart) {
        timing.status = 'not_started';
      } else if (now > timing.campaignEnd) {
        timing.status = 'completed';
      } else {
        timing.status = 'ongoing';
        timing.daysElapsed = Math.floor((now.getTime() - timing.campaignStart.getTime()) / (1000 * 60 * 60 * 24));
        timing.daysRemaining = Math.floor((timing.campaignEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Check if reporting period is partial
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
    timing.isPartialPeriod = currentDate < daysInMonth - 5; // Consider partial if not within last 5 days of month

    return timing;
  };

  const handleLuminaLinkSubmit = async () => {
    if (!luminaLink.trim()) {
      setError('Please enter a Lumina Link');
      return;
    }

    const orderNumber = extractOrderNumberFromLuminaLink(luminaLink.trim());
    if (!orderNumber) {
      setError('Invalid Lumina Link format. Please use: https://townsquarelumina.com/lumina/view/order/{orderNumber}');
      return;
    }

    setIsLoadingCampaign(true);
    setError('');

    try {
      const response = await fetch(`https://api.edwinlovett.com/order?query=${orderNumber}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch campaign data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setJsonData(data);
      
      const tactics = extractTacticsFromJSON(data);
      setDetectedTactics(tactics);
      
      setError('');
    } catch (err: unknown) {
      setError('Error fetching campaign data: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoadingCampaign(false);
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
      setError('');
    } catch (err: unknown) {
      setError('Error reading company file: ' + (err instanceof Error ? err.message : String(err)));
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
    } catch (err: unknown) {
      setError('Error parsing table file: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handle bulk CSV upload
  const handleBulkCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const groupedTactics = groupTacticsByProduct(detectedTactics);
    const availableProducts = Object.keys(groupedTactics);
    let processedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      if (!file.name.endsWith('.csv')) continue;

      try {
        // Detect product and table type
        const detectedProduct = detectProductFromFilename(file.name, availableProducts);
        if (detectedProduct && groupedTactics[detectedProduct]) {
          const productData = groupedTactics[detectedProduct];
          const mainTactic = productData.tactics[0];
          const availableTables = getTablesForTactic(mainTactic);
          const detectedTable = detectTableType(file.name, availableTables);
          
          if (detectedTable) {
            const text = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsText(file);
            });
            
            const parsed = parseCSVData(text);
            const key = `${mainTactic}_${detectedTable}`;
            
            setTacticUploads(prev => ({
              ...prev,
              [key]: file
            }));
            
            setTacticData(prev => ({
              ...prev,
              [key]: {
                fileName: file.name,
                tableName: detectedTable,
                tactic: mainTactic,
                ...parsed
              }
            }));
            
            processedCount++;
          } else {
            console.warn(`Could not detect table type for ${file.name}`);
          }
        } else {
          console.warn(`Could not detect product for ${file.name}`);
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        errorCount++;
      }
    }

    if (processedCount > 0) {
      setError('');
    }
    if (errorCount > 0) {
      setError(`Processed ${processedCount} files successfully, ${errorCount} files had errors.`);
    }
  };

  // Handle product-specific bulk upload
  const handleProductSpecificBulkUpload = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    product: string, 
    tactics: string[]
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const mainTactic = tactics[0];
    const availableTables = getTablesForTactic(mainTactic);
    let processedCount = 0;

    for (const file of files) {
      if (!file.name.endsWith('.csv')) continue;

      try {
        const detectedTable = detectTableType(file.name, availableTables);
        if (detectedTable) {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
          
          const parsed = parseCSVData(text);
          const key = `${mainTactic}_${detectedTable}`;
          
          setTacticUploads(prev => ({
            ...prev,
            [key]: file
          }));
          
          setTacticData(prev => ({
            ...prev,
            [key]: {
              fileName: file.name,
              tableName: detectedTable,
              tactic: mainTactic,
              ...parsed
            }
          }));
          
          processedCount++;
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
      }
    }

    if (processedCount > 0) {
      setError('');
    }
  };

  // Handle table type change for manual correction
  const handleTableTypeChange = (tactic: string, oldTableName: string, newTableName: string) => {
    const oldKey = `${tactic}_${oldTableName}`;
    const newKey = `${tactic}_${newTableName}`;
    
    if (tacticUploads[oldKey]) {
      setTacticUploads(prev => {
        const newUploads = { ...prev };
        newUploads[newKey] = newUploads[oldKey];
        delete newUploads[oldKey];
        return newUploads;
      });
      
      setTacticData(prev => {
        const newData = { ...prev };
        if (newData[oldKey]) {
          newData[newKey] = {
            ...newData[oldKey],
            tableName: newTableName
          };
          delete newData[oldKey];
        }
        return newData;
      });
    }
  };

  const clearAndReset = () => {
    setJsonData(null);
    setCompanyInfo('');
    setLuminaLink('');
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
    if (!jsonData) {
      setError('Please upload campaign JSON data before analyzing');
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

      // Build campaign timing context
      let timingContext = '';
      if (campaignTiming.campaignStart && campaignTiming.campaignEnd) {
        timingContext = `
CAMPAIGN TIMING INFORMATION:
- Campaign Start: ${campaignTiming.campaignStart.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Campaign End: ${campaignTiming.campaignEnd.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Report Generation: ${campaignTiming.reportGenerationTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${campaignTiming.reportGenerationTime.toLocaleTimeString('en-US')}
- Campaign Status: ${campaignTiming.status}${campaignTiming.status === 'ongoing' ? ` (${campaignTiming.daysElapsed} days elapsed, ${campaignTiming.daysRemaining} days remaining)` : ''}
- Reporting Period: ${campaignTiming.isPartialPeriod ? 'PARTIAL (mid-month/quarter)' : 'Complete'}

${campaignTiming.isPartialPeriod ? 'Note: This is a partial reporting period. Some metrics may appear lower than expected due to incomplete data for the current month/quarter.' : ''}`;
      }

      const currentDate = new Date();
      const dateContext = `
CURRENT DATE & TIME CONTEXT:
Today is ${currentDate.toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})} at ${currentDate.toLocaleTimeString('en-US')} (${currentDate.getFullYear()}).
Current month: ${currentDate.toLocaleDateString('en-US', { month: 'long' })} ${currentDate.getFullYear()}
Current quarter: Q${Math.floor((currentDate.getMonth() + 3) / 3)} ${currentDate.getFullYear()}
${timingContext}

Use this context when analyzing performance trends and seasonal patterns. If you notice performance changes in recent months, consider whether we are currently in that time period when making recommendations.`;


      // Build tactic mapping context
      const tacticMappingContext = `
TACTIC PRODUCT MAPPING:
For each detected tactic, map to the correct Product and Subproduct categories:
${detectedTactics.map(tactic => {
  const mapping = mapTacticToProduct(tactic);
  return mapping ? `- ${tactic} → Product: ${mapping.product}, Subproducts: ${mapping.subProducts.join(', ')}` : `- ${tactic} → [No mapping found]`;
}).join('\n')}`;

      // Generate the system prompt using AI guidelines
      const systemPrompt = generateSystemPrompt(
        timeRange,
        companyInfo || undefined,
        {
          temperature: aiModifiers.temperature,
          tone: aiModifiers.tone.toLowerCase(),
          additionalInstructions: aiModifiers.additionalInstructions
        }
      );

      const prompt = `${systemPrompt}

${dateContext}

${companyInfo ? `COMPANY INFORMATION:
${companyInfo}
` : ''}
CAMPAIGN DATA:
${JSON.stringify(jsonData, null, 2)}

PERFORMANCE TABLE DATA:
${JSON.stringify(tacticData, null, 2)}
${modifierContext}
${tacticMappingContext}

${modifierSettings ? 'CUSTOM BENCHMARKS: Leverage the provided custom benchmark modifiers to provide more precise and relevant recommendations.' : ''}

${aiModifiers.hideChartsAndTables ? 'IMPORTANT: User has requested NO CHARTS OR TABLES. Provide text analysis only.' : `VISUALIZATION REQUIREMENTS:
   Create 4-6 charts showing key insights:
   - Individual tactic performance with Product/Subproduct labels
   - Geographic performance patterns where available
   - Trend analysis with timing context
   - Creative performance rankings where available`}

Format your response as JSON with this structure:
{
  "executiveSummary": "string (Executive Summary section)",
  "performanceAnalysis": "string (Performance Analysis by Tactic section with individual tactic breakdowns)", 
  "trendAnalysis": "string (Trend Analysis with Monthly Performance Trends and Pattern Analysis)",
  "recommendations": "string (Strategic Optimization Recommendations organized by Geographic, Creative, Audience, Measurement categories)",
  ${aiModifiers.hideChartsAndTables ? '"visualizations": []' : `"visualizations": [
    {
      "type": "bar_chart|line_chart|pie_chart|area_chart",
      "title": "string",
      "data": {
        "labels": ["string"],
        "values": [number],
        "colors": ["#cf0e0f", "#ff4444", "#ff6666", "#ff8888", "#ffaaaa"]
      }
    }
  ]`}
}`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          temperature: aiModifiers.temperature,
          maxTokens: 12000  // Increased to prevent truncation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up response and parse JSON
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      // Function to sanitize JSON string by removing/escaping problematic characters
      const sanitizeJsonString = (str: string): string => {
        // Remove problematic control characters but keep allowed ones
        return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
      };
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw response text (first 500 chars):', responseText.substring(0, 500));
        
        // Try to extract and clean JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Try sanitizing the JSON
            const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
            console.log('Attempting to parse sanitized JSON...');
            result = JSON.parse(sanitizedJson);
          } catch (secondParseError) {
            console.error('Second parse attempt failed:', secondParseError);
            console.error('Sanitized JSON (first 300 chars):', jsonMatch[0].substring(0, 300));
            
            // Final fallback: create a basic error response
            result = {
              executiveSummary: "Analysis generation failed due to formatting issues. Please try again.",
              performanceAnalysis: "Unable to parse AI response. Please check your data format and try again.",
              trendAnalysis: "Response parsing error occurred.",
              recommendations: "Please retry the analysis with the same or different parameters.",
              visualizations: []
            };
          }
        } else {
          throw new Error(`Unable to find JSON in AI response. Response: ${responseText.substring(0, 200)}...`);
        }
      }
      
      setAnalysisResult(result);
    } catch (err: unknown) {
      setError('Error generating analysis: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const renderVisualization = (viz: VisualizationData, index: number) => {
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
                  {chartData.map((_entry: { name: string; value: number }, idx: number) => (
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
    const tacticTables = getTablesForTactic(tactic);
    return tacticTables.filter(table => tacticUploads[`${tactic}_${table}`]).length;
  };

  // Group tactics by product and subproduct
  const groupTacticsByProduct = (tactics: string[]) => {
    const grouped: Record<string, { subProducts: string[]; tactics: string[] }> = {};
    
    tactics.forEach(tactic => {
      const mapping = mapTacticToProduct(tactic);
      if (mapping) {
        const key = mapping.product;
        if (!grouped[key]) {
          grouped[key] = { subProducts: [], tactics: [] };
        }
        grouped[key].tactics.push(tactic);
        mapping.subProducts.forEach(sub => {
          if (!grouped[key].subProducts.includes(sub)) {
            grouped[key].subProducts.push(sub);
          }
        });
      } else {
        // Handle tactics without mapping
        if (!grouped[tactic]) {
          grouped[tactic] = { subProducts: [], tactics: [tactic] };
        }
      }
    });
    
    return grouped;
  };

  // Auto-detect table type from CSV filename
  const detectTableType = (filename: string, availableTables: string[]): string | null => {
    const cleanName = filename.toLowerCase()
      .replace(/^report-/, '')
      .replace(/\s*\(\d+\)\.csv$/, '.csv')
      .replace(/\.csv$/, '');
    
    // Try exact match first
    const exactMatch = availableTables.find(table => 
      cleanName.includes(table.toLowerCase().replace(/\s+/g, '-'))
    );
    if (exactMatch) return exactMatch;
    
    // Try partial matches
    const partialMatch = availableTables.find(table => {
      const tableWords = table.toLowerCase().split(' ');
      return tableWords.every(word => cleanName.includes(word.replace(/\s+/g, '-')));
    });
    
    return partialMatch || null;
  };

  // Auto-detect product from CSV filename
  const detectProductFromFilename = (filename: string, availableProducts: string[]): string | null => {
    const cleanName = filename.toLowerCase().replace(/^report-/, '').replace(/\s*\(\d+\)\.csv$/, '.csv');
    
    const productMatch = availableProducts.find(product => {
      const productKey = product.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');
      return cleanName.includes(productKey) || cleanName.includes(product.toLowerCase().replace(/\s+/g, '-'));
    });
    
    return productMatch || null;
  };

  if (currentView === 'modifiers') {
    return <ModifierSettingsPage 
      detectedTactics={detectedTactics} 
      modifierSettings={modifierSettings}
      aiModifiers={aiModifiers}
      onBack={() => setCurrentView('analyzer')}
      onSave={(modifiers: ModifierData) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('campaignModifiers', JSON.stringify(modifiers));
        }
        setModifierSettings(modifiers);
        setCurrentView('analyzer');
      }}
      onSaveAiModifiers={(newAiModifiers: AIModifiers) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('aiModifiers', JSON.stringify(newAiModifiers));
        }
        setAiModifiers(newAiModifiers);
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

        {/* Instructions */}
        {showInstructions && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border-l-4 relative" style={{borderLeftColor: '#cf0e0f'}}>
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-3 text-gray-900" style={{color: '#cf0e0f'}}>How to Use</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-900">
              <li>Enter a Lumina Link to automatically load campaign data from your order</li>
              <li>Provide company information (upload text file or paste directly)</li>
              <li>Upload specific performance tables for each detected tactic (organized by table type)</li>
              <li>Optionally configure custom benchmark modifiers for more precise analysis</li>
              <li>Select your analysis time range</li>
              <li>Generate comprehensive AI analysis with detailed insights and recommendations</li>
            </ol>
          </div>
        )}

        {/* Reanalyze Modal */}
        {showReanalyzeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>
                Confirm Re-analysis
              </h3>
              <p className="text-gray-900 mb-4">
                This will replace your current analysis results. Make sure to save your current analysis if needed.
              </p>
              
              {newFilesUploaded.length > 0 ? (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">New files uploaded since last analysis:</p>
                  <ul className="text-sm text-gray-900 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    {newFilesUploaded.map((file, index) => (
                      <li key={index}>• {file}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ No new files have been uploaded since the last analysis.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReanalyzeModal(false)}
                  className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={proceedWithReanalysis}
                  className="px-4 py-2 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  style={{backgroundColor: '#cf0e0f'}}
                >
                  Proceed with Re-analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={clearAndReset}
            className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center transition-colors font-medium"
          >
            <span className="mr-2">🔄</span>
            Clear & Reset
          </button>
          
          {sectionsCollapsed && (
            <button
              onClick={() => setSectionsCollapsed(false)}
              className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
            >
              ↕️ Expand Upload Sections
            </button>
          )}
        </div>

        {/* Campaign Data via Lumina Link */}
        {!sectionsCollapsed && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>
              <Upload className="inline-block mr-2" />
              Campaign Data (Lumina Link)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Lumina Link
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={luminaLink}
                    onChange={(e) => setLuminaLink(e.target.value)}
                    placeholder="https://townsquarelumina.com/lumina/view/order/67739fcd77ff89a87fc39608"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                    disabled={isLoadingCampaign}
                  />
                  <button
                    onClick={handleLuminaLinkSubmit}
                    disabled={isLoadingCampaign || !luminaLink.trim()}
                    className="px-6 py-3 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                    style={{backgroundColor: isLoadingCampaign ? undefined : '#cf0e0f'}}
                  >
                    {isLoadingCampaign ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load Campaign'
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Enter a Lumina order link to automatically fetch campaign data
                </p>
              </div>
            </div>
            {jsonData && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700 font-medium">✓ Campaign data loaded successfully</p>
                <p className="text-sm text-gray-900 mt-1">
                  Found {(jsonData?.lineItems as unknown[])?.length || 0} line items | Detected {detectedTactics.length} tactics
                </p>
                {detectedTactics.length > 0 && (
                  <p className="text-sm text-gray-900 mt-1">
                    Tactics: {detectedTactics.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Company Information */}
        {!sectionsCollapsed && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>
              <FileText className="inline-block mr-2" />
              Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Upload Text File</label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleCompanyFileUpload}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer cursor-pointer"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-900 mb-2">Or Paste Information</label>
                <textarea
                  value={companyInfo}
                  onChange={(e) => setCompanyInfo(e.target.value)}
                  placeholder="Paste company information here..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bulk CSV Upload */}
        {detectedTactics.length > 0 && !sectionsCollapsed && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>
              <Upload className="inline-block mr-2" />
              Bulk CSV Upload
            </h2>
            <p className="text-gray-900 mb-4">
              Upload multiple CSV files at once. Files will be auto-sorted by product and table type based on filename.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-300 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop CSV files here, or</p>
              <input
                type="file"
                id="bulk-upload"
                accept=".csv"
                multiple
                onChange={handleBulkCSVUpload}
                className="hidden"
              />
              <label 
                htmlFor="bulk-upload"
                className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:bg-red-700 cursor-pointer transition-colors"
                style={{backgroundColor: '#cf0e0f'}}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Supported format: report-{'{product}'}-{'{table-type}'}.csv (e.g., report-meta-monthly-performance.csv)
              </p>
            </div>
          </div>
        )}

        {/* Performance Tables by Product */}
        {detectedTactics.length > 0 && !sectionsCollapsed && (() => {
          const groupedTactics = groupTacticsByProduct(detectedTactics);
          return (
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>
                <TrendingUp className="inline-block mr-2" />
                Performance Tables by Product
              </h2>
              <p className="text-gray-900 mb-4">
                Upload specific performance tables for each product. Tables are auto-detected from bulk uploads or individual uploads.
              </p>
              
              {Object.entries(groupedTactics).map(([product, data]) => {
                const displayTitle = data.subProducts.length > 0 
                  ? `${product}: ${data.subProducts.join(', ')}`
                  : product;
                const mainTactic = data.tactics[0]; // Use first tactic for table lookup
                const availableTables = getTablesForTactic(mainTactic);
                
                return (
                  <div key={product} className="mb-8 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900" style={{color: '#cf0e0f'}}>
                        {displayTitle}
                      </h3>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        {getUploadedTablesCount(mainTactic)} / {availableTables.length} tables uploaded
                      </span>
                    </div>
                    
                    {/* Bulk upload for this specific product */}
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Bulk Upload for {product}
                      </label>
                      <input
                        type="file"
                        accept=".csv"
                        multiple
                        onChange={(e) => handleProductSpecificBulkUpload(e, product, data.tactics)}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-100 focus:outline-none p-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Files will be auto-detected and sorted to the correct table types
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableTables.map((tableName) => {
                        const uploadKey = `${mainTactic}_${tableName}`;
                        const isUploaded = tacticUploads[uploadKey];
                        
                        return (
                          <div key={tableName} className="border border-gray-200 rounded p-3 hover:border-red-300 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <label className="block text-sm font-medium text-gray-900">
                                {tableName}
                              </label>
                              {isUploaded && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            
                            {/* Dropdown for manual table type selection */}
                            <select
                              value={tableName}
                              onChange={(e) => handleTableTypeChange(mainTactic, tableName, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-black"
                              style={{ color: '#000000' }}
                              title="Change table type if auto-detection was incorrect"
                            >
                              {availableTables.map(table => (
                                <option key={table} value={table} style={{ color: '#000000' }}>{table}</option>
                              ))}
                            </select>
                            
                            <input
                              type="file"
                              accept=".csv"
                              onChange={(e) => handleTacticTableUpload(e, mainTactic, tableName)}
                              className="block w-full text-xs text-gray-900 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer cursor-pointer"
                            />
                            {isUploaded && (
                              <div className="mt-2 text-xs text-green-600">
                                📁 {tacticData[uploadKey]?.fileName}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Time Range Selection */}
        {jsonData && !sectionsCollapsed && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>
              <Calendar className="inline-block mr-2" />
              Analysis Time Range
            </h2>
            <div className="space-y-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white hover:border-red-400 transition-colors w-full"
                style={{ color: '#000000' }}
              >
                <option value="Last 30 days" style={{ color: '#000000' }}>Last 30 days</option>
                <option value="Last 60 days" style={{ color: '#000000' }}>Last 60 days</option>
                <option value="Last 90 days" style={{ color: '#000000' }}>Last 90 days</option>
                <option value="Last 120 days" style={{ color: '#000000' }}>Last 120 days</option>
                <option value="Last 150 days" style={{ color: '#000000' }}>Last 150 days</option>
                <option value="Last 180 days" style={{ color: '#000000' }}>Last 180 days</option>
                <option value="Last Month" style={{ color: '#000000' }}>Last Month</option>
                <option value="This Month" style={{ color: '#000000' }}>This Month</option>
                <option value="Custom" style={{ color: '#000000' }}>Custom</option>
              </select>
              
              {timeRange === 'Custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                      style={{ color: '#000000' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                      style={{ color: '#000000' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generate Analysis Button */}
        {jsonData && (
          <div className="mb-8 text-center">
            <button
              onClick={handleReanalyzeClick}
              disabled={isLoading || !ANTHROPIC_API_KEY}
              className="px-8 py-3 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
              style={{backgroundColor: '#cf0e0f'}}
            >
              {isLoading ? (
                <>
                  <Loader2 className="inline-block mr-2 animate-spin" />
                  Generating Analysis...
                </>
              ) : analysisResult ? (
                <>
                  <Target className="inline-block mr-2" />
                  Re-analyze Performance Data
                </>
              ) : (
                <>
                  <Target className="inline-block mr-2" />
                  Generate Detailed Performance Analysis
                </>
              )}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin" style={{color: '#cf0e0f'}} />
            <p className="mt-3 text-gray-900 font-medium">{loadingStatus}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {!isLoading && analysisResult && (
          <div className="space-y-8">
            {/* Copy Button */}
            <div className="flex justify-end">
              <button
                onClick={copyAnalysisToClipboard}
                className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-red-700 transition-colors"
                style={{backgroundColor: '#cf0e0f'}}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Analysis
                  </>
                )}
              </button>
            </div>

            {/* Executive Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>Executive Summary</h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 leading-relaxed whitespace-pre-line">{analysisResult.executiveSummary}</p>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>Performance Analysis by Tactic</h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 leading-relaxed whitespace-pre-line">{analysisResult.performanceAnalysis}</p>
              </div>
            </div>

            {/* Trend Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>Trend Analysis</h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 leading-relaxed whitespace-pre-line">{analysisResult.trendAnalysis}</p>
              </div>
            </div>

            {/* Visualizations */}
            {analysisResult.visualizations && analysisResult.visualizations.length > 0 && showChartsAndTables && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900" style={{color: '#cf0e0f'}}>Performance Insights & Data Visualizations</h2>
                  <button
                    onClick={() => setShowChartsAndTables(false)}
                    className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
                  >
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide Charts
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {analysisResult.visualizations.map((viz, index) => renderVisualization(viz, index))}
                </div>
              </div>
            )}
            
            {/* Show Charts Button */}
            {analysisResult.visualizations && analysisResult.visualizations.length > 0 && !showChartsAndTables && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <button
                  onClick={() => setShowChartsAndTables(true)}
                  className="text-gray-700 hover:text-gray-900 flex items-center mx-auto"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show Charts & Tables
                </button>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-900" style={{color: '#cf0e0f'}}>Strategic Optimization Recommendations</h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 leading-relaxed whitespace-pre-line">{analysisResult.recommendations}</p>
              </div>
            </div>
            
            {/* Changelog Note */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-xs text-gray-600">
                Report generated: {new Date().toLocaleString()} | 
                Tactic mappings: Enhanced categories v2 | 
                Report structure: 5-point analysis framework |
                Temperature: {aiModifiers.temperature} | 
                Tone: {aiModifiers.tone}
                {campaignTiming.isPartialPeriod && ' | ⚠️ Partial period data'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Complete Modifier Settings Component
interface ModifierSettingsPageProps {
  detectedTactics: string[];
  modifierSettings: ModifierData | null;
  aiModifiers: AIModifiers;
  onBack: () => void;
  onSave: (modifiers: ModifierData) => void;
  onSaveAiModifiers: (aiModifiers: AIModifiers) => void;
}

const ModifierSettingsPage: React.FC<ModifierSettingsPageProps> = ({ 
  detectedTactics, 
  modifierSettings,
  aiModifiers, 
  onBack, 
  onSave,
  onSaveAiModifiers 
}) => {
  const [modifiers, setModifiers] = useState<ModifierData>(modifierSettings || DEFAULT_MODIFIERS);
  const [selectedTactic, setSelectedTactic] = useState(detectedTactics[0] || 'Targeted Display');
  const [hasChanges, setHasChanges] = useState(false);
  const [localAiModifiers, setLocalAiModifiers] = useState<AIModifiers>(aiModifiers);
  const [hasAiChanges, setHasAiChanges] = useState(false);

  const handleSave = () => {
    onSave(modifiers);
    setHasChanges(false);
  };
  
  const handleSaveAi = () => {
    onSaveAiModifiers(localAiModifiers);
    setHasAiChanges(false);
  };

  const handleModifierChange = (section: string, subSection: string, key: string, metric: string, value: string) => {
    setModifiers(prev => ({
      ...prev,
      [selectedTactic]: {
        ...prev[selectedTactic],
        [section]: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(prev[selectedTactic] as any)?.[section],
          [subSection]: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(prev[selectedTactic] as any)?.[section]?.[subSection],
            [key]: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(prev[selectedTactic] as any)?.[section]?.[subSection]?.[key],
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
          <h1 className="text-3xl font-bold text-gray-900" style={{color: '#cf0e0f'}}>
            <Settings className="inline-block mr-3" />
            Campaign Modifier Settings
          </h1>
          
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analyzer
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">About Modifier Settings</h3>
              <p className="text-sm text-blue-800">
                These benchmarks will be automatically injected into your AI analysis reports to provide contextual insights. 
                Adjust the values based on your industry knowledge and historical performance data.
              </p>
            </div>
          </div>
        </div>

        {/* Tactic Selector */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-900 mb-2">Select Tactic to Configure</label>
          <div className="relative">
            <select
              value={selectedTactic}
              onChange={(e) => setSelectedTactic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none text-gray-900 bg-white hover:border-red-400 transition-colors"
              style={{ color: '#000000' }}
            >
              {detectedTactics.map(tactic => (
                <option key={tactic} value={tactic} style={{ color: '#000000' }}>{tactic}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Benchmarks Tables */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900" style={{color: '#cf0e0f'}}>Performance Benchmarks</h3>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition-colors font-medium"
              style={{backgroundColor: hasChanges ? '#cf0e0f' : undefined}}
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Return
            </button>
          </div>

          {/* Seasonal Performance */}
          {modifiers[selectedTactic]?.performancePatterns?.seasonal && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-gray-900" style={{color: '#cf0e0f'}}>Seasonal Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Quarter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {selectedTactic === 'TrueView' ? 'CTR (%)' : 'CTR (%)'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {selectedTactic === 'TrueView' ? 'CPV ($)' : 'CPM ($)'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {selectedTactic === 'TrueView' ? 'View Rate (%)' : 'CPC ($)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(modifiers[selectedTactic]?.performancePatterns?.seasonal || {}).map(([quarter, data]) => (
                      <tr key={quarter}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{quarter}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={data.ctr || 0}
                            onChange={(e) => handleModifierChange('performancePatterns', 'seasonal', quarter, 'ctr', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                            style={{ color: '#000000' }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={selectedTactic === 'TrueView' ? (data.cpv || 0) : (data.cpm || 0)}
                            onChange={(e) => handleModifierChange('performancePatterns', 'seasonal', quarter, selectedTactic === 'TrueView' ? 'cpv' : 'cpm', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                            style={{ color: '#000000' }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={selectedTactic === 'TrueView' ? (data.viewRate || 0) : (data.cpc || 0)}
                            onChange={(e) => handleModifierChange('performancePatterns', 'seasonal', quarter, selectedTactic === 'TrueView' ? 'viewRate' : 'cpc', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                            style={{ color: '#000000' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Geographic Baselines */}
          {modifiers[selectedTactic]?.geographicBaselines?.regions && (
            <div>
              <h4 className="text-md font-medium mb-3 text-gray-900" style={{color: '#cf0e0f'}}>Geographic Baselines</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Region</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">CTR (%)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {selectedTactic === 'TrueView' ? 'CPV ($)' : 'CPC ($)'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {selectedTactic === 'TrueView' ? 'View Rate (%)' : 'CVR (%)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(modifiers[selectedTactic]?.geographicBaselines?.regions || {}).map(([region, data]) => (
                      <tr key={region}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{region}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={data.ctr || 0}
                            onChange={(e) => handleModifierChange('geographicBaselines', 'regions', region, 'ctr', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                            style={{ color: '#000000' }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={selectedTactic === 'TrueView' ? (data.cpv || 0) : (data.cpc || 0)}
                            onChange={(e) => handleModifierChange('geographicBaselines', 'regions', region, selectedTactic === 'TrueView' ? 'cpv' : 'cpc', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                            style={{ color: '#000000' }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={selectedTactic === 'TrueView' ? (data.viewRate || 0) : (data.cvr || 0)}
                            onChange={(e) => handleModifierChange('geographicBaselines', 'regions', region, selectedTactic === 'TrueView' ? 'viewRate' : 'cvr', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                            style={{ color: '#000000' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Modifiers Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900" style={{color: '#cf0e0f'}}>AI Analysis Modifiers</h3>
            <button
              onClick={handleSaveAi}
              disabled={!hasAiChanges}
              className="px-4 py-2 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition-colors font-medium"
              style={{backgroundColor: hasAiChanges ? '#cf0e0f' : undefined}}
            >
              <Save className="w-4 h-4 mr-2" />
              Save AI Settings
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature Control */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Temperature (Creativity Level)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localAiModifiers.temperature}
                  onChange={(e) => {
                    setLocalAiModifiers(prev => ({ ...prev, temperature: parseFloat(e.target.value) }));
                    setHasAiChanges(true);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Focused (0.0)</span>
                  <span className="font-medium text-gray-900">{localAiModifiers.temperature}</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>
            </div>
            
            {/* Tone Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Response Tone
              </label>
              <select
                value={localAiModifiers.tone}
                onChange={(e) => {
                  setLocalAiModifiers(prev => ({ ...prev, tone: e.target.value as AIModifiers['tone'] }));
                  setHasAiChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                style={{ color: '#000000' }}
              >
                <option value="Concise" style={{ color: '#000000' }}>Concise</option>
                <option value="Professional" style={{ color: '#000000' }}>Professional</option>
                <option value="Conversational" style={{ color: '#000000' }}>Conversational</option>
                <option value="Encouraging" style={{ color: '#000000' }}>Encouraging</option>
                <option value="Casual" style={{ color: '#000000' }}>Casual</option>
              </select>
            </div>
            
            {/* Additional Instructions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Additional Instructions (Optional)
              </label>
              <textarea
                value={localAiModifiers.additionalInstructions}
                onChange={(e) => {
                  setLocalAiModifiers(prev => ({ ...prev, additionalInstructions: e.target.value }));
                  setHasAiChanges(true);
                }}
                placeholder="Enter any specific instructions for the AI analysis..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                rows={3}
              />
            </div>
            
            {/* Hide Charts Toggle */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localAiModifiers.hideChartsAndTables}
                  onChange={(e) => {
                    setLocalAiModifiers(prev => ({ ...prev, hideChartsAndTables: e.target.checked }));
                    setHasAiChanges(true);
                  }}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-900">
                  Hide charts and tables in analysis (text-only report)
                </span>
              </label>
            </div>
          </div>
        </div>
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

PACKAGE.JSON DEPENDENCIES:
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18", 
    "next": "^14",
    "recharts": "^2.8.0",
    "lucide-react": "^0.294.0",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
*/