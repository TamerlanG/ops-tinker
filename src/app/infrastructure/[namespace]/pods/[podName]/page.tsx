import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, RefreshCw, Trash2, RotateCw, Forward, MonitorSmartphone } from "lucide-react";
import PodLogs from "./components/PodLogs";
import PodEvents from "./components/PodEvents";
import PodResources from "./components/PodResources";
import PodShell from "./components/PodShell";
import PodPortForward from "./components/PodPortForward";
import PodOverview from "./components/PodOverview";

interface PageProps {
  params: {
    namespace: string;
    podName: string;
  };
}

export default async function PodDetailsPage({ params }: PageProps) {
  // In Next.js server components, we need to await the params object itself
  const routeParams = await params;
  const { namespace, podName } = routeParams;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{podName}</h1>
          <p className="text-muted-foreground">Namespace: {namespace}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <RotateCw className="h-4 w-4 mr-2" />
            Restart
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="shell">Shell</TabsTrigger>
          <TabsTrigger value="port-forward">Port Forward</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<div>Loading pod details...</div>}>
            <PodOverview namespace={namespace} podName={podName} />
          </Suspense>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Container Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading logs...</div>}>
                <PodLogs namespace={namespace} podName={podName} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Pod Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading events...</div>}>
                <PodEvents namespace={namespace} podName={podName} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading resource metrics...</div>}>
                <PodResources namespace={namespace} podName={podName} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shell">
          <Card>
            <CardHeader>
              <CardTitle>Terminal Access</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading terminal...</div>}>
                <PodShell namespace={namespace} podName={podName} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="port-forward">
          <Card>
            <CardHeader>
              <CardTitle>Port Forwarding</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading port forward options...</div>}>
                <PodPortForward namespace={namespace} podName={podName} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 