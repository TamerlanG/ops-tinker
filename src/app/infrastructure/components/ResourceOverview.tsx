import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

interface Resource {
  name: string;
  namespace: string;
  age: string;
  status: string;
  kind?: string;
  [key: string]: any;
}

interface Column {
  label: string;
  key: string;
}

interface Event {
  name: string;
  namespace: string;
  type: string;
  reason: string;
  message: string;
  involvedObject: {
    kind: string;
    name: string;
  };
  count: number;
  lastTimestamp: string;
}

interface ResourceOverviewProps {
  namespace: string;
}

const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'healthy':
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
    case 'error':
    case 'unhealthy':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function ResourceOverview({ namespace }: ResourceOverviewProps) {
  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pods');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kubernetes/resources?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      const data = await response.json();
      setResources(data);
      setLastFetched(new Date());
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [namespace]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchResources, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, namespace]);

  const renderResourceList = (items: Resource[], extraFields: { label: string; key: string }[] = []) => {
    if (!items?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No resources found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No resources found in this namespace.</p>
          </CardContent>
        </Card>
      );
    }

    return items.map((item) => (
      <Card key={item.name} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1 max-w-[70%]">
              {activeTab === 'pods' ? (
                <Link href={`/infrastructure/${item.namespace}/pods/${item.name}`}>
                  <CardTitle className="text-lg font-medium break-all hover:underline">
                    {item.name}
                  </CardTitle>
                </Link>
              ) : (
                <CardTitle className="text-lg font-medium break-all">{item.name}</CardTitle>
              )}
              <div className="text-sm text-muted-foreground">
                Namespace: {item.namespace}
              </div>
            </div>
            {item.status && (
              <Badge variant={item.status === 'Healthy' || item.status === 'Running' ? 'default' : 'secondary'}>
                {item.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {extraFields.map(({ label, key }) => {
              const value = item[key];
              if (key === 'dataKeys') {
                return (
                  <div key={label} className="space-y-2">
                    <div className="text-sm font-medium">{label}</div>
                    {Array.isArray(value) && value.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {value.map((key) => (
                          <Badge key={key} variant="outline" className="break-all max-w-full">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No data keys</div>
                    )}
                  </div>
                );
              }
              return (
                <div key={label} className="space-y-1">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-sm break-all">{
                    typeof value === 'object' ? JSON.stringify(value) : value
                  }</div>
                </div>
              );
            })}
            <div className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(item.age), { addSuffix: true })}
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const renderEvents = (events: Event[]) => {
    if (!events?.length) return <div className="text-muted-foreground">No events found</div>;

    return (
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{event.involvedObject.kind}: {event.involvedObject.name}</span>
                <Badge variant={event.type === 'Warning' ? 'destructive' : 'default'}>
                  {event.reason}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>{event.message}</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Count: {event.count}</span>
                  <span>{new Date(event.lastTimestamp).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) return <div>Loading resources...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchResources}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </label>
          </div>
        </div>
        {lastFetched && (
          <span className="text-sm text-muted-foreground">
            Last updated {formatDistanceToNow(lastFetched, { addSuffix: true })}
          </span>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pods">Pods</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="configmaps">Config Maps</TabsTrigger>
          <TabsTrigger value="secrets">Secrets</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] rounded-md border p-4">
          <TabsContent value="pods">
            {renderResourceList(resources?.pods || [], [
              { label: 'Status', key: 'status' },
              { label: 'Node', key: 'node' },
              { label: 'IP', key: 'ip' },
              { label: 'Restarts', key: 'restarts' },
            ])}
          </TabsContent>

          <TabsContent value="deployments">
            {renderResourceList(resources?.deployments || [], [
              { label: 'Replicas', key: 'replicas' },
              { label: 'Strategy', key: 'strategy' },
            ])}
          </TabsContent>

          <TabsContent value="configmaps">
            {renderResourceList(resources?.configMaps || [], [
              { label: 'Data Keys', key: 'dataKeys' },
            ])}
          </TabsContent>

          <TabsContent value="secrets">
            {renderResourceList(resources?.secrets || [], [
              { label: 'Type', key: 'type' },
              { label: 'Data Keys', key: 'dataKeys' },
            ])}
          </TabsContent>

          <TabsContent value="events">
            {renderEvents(resources?.events || [])}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
} 