import { useState, useEffect } from 'react';
import UnifiedDashboardLayout from '@/components/UnifiedDashboardLayout';
import ModelUpload from '@/components/ModelUpload';
import FashionUpload from '@/components/FashionUpload';
import FashionCollection from '@/components/FashionCollection';
import TryOnWorkspace from '@/components/TryOnWorkspace';
import ResultsGallery from '@/components/ResultsGallery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FashionItem, TryOnResult } from '@shared/schema';
import { FashionItemInput } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, CheckCircle, Clock, Code } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });

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
  const quotaLimit = quota?.monthlyQuota || quota?.totalQuota || 100;
  const quotaPercentage = Math.min((quotaUsed / quotaLimit) * 100, 100);
  const isLifetimeQuota = quota?.plan === 'free';

  // Try-on handlers
  const handleModelImageSelect = (file: File) => {
    setModelImage(file);
    if (file) setCurrentStep(2);
  };

  const handleFashionImagesSelect = (files: File[]) => {
    setFashionImages(files);
    const newFashionItems: FashionItemInput[] = files.map((file, index) => ({
      image: file,
      name: file.name.split('.')[0] || `Fashion Item ${index + 1}`,
      category: 'Custom',
      source: 'upload' as const
    }));
    setAllFashionItems(newFashionItems);
    setItemSelectionStates(new Array(newFashionItems.length).fill(true));
    setSelectedFashionItems([]);
    if (files.length > 0) setCurrentStep(3);
  };

  const handleFashionItemSelect = (item: FashionItem) => {
    const isSelected = selectedFashionItems.some(selected => selected.id === item.id);
    let newSelectedItems: FashionItem[];

    if (isSelected) {
      newSelectedItems = selectedFashionItems.filter(selected => selected.id !== item.id);
    } else {
      newSelectedItems = [...selectedFashionItems, item];
    }

    setSelectedFashionItems(newSelectedItems);

    const collectionFashionItems: FashionItemInput[] = newSelectedItems.map(collectionItem => ({
      image: new File([], ''),
      name: collectionItem.name,
      category: collectionItem.category,
      source: 'collection' as const,
      collectionId: collectionItem.id
    }));

    setAllFashionItems(collectionFashionItems);
    setItemSelectionStates(new Array(collectionFashionItems.length).fill(true));
    setFashionImages([]);
    if (newSelectedItems.length > 0) setCurrentStep(3);
  };

  const handleBrowseCollection = () => {
    const collectionElement = document.getElementById('fashion-collection');
    collectionElement?.scrollIntoView({ behavior: 'smooth' });
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
    const newFashionItems = allFashionItems.filter((_, i) => i !== index);
    const newSelectionStates = itemSelectionStates.filter((_, i) => i !== index);
    setAllFashionItems(newFashionItems);
    setItemSelectionStates(newSelectionStates);

    if (allFashionItems.length > 0 && allFashionItems[0].source === 'collection') {
      const newSelectedItems = selectedFashionItems.filter((_, i) => i !== index);
      setSelectedFashionItems(newSelectedItems);
    }

    if (allFashionItems.length > 0 && allFashionItems[0].source === 'upload') {
      const newFashionImages = fashionImages.filter((_, i) => i !== index);
      setFashionImages(newFashionImages);
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
      <div className="mb-8">
        <h2 className="text-xl dashboard-dark:text-white/80 dashboard-light:text-gray-600 [.dashboard-dark_&]:text-white/80 [.dashboard-light_&]:text-gray-600">
          Welcome back, <span className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-semibold">{user?.name || user?.email}</span>
        </h2>
        <p className="[.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500 mt-1">
          Create stunning virtual try-ons with AI-powered technology
        </p>
      </div>

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
          <h3 className="text-xl font-semibold [.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900">Try-On Studio</h3>
          <Link href="/dashboard/integration" className="flex items-center gap-2 text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-dark_&]:hover:text-primary [.dashboard-light_&]:text-gray-500 [.dashboard-light_&]:hover:text-primary transition-colors">
            <Code className="h-4 w-4" />
            Integration Guide
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${currentStep >= 1 ? 'bg-primary text-black' : '[.dashboard-dark_&]:bg-white/10 [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:bg-gray-200 [.dashboard-light_&]:text-gray-400'} rounded-full flex items-center justify-center text-sm font-medium`}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? '[.dashboard-dark_&]:text-primary [.dashboard-light_&]:text-gray-900' : '[.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400'}`}>
                Upload Model
              </span>
            </div>
            <div className="w-8 h-px [.dashboard-dark_&]:bg-white/20 [.dashboard-light_&]:bg-gray-300"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${currentStep >= 2 ? 'bg-primary text-black' : '[.dashboard-dark_&]:bg-white/10 [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:bg-gray-200 [.dashboard-light_&]:text-gray-400'} rounded-full flex items-center justify-center text-sm font-medium`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? '[.dashboard-dark_&]:text-primary [.dashboard-light_&]:text-gray-900' : '[.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400'}`}>
                Select Fashion
              </span>
            </div>
            <div className="w-8 h-px [.dashboard-dark_&]:bg-white/20 [.dashboard-light_&]:bg-gray-300"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${currentStep >= 3 ? 'bg-primary text-black' : '[.dashboard-dark_&]:bg-white/10 [.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:bg-gray-200 [.dashboard-light_&]:text-gray-400'} rounded-full flex items-center justify-center text-sm font-medium`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 3 ? '[.dashboard-dark_&]:text-primary [.dashboard-light_&]:text-gray-900' : '[.dashboard-dark_&]:text-white/40 [.dashboard-light_&]:text-gray-400'}`}>
                Generate
              </span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <ModelUpload
            onImageSelect={handleModelImageSelect}
            selectedImage={modelImage}
          />
          <FashionUpload
            onImagesSelect={handleFashionImagesSelect}
            selectedImages={fashionImages}
            onBrowseCollection={handleBrowseCollection}
          />
        </div>

        {/* Fashion Collection */}
        <div id="fashion-collection" className="mb-8">
          <FashionCollection
            onItemSelect={handleFashionItemSelect}
            selectedItems={selectedFashionItems}
          />
        </div>

        {/* Try-On Workspace */}
        <div id="try-on-workspace" className="mb-8">
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
          />
        </div>

        {/* Results Gallery */}
        <div id="results-gallery">
          <ResultsGallery latestResults={latestResults} />
        </div>
      </div>

      {/* Plan Info */}
      <Card className="mt-6 [.dashboard-dark_&]:bg-gradient-to-r [.dashboard-dark_&]:from-primary/10 [.dashboard-dark_&]:to-amber-900/20 [.dashboard-dark_&]:border-primary/20 [.dashboard-light_&]:bg-gradient-to-r [.dashboard-light_&]:from-primary/5 [.dashboard-light_&]:to-amber-50 [.dashboard-light_&]:border-primary/30 backdrop-blur-sm">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="[.dashboard-dark_&]:text-white [.dashboard-light_&]:text-gray-900 font-medium">
              You're on the <span className="capitalize">{quota?.plan || 'free'}</span> plan
            </p>
            <p className="text-sm [.dashboard-dark_&]:text-white/60 [.dashboard-light_&]:text-gray-500">
              {isLifetimeQuota
                ? `${quotaLimit} lifetime try-ons included`
                : `${quotaLimit} try-ons per month`
              }
            </p>
          </div>
          <Button className="[.dashboard-dark_&]:bg-white [.dashboard-dark_&]:text-black [.dashboard-dark_&]:hover:bg-white/90 [.dashboard-light_&]:bg-gray-900 [.dashboard-light_&]:text-white [.dashboard-light_&]:hover:bg-gray-800">
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    </UnifiedDashboardLayout>
  );
}
