import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Resource {
  name: string;
  namespace: string;
  age: string;
  [key: string]: any;
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

export function ResourceOverview({ namespace }: ResourceOverviewProps) {
  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pods');

  const fetchResources = async () => {
    try {
      const response = await fetch(`/api/kubernetes/resources?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      const data = await response.json();
      setResources(data);
      toast.success('Resources updated');
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 30000);
    return () => clearInterval(interval);
  }, [namespace]);

  const renderResourceList = (items: Resource[], extraFields: { label: string; key: string }[] = []) => {
    if (!items?.length) return <div className="text-muted-foreground">No items found</div>;

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={`${item.namespace}-${item.name}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{item.name}</span>
                {item.status && (
                  <Badge variant={item.status === 'Running' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {extraFields.map(({ label, key }) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{label}:</span>
                    <span>{typeof item[key] === 'object' ? JSON.stringify(item[key]) : item[key]}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span>{new Date(item.age).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
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
  );
} 