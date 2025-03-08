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

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="h-7 w-48 bg-muted animate-pulse rounded"></div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-2 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-2 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            <div className="space-y-1">
              <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
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
    </div>
  );
}

async function getClusterInfo() {
  try {
    const response = await fetch('http://localhost:3000/api/kubernetes/clusters', {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch cluster info');
    return response.json();
  } catch (error) {
    console.error('Error fetching cluster info:', error);
    return { clusters: [] };
  }
}

async function getServicesInfo(namespace: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/kubernetes/services?namespace=${namespace}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch services info');
    return response.json();
  } catch (error) {
    console.error('Error fetching services info:', error);
    return { services: [] };
  }
}

export default function Infrastructure() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [currentNamespace, setCurrentNamespace] = useState<string>('default');
  const [clusterInfo, setClusterInfo] = useState<any>(null);
  const [servicesInfo, setServicesInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [currentNamespace]);

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
            <p>{error}</p>
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
            <Button onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

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
              <ClusterOverview data={clusterInfo} />
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {isLoading ? (
              <LoadingSection />
            ) : (
              <ServicesList data={servicesInfo} />
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceOverview namespace={currentNamespace} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </>
  );
} 