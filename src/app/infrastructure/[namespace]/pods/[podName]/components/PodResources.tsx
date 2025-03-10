"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ResourceMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
}

interface PodResourcesProps {
  namespace: string;
  podName: string;
}

export default function PodResources({ namespace, podName }: PodResourcesProps) {
  const [currentMetrics, setCurrentMetrics] = useState<ResourceMetrics | null>(null);
  const [historicalMetrics, setHistoricalMetrics] = useState<ResourceMetrics[]>([]);
  const [error, setError] = useState<{ message: string; details?: string; docs?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/kubernetes/pods/${namespace}/${podName}/metrics`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to fetch metrics');
        }
        
        const newMetric = {
          timestamp: Date.now(),
          cpu: Math.min(data.cpu, 100), // Cap at 100%
          memory: Math.min(data.memory, 100) // Cap at 100%
        };

        setCurrentMetrics(newMetric);
        setHistoricalMetrics(prev => {
          const newMetrics = [...prev, newMetric];
          // Keep last 30 minutes of data (assuming 10s intervals)
          if (newMetrics.length > 180) {
            return newMetrics.slice(-180);
          }
          return newMetrics;
        });
        setError(null);
      } catch (error: any) {
        console.error('Error fetching metrics:', error);
        let errorData;
        try {
          errorData = await error.json();
        } catch {
          errorData = { message: error.message };
        }
        setError({
          message: errorData.error || 'Failed to fetch resource metrics',
          details: errorData.details,
          docs: errorData.docs,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [namespace, podName]);

  const getResourceStatus = (value: number) => {
    if (value >= 90) return 'critical';
    if (value >= 75) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive">{error.message}</div>
          {error.details && (
            <div className="text-muted-foreground text-sm">{error.details}</div>
          )}
          {error.docs && (
            <Button variant="outline" size="sm" asChild>
              <a href={error.docs} target="_blank" rel="noopener noreferrer">
                Installation Guide
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !currentMetrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-muted-foreground">Loading resource metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">CPU Usage</h3>
              {currentMetrics && (
                <Badge variant={getStatusColor(getResourceStatus(currentMetrics.cpu))}>
                  {currentMetrics.cpu.toFixed(1)}%
                </Badge>
              )}
            </div>
            <Progress 
              value={currentMetrics?.cpu || 0} 
              className={
                getResourceStatus(currentMetrics?.cpu || 0) === 'critical' 
                  ? 'bg-red-200' 
                  : getResourceStatus(currentMetrics?.cpu || 0) === 'warning'
                    ? 'bg-yellow-200'
                    : undefined
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">Memory Usage</h3>
              {currentMetrics && (
                <Badge variant={getStatusColor(getResourceStatus(currentMetrics.memory))}>
                  {currentMetrics.memory.toFixed(1)}%
                </Badge>
              )}
            </div>
            <Progress 
              value={currentMetrics?.memory || 0}
              className={
                getResourceStatus(currentMetrics?.memory || 0) === 'critical' 
                  ? 'bg-red-200' 
                  : getResourceStatus(currentMetrics?.memory || 0) === 'warning'
                    ? 'bg-yellow-200'
                    : undefined
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-base font-medium mb-4">Resource Usage History</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalMetrics}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                  stroke="#888888"
                />
                <YAxis 
                  stroke="#888888"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#2563eb"
                  name="CPU"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#16a34a"
                  name="Memory"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 