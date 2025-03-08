import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Mock data
const doraMetrics = {
  deploymentFrequency: {
    current: "24.5/week",
    trend: "+12%",
    status: "Elite",
    history: [15, 18, 22, 19, 24, 25, 24.5],
  },
  leadTime: {
    current: "2.5 days",
    trend: "-15%",
    status: "High",
    history: [4, 3.5, 3, 2.8, 2.6, 2.5, 2.5],
  },
  changeFailureRate: {
    current: "3.2%",
    trend: "-2%",
    status: "Elite",
    history: [5, 4.5, 4, 3.8, 3.5, 3.2, 3.2],
  },
  timeToRestore: {
    current: "2 hours",
    trend: "-25%",
    status: "Elite",
    history: [4, 3.5, 3, 2.5, 2.2, 2, 2],
  },
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "elite":
      return "default";
    case "high":
      return "secondary";
    case "medium":
      return "outline";
    case "low":
      return "destructive";
    default:
      return "default";
  }
};

const getTrendBadge = (trend: string) => {
  const value = parseFloat(trend);
  if (value > 0) {
    return <Badge variant="default">↑ {trend}</Badge>;
  } else {
    return <Badge variant="secondary">↓ {trend}</Badge>;
  }
};

export default function Metrics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DevOps Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Track your DORA metrics and key performance indicators
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Deployment Frequency</CardTitle>
                <p className="text-sm text-muted-foreground">
                  How often you deploy to production
                </p>
              </div>
              <Badge variant={getStatusColor(doraMetrics.deploymentFrequency.status)}>
                {doraMetrics.deploymentFrequency.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {doraMetrics.deploymentFrequency.current}
              </div>
              {getTrendBadge(doraMetrics.deploymentFrequency.trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Lead Time for Changes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Time from code commit to production
                </p>
              </div>
              <Badge variant={getStatusColor(doraMetrics.leadTime.status)}>
                {doraMetrics.leadTime.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {doraMetrics.leadTime.current}
              </div>
              {getTrendBadge(doraMetrics.leadTime.trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Change Failure Rate</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Percentage of deployments causing failures
                </p>
              </div>
              <Badge variant={getStatusColor(doraMetrics.changeFailureRate.status)}>
                {doraMetrics.changeFailureRate.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {doraMetrics.changeFailureRate.current}
              </div>
              {getTrendBadge(doraMetrics.changeFailureRate.trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Time to Restore Service</CardTitle>
                <p className="text-sm text-muted-foreground">
                  How quickly service is restored after failure
                </p>
              </div>
              <Badge variant={getStatusColor(doraMetrics.timeToRestore.status)}>
                {doraMetrics.timeToRestore.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {doraMetrics.timeToRestore.current}
              </div>
              {getTrendBadge(doraMetrics.timeToRestore.trend)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 