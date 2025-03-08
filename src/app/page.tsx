import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Tinker Ops</h1>
        <p className="text-muted-foreground">
          Your experimental playground for infrastructure, deployments, and DevOps metrics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/infrastructure" className="transition-transform hover:scale-105">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure</CardTitle>
              <CardDescription>Monitor your cloud resources and infrastructure health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge>Kubernetes</Badge>
                <Badge variant="secondary">AWS</Badge>
                <Badge variant="outline">Monitoring</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/deployments" className="transition-transform hover:scale-105">
          <Card>
            <CardHeader>
              <CardTitle>Deployments</CardTitle>
              <CardDescription>Manage and track your application deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge>CI/CD</Badge>
                <Badge variant="secondary">GitOps</Badge>
                <Badge variant="outline">Releases</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/metrics" className="transition-transform hover:scale-105">
          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>Track key DevOps performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge>DORA</Badge>
                <Badge variant="secondary">SLOs</Badge>
                <Badge variant="outline">Analytics</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
