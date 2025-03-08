import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const clusters = [
  {
    name: "prod-cluster-1",
    status: "Healthy",
    cpu: 78,
    memory: 82,
    pods: 45,
    nodes: 5,
  },
  {
    name: "staging-cluster-1",
    status: "Warning",
    cpu: 45,
    memory: 92,
    pods: 28,
    nodes: 3,
  },
];

const services = [
  {
    name: "frontend-service",
    status: "Running",
    replicas: "3/3",
    cpu: 45,
    memory: 60,
  },
  {
    name: "backend-api",
    status: "Running",
    replicas: "2/2",
    cpu: 65,
    memory: 75,
  },
  {
    name: "database",
    status: "Warning",
    replicas: "2/3",
    cpu: 85,
    memory: 90,
  },
];

export default function Infrastructure() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Infrastructure Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your Kubernetes clusters and cloud resources
        </p>
      </div>

      <Tabs defaultValue="clusters">
        <TabsList>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clusters" className="space-y-4">
          {clusters.map((cluster) => (
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Pods</span>
                      <span className="text-2xl font-bold">{cluster.pods}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Nodes</span>
                      <span className="text-2xl font-bold">{cluster.nodes}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {services.map((service) => (
            <Card key={service.name}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">
                      Replicas: {service.replicas}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
} 