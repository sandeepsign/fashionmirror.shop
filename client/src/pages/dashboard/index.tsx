import { useState, useEffect } from 'react';
import UnifiedDashboardLayout from '@/components/UnifiedDashboardLayout';
import TryOnWorkspace from '@/components/TryOnWorkspace';
import ResultsGallery from '@/components/ResultsGallery';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FashionItem, TryOnResult } from '@shared/schema';
import { FashionItemInput, apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, CheckCircle, Clock, Code, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { Link } from 'wouter';

export default function DashboardPage() {
  const { user, quota, refreshProfile } = useAuth();

  // Try-on state
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [fashionImages, setFashionImages] = useState<File[]>([]);
  const [selectedFashionItems, setSelectedFashionItems] = useState<FashionItem[]>([]);
  const [allFashionItems, setAllFashionItems] = useState<FashionItemInput[]>([]);
  const [itemSelectionStates, setItemSelectionStates] = useState<boolean[]>([]);
  const [latestResults, setLatestResults] = useState<TryOnResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });
  const [isUpgradeBannerVisible, setIsUpgradeBannerVisible] = useState(true);

  // Dashboard state
  const [analytics, setAnalytics] = useState<{
    totalSessions: number;
    completedSessions: number;
    conversionRate: number;
  } | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/account/analytics/overview', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  // Calculate quota display
  const quotaUsed = quota?.quotaUsed || 0;
  const studioQuotaUsed = quota?.studioQuotaUsed || 0;
  const widgetQuotaUsed = quota?.widgetQuotaUsed || 0;
  const quotaLimit = quota?.monthlyQuota || quota?.totalQuota || 100;
  const quotaPercentage = Math.min((quotaUsed / quotaLimit) * 100, 100);
  const studioPercentage = quotaUsed > 0 ? (studioQuotaUsed / quotaUsed) * 100 : 0;
  const widgetPercentage = quotaUsed > 0 ? (widgetQuotaUsed / quotaUsed) * 100 : 0;
  const isLifetimeQuota = quota?.plan === 'free';

  // Try-on handlers
  const handleModelImageSelect = (file: File | null) => {
    setModelImage(file);
  };

  const handleFashionImagesSelect = async (files: File[]) => {
    if (files.length === 0) return;

    // Clear collection selections when uploading
    setSelectedFashionItems([]);

    // Analyze each image and create fashion items
    const newFashionItems: FashionItemInput[] = [];

    for (const file of files) {
      try {
        const analysis = await apiClient.analyzeFashionImage(file);
        newFashionItems.push({
          image: file,
          name: analysis.name,
          category: analysis.category,
          source: 'upload' as const
        });
      } catch (error) {
        console.error('Failed to analyze image:', error);
        // Use fallback values
        newFashionItems.push({
          image: file,
          name: file.name.split('.')[0] || `Fashion Item ${newFashionItems.length + 1}`,
          category: 'Custom',
          source: 'upload' as const
        });
      }
    }

    // Append to existing items
    setAllFashionItems(prev => [...prev, ...newFashionItems]);
    setItemSelectionStates(prev => [...prev, ...new Array(newFashionItems.length).fill(true)]);
    setFashionImages(prev => [...prev, ...files]);
  };

  const handleFashionItemSelect = (item: FashionItem) => {
    const isSelected = selectedFashionItems.some(selected => selected.id === item.id);
    let newSelectedItems: FashionItem[];

    if (isSelected) {
      // Deselect: remove from both lists
      newSelectedItems = selectedFashionItems.filter(selected => selected.id !== item.id);
      const indexToRemove = allFashionItems.findIndex(fi => fi.collectionId === item.id);
      if (indexToRemove !== -1) {
        setAllFashionItems(prev => prev.filter((_, i) => i !== indexToRemove));
        setItemSelectionStates(prev => prev.filter((_, i) => i !== indexToRemove));
      }
    } else {
      // Select: add to both lists
      newSelectedItems = [...selectedFashionItems, item];
      const newItem: FashionItemInput = {
        image: new File([], ''),
        name: item.name,
        category: item.category,
        source: 'collection' as const,
        collectionId: item.id
      };
      setAllFashionItems(prev => [...prev, newItem]);
      setItemSelectionStates(prev => [...prev, true]);
    }

    setSelectedFashionItems(newSelectedItems);
  };

  const handleResultsGenerated = (results: TryOnResult[]) => {
    setLatestResults(results.length > 0 ? [results[results.length - 1]] : []);
    // Refresh quota after generation
    refreshProfile();
  };

  const handleGenerationProgress = (completed: number, total: number) => {
    setGenerationProgress({ completed, total });
  };

  const handleGenerationStart = () => {
    setIsGenerating(true);
  };

  const handleGenerationEnd = () => {
    setIsGenerating(false);
    setGenerationProgress({ completed: 0, total: 0 });
  };

  const handleItemRemove = (index: number) => {
    const removedItem = allFashionItems[index];

    // Remove from all fashion items
    const newFashionItems = allFashionItems.filter((_, i) => i !== index);
    const newSelectionStates = itemSelectionStates.filter((_, i) => i !== index);
    setAllFashionItems(newFashionItems);
    setItemSelectionStates(newSelectionStates);

    // If it was a collection item, remove from selectedFashionItems
    if (removedItem.source === 'collection' && removedItem.collectionId) {
      setSelectedFashionItems(prev => prev.filter(item => item.id !== removedItem.collectionId));
    }

    // If it was an upload, remove from fashionImages
    if (removedItem.source === 'upload') {
      setFashionImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemSelectionToggle = (index: number) => {
    const newSelectionStates = [...itemSelectionStates];
    newSelectionStates[index] = !newSelectionStates[index];
    setItemSelectionStates(newSelectionStates);
  };

  const getSelectedItemsCount = () => {
    return itemSelectionStates.filter(selected => selected).length;
  };

  const getSelectedFashionItems = () => {
    return allFashionItems.filter((_, index) => itemSelectionStates[index]);
  };

  return (
    <UnifiedDashboardLayout activeTab="try-on">
      {/* Welcome Message */}
      <div className="mb-6">
        <h2 className="text-xl dashboard-dark:text-white/80 dashboard-light:text-gray-600 [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-600">
          Welcome back, <span className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-semibold">{user?.name || user?.email}</span>
        </h2>
        <p className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500 mt-1">
          Create stunning virtual try-ons with AI-powered technology
        </p>
      </div>

      {/* Upgrade Banner - Collapsible */}
      {isUpgradeBannerVisible && (
        <div className="mb-6 rounded-xl overflow-hidden border [.dashboard-dark_&]:bg-gradient-to-r [.dashboard-dark_&]:from-purple-900/40 [.dashboard-dark_&]:via-pink-900/30 [.dashboard-dark_&]:to-amber-900/40 [.dashboard-dark_&]:border-purple-500/30 [.dashboard-light_&]:bg-gradient-to-r [.dashboard-light_&]:from-purple-50 [.dashboard-light_&]:via-pink-50 [.dashboard-light_&]:to-amber-50 [.dashboard-light_&]:border-purple-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg [.dashboard-dark_&]:bg-gradient-to-r [.dashboard-dark_&]:from-pink-500 [.dashboard-dark_&]:to-purple-500 [.dashboard-light_&]:bg-gradient-to-r [.dashboard-light_&]:from-pink-400 [.dashboard-light_&]:to-purple-400">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">
                  You're on the <span className="capitalize font-semibold">{quota?.plan || 'free'}</span> plan
                  <span className="mx-2 [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400">•</span>
                  <span className="[.dashboard-dark_&]:text-white/70 [.dashboard-light_&]:text-gray-600">
                    {isLifetimeQuota
                      ? `${quotaUsed}/${quotaLimit} lifetime try-ons used`
                      : `${quotaUsed}/${quotaLimit} monthly try-ons used`
                    }
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 text-xs px-4"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
              <button
                onClick={() => setIsUpgradeBannerVisible(false)}
                className="p-1 rounded-md [.dashboard-dark_&]:hover:bg-white/10 [.dashboard-light_&]:hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4 [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Upgrade Badge - Shows when banner is hidden */}
      {!isUpgradeBannerVisible && (
        <button
          onClick={() => setIsUpgradeBannerVisible(true)}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 [.dashboard-dark_&]:bg-gradient-to-r [.dashboard-dark_&]:from-purple-900/50 [.dashboard-dark_&]:to-pink-900/50 [.dashboard-dark_&]:border [.dashboard-dark_&]:border-purple-500/30 [.dashboard-dark_&]:text-purple-200 [.dashboard-light_&]:bg-gradient-to-r [.dashboard-light_&]:from-purple-100 [.dashboard-light_&]:to-pink-100 [.dashboard-light_&]:border [.dashboard-light_&]:border-purple-300 [.dashboard-light_&]:text-purple-700"
        >
          <Sparkles className="h-3 w-3" />
          <span className="capitalize">{quota?.plan || 'free'}</span> Plan
          <ChevronDown className="h-3 w-3" />
        </button>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              {isLifetimeQuota ? 'Lifetime Quota' : 'Monthly Quota'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{quotaUsed}</span>
              <span className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">/ {quotaLimit}</span>
            </div>
            <Progress value={quotaPercentage} className="h-2 [.dashboard-dark_&]:bg-white/10 [.dashboard-light_&]:bg-gray-200" />
            {/* Studio/Widget Breakdown */}
            <div className="flex items-center gap-3 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <span className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Studio: {studioQuotaUsed}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Widget: {widgetQuotaUsed}</span>
              </div>
            </div>
            {!isLifetimeQuota && quota?.quotaResetAt && (
              <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400 mt-2">
                Resets {new Date(quota.quotaResetAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Total Sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{analytics?.totalSessions || 0}</span>
            </div>
            <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400 mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{analytics?.completedSessions || 0}</span>
            </div>
            <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400 mt-2">Successful try-ons</p>
          </CardContent>
        </Card>

        <Card className="[.dashboard-dark_&]:bg-black/30 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-white [.dashboard-light_&]:border-gray-200 [.dashboard-light_&]:shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <span className="text-2xl font-bold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">{analytics?.conversionRate || 0}%</span>
            </div>
            <p className="text-xs [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400 mt-2">Sessions to completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Try-On Studio Section */}
      <div className="[.dashboard-dark_&]:bg-black/20 [.dashboard-dark_&]:border-white/10 [.dashboard-light_&]:bg-gray-50 [.dashboard-light_&]:border-gray-200 rounded-xl p-6 border backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">Mirror.me</span>
            <span className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900"> Studio</span>
          </h3>
          <Link href="/dashboard/integration" className="flex items-center gap-2 text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-dark_&]:hover:text-primary [.dashboard-light_&]:text-gray-500 [.dashboard-light_&]:hover:text-primary transition-colors">
            <Code className="h-4 w-4" />
            Integration Guide
          </Link>
        </div>

        {/* Consolidated Try-On Workspace */}
        <div id="try-on-workspace">
          <TryOnWorkspace
            modelImage={modelImage}
            allFashionItems={allFashionItems}
            selectedFashionItems={selectedFashionItems}
            itemSelectionStates={itemSelectionStates}
            selectedItemsCount={getSelectedItemsCount()}
            onResultsGenerated={handleResultsGenerated}
            onGenerationProgress={handleGenerationProgress}
            onGenerationStart={handleGenerationStart}
            onGenerationEnd={handleGenerationEnd}
            onItemRemove={handleItemRemove}
            onItemSelectionToggle={handleItemSelectionToggle}
            getSelectedFashionItems={getSelectedFashionItems}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onModelImageSelect={handleModelImageSelect}
            onFashionImagesSelect={handleFashionImagesSelect}
            onFashionItemSelect={handleFashionItemSelect}
          />
        </div>

        {/* Results Gallery */}
        <div id="results-gallery">
          <ResultsGallery latestResults={latestResults} />
        </div>
      </div>

    </UnifiedDashboardLayout>
  );
}
