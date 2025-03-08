"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface ClusterInfo {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  info: {
    kubeletVersion?: string;
    osImage?: string;
    containerRuntime?: string;
  };
}

interface ServiceInfo {
  name: string;
  namespace?: string;
  type?: string;
  clusterIP?: string;
  status: string;
  pods: {
    total: number;
    running: number;
  };
  cpu: number;
  memory: number;
}

export function InfrastructureClient({ 
  initialClusters, 
  initialServices 
}: { 
  initialClusters: ClusterInfo[],
  initialServices: ServiceInfo[]
}) {
  const [clusters, setClusters] = useState(initialClusters);
  const [services, setServices] = useState(initialServices);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const [clusterData, servicesData] = await Promise.all([
        fetch('/api/kubernetes/clusters').then(res => res.json()),
        fetch('/api/kubernetes/services').then(res => res.json()),
      ]);

      setClusters(clusterData.clusters);
      setServices(servicesData.services);
      toast.success('Infrastructure data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Infrastructure Overview</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your Kubernetes clusters and cloud resources
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          title="Refresh"
          onClick={refreshData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs defaultValue="clusters">
        <TabsList>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clusters" className="space-y-4">
          {clusters.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Clusters Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No Kubernetes clusters were found. Make sure you have a valid kubeconfig file
                  and the clusters are accessible.
                </p>
              </CardContent>
            </Card>
          ) : (
            clusters.map((cluster: ClusterInfo) => (
              <Card key={cluster.name}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{cluster.name}</CardTitle>
                    <Badge variant={cluster.status === "Healthy" ? "default" : "destructive"}>
                      {cluster.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span>{cluster.cpu}%</span>
                      </div>
                      <Progress value={cluster.cpu} />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>{cluster.memory}%</span>
                      </div>
                      <Progress value={cluster.memory} />
                    </div>
                    <div className="grid gap-2">
                      <div className="text-sm text-muted-foreground">Node Info</div>
                      <div className="text-sm grid gap-1">
                        <div>Kubernetes: {cluster.info.kubeletVersion}</div>
                        <div>OS: {cluster.info.osImage}</div>
                        <div>Runtime: {cluster.info.containerRuntime}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {services.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Services Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No Kubernetes services were found in the current namespace.
                </p>
              </CardContent>
            </Card>
          ) : (
            services.map((service: ServiceInfo) => (
              <Card key={service.name}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground">
                        Pods: {service.pods.running}/{service.pods.total}
                      </span>
                      <Badge variant={service.status === "Running" ? "default" : "destructive"}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span>{service.cpu}%</span>
                      </div>
                      <Progress value={service.cpu} />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>{service.memory}%</span>
                      </div>
                      <Progress value={service.memory} />
                    </div>
                    <div className="grid gap-2">
                      <div className="text-sm text-muted-foreground">Service Info</div>
                      <div className="text-sm grid gap-1">
                        <div>Type: {service.type}</div>
                        <div>Cluster IP: {service.clusterIP}</div>
                        <div>Namespace: {service.namespace}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 