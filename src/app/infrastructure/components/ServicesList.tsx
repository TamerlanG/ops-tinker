import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServicesListProps {
  data: {
    services: Array<{
      name: string;
      namespace: string;
      type: string;
      clusterIP: string;
      ports: Array<{
        port: number;
        targetPort: number | string;
        protocol: string;
      }>;
      status: string;
      pods: {
        total: number;
        running: number;
      };
      cpu: number;
      memory: number;
    }>;
  };
}

export function ServicesList({ data }: ServicesListProps) {
  const { services = [] } = data || {};

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Card key={`${service.namespace}-${service.name}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{service.name}</span>
              <span className={`text-sm px-2 py-1 rounded ${
                service.status === 'Running' 
                  ? 'bg-green-100 text-green-800' 
                  : service.status === 'Partially Running'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {service.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Details</div>
                <div className="mt-2 space-y-1">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Type: </span>
                    {service.type}
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Cluster IP: </span>
                    {service.clusterIP}
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Namespace: </span>
                    {service.namespace}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Ports</div>
                <div className="mt-2 space-y-2">
                  {service.ports.map((port, index) => (
                    <div key={index} className="text-xs flex items-center justify-between">
                      <span>{port.port}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{port.targetPort}</span>
                      <span className="text-muted-foreground">{port.protocol}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Pods</div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-lg font-bold">{service.pods.total}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Running</div>
                    <div className="text-lg font-bold">{service.pods.running}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Resources</div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">CPU</div>
                    <div className="text-lg font-bold">{service.cpu}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Memory</div>
                    <div className="text-lg font-bold">{service.memory}%</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 