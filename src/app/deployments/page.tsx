import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock data
const deployments = [
  {
    id: "deploy-123",
    app: "frontend-app",
    environment: "production",
    status: "Successful",
    version: "v1.2.3",
    timestamp: "2024-03-08 14:30:00",
    commit: "8f4d2a1",
    author: "John Doe",
  },
  {
    id: "deploy-122",
    app: "backend-api",
    environment: "staging",
    status: "In Progress",
    version: "v2.0.0-beta",
    timestamp: "2024-03-08 14:15:00",
    commit: "3e5f7b9",
    author: "Jane Smith",
  },
  {
    id: "deploy-121",
    app: "database",
    environment: "production",
    status: "Failed",
    version: "v1.1.0",
    timestamp: "2024-03-08 13:45:00",
    commit: "2c4a6d8",
    author: "Bob Johnson",
  },
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "successful":
      return "default";
    case "in progress":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "default";
  }
};

export default function Deployments() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deployments</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your application deployments
          </p>
        </div>
        <Button>New Deployment</Button>
      </div>

      <div className="space-y-4">
        {deployments.map((deployment) => (
          <Card key={deployment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{deployment.app}</CardTitle>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">{deployment.environment}</Badge>
                    <Badge variant={getStatusColor(deployment.status)}>
                      {deployment.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{deployment.version}</div>
                  <div className="text-sm text-muted-foreground">
                    {deployment.timestamp}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Commit</div>
                  <div className="font-mono">{deployment.commit}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Author</div>
                  <div>{deployment.author}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">View Logs</Button>
                <Button variant="outline" size="sm">Rollback</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 