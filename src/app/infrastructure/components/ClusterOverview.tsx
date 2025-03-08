import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClusterOverviewProps {
  data: {
    clusters: Array<{
      name: string;
      status: string;
      cpu: number;
      memory: number;
      conditions: Array<{
        type: string;
        status: string;
        message: string;
      }>;
      info: {
        kubeletVersion: string;
        osImage: string;
        containerRuntime: string;
      };
    }>;
  };
}

export function ClusterOverview({ data }: ClusterOverviewProps) {
  const { clusters = [] } = data || {};

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clusters.map((node) => (
        <Card key={node.name}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{node.name}</span>
              <span className={`text-sm px-2 py-1 rounded ${
                node.status === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {node.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Resources</div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">CPU</div>
                    <div className="text-lg font-bold">{node.cpu}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Memory</div>
                    <div className="text-lg font-bold">{node.memory}%</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Info</div>
                <div className="mt-2 space-y-1">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Version: </span>
                    {node.info.kubeletVersion}
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">OS: </span>
                    {node.info.osImage}
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Runtime: </span>
                    {node.info.containerRuntime}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Conditions</div>
                <div className="mt-2 space-y-2">
                  {node.conditions.map((condition) => (
                    <div
                      key={condition.type}
                      className="text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span>{condition.type}</span>
                        <span className={condition.status === 'True' ? 'text-green-600' : 'text-yellow-600'}>
                          {condition.status}
                        </span>
                      </div>
                      {condition.message && (
                        <div className="text-muted-foreground mt-1">
                          {condition.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 