'use client';

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { InfrastructureClient } from "./components/infrastructure-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { NamespaceSelector } from "@/components/NamespaceSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { ClusterOverview } from "./components/ClusterOverview";
import { ServicesList } from "./components/ServicesList";
import { ResourceOverview } from "./components/ResourceOverview";
import { Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSection() {
  return (
    <div className="space-y-4">
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </div>
  );
}

async function getClusterInfo() {
  const res = await fetch('/api/kubernetes/clusters', { 
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch cluster info');
  }
  
  return res.json().then(data => data.clusters);
}

async function getServicesInfo(namespace: string) {
  const res = await fetch(`/api/kubernetes/services?namespace=${namespace}`, { 
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch services info');
  }
  
  return res.json().then(data => data.services);
}

export default function Infrastructure() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [currentNamespace, setCurrentNamespace] = useState<string>('default');
  const [clusterInfo, setClusterInfo] = useState<any>(null);
  const [servicesInfo, setServicesInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clusterData, servicesData] = await Promise.all([
        getClusterInfo(),
        getServicesInfo(currentNamespace)
      ]);
      setClusterInfo(clusterData);
      setServicesInfo(servicesData);
      setLastFetched(new Date());
      toast.success('Infrastructure data refreshed');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      toast.error('Failed to fetch infrastructure data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchData();
  }, [currentNamespace]);

  useEffect(() => {
    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchData, 30000);
    }

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [autoRefresh, currentNamespace]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleNamespaceChange = (namespace: string) => {
    setCurrentNamespace(namespace);
  };

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Infrastructure</h1>
          <div className="flex items-center gap-4">
            <NamespaceSelector 
              value={currentNamespace} 
              onChange={handleNamespaceChange}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                id="auto-refresh-infra"
              />
              <label htmlFor="auto-refresh-infra" className="text-sm">
                Auto-refresh
              </label>
            </div>
            <Button onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {lastFetched && (
          <div className="flex justify-end">
            <span className="text-sm text-muted-foreground">
              Last updated {formatDistanceToNow(lastFetched, { addSuffix: true })}
            </span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <LoadingSection />
            ) : (
              <ClusterOverview data={{ clusters: clusterInfo }} />
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {isLoading ? (
              <LoadingSection />
            ) : (
              <ServicesList data={{ services: servicesInfo }} />
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceOverview namespace={currentNamespace} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster 
        position="top-right"
        expand={false}
        richColors
      />
    </>
  );
} 