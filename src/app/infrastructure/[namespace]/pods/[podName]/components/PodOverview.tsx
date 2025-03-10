"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';

interface PodDetails {
  status: {
    phase: string;
    conditions: Array<{
      type: string;
      status: string;
      lastTransitionTime: string;
    }>;
    containerStatuses: Array<{
      name: string;
      ready: boolean;
      restartCount: number;
      state: {
        [key: string]: {
          startedAt?: string;
          reason?: string;
          message?: string;
        };
      };
    }>;
    podIP: string;
    hostIP: string;
    startTime: string;
  };
  spec: {
    nodeName: string;
    containers: Array<{
      name: string;
      image: string;
      ports?: Array<{
        containerPort: number;
        protocol: string;
      }>;
      resources: {
        requests?: {
          cpu?: string;
          memory?: string;
        };
        limits?: {
          cpu?: string;
          memory?: string;
        };
      };
      volumeMounts?: Array<{
        name: string;
        mountPath: string;
      }>;
    }>;
    volumes?: Array<{
      name: string;
      configMap?: {
        name: string;
      };
      secret?: {
        secretName: string;
      };
      persistentVolumeClaim?: {
        claimName: string;
      };
    }>;
  };
  metadata: {
    creationTimestamp: string;
    labels?: { [key: string]: string };
    annotations?: { [key: string]: string };
  };
}

interface PodOverviewProps {
  namespace: string;
  podName: string;
}

export default function PodOverview({ namespace, podName }: PodOverviewProps) {
  const [podDetails, setPodDetails] = useState<PodDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPodDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/kubernetes/pods/${namespace}/${podName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pod details');
        }
        const data = await response.json();
        setPodDetails(data);
      } catch (error: any) {
        console.error('Error fetching pod details:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodDetails();
    const interval = setInterval(fetchPodDetails, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [namespace, podName]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'ready':
      case 'true':
        return 'default';
      case 'pending':
      case 'unknown':
        return 'secondary';
      case 'failed':
      case 'false':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading && !podDetails) {
    return <div>Loading pod details...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!podDetails) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-muted-foreground">No pod details available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6">
        {/* Status Section */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phase:</span>
                  <Badge variant={getStatusColor(podDetails.status.phase)}>
                    {podDetails.status.phase}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pod IP:</span>
                  <span>{podDetails.status.podIP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host IP:</span>
                  <span>{podDetails.status.hostIP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Node:</span>
                  <span>{podDetails.spec.nodeName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDistanceToNow(new Date(podDetails.metadata.creationTimestamp), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>{podDetails.status.startTime ? formatDistanceToNow(new Date(podDetails.status.startTime), { addSuffix: true }) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions Section */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Conditions</h3>
            <div className="space-y-4">
              {podDetails.status.conditions.map((condition, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{condition.type}:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(condition.status)}>
                      {condition.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({formatDistanceToNow(new Date(condition.lastTransitionTime), { addSuffix: true })})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Containers Section */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Containers</h3>
            <div className="space-y-6">
              {podDetails.spec.containers.map((container, index) => {
                const status = podDetails.status.containerStatuses?.find(
                  (s) => s.name === container.name
                );
                const state = status?.state ? Object.entries(status.state)[0] : null;

                return (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{container.name}</span>
                      {status && (
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(status.ready.toString())}>
                            {status.ready ? 'Ready' : 'Not Ready'}
                          </Badge>
                          {status.restartCount > 0 && (
                            <span className="text-sm text-muted-foreground">
                              ({status.restartCount} restarts)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Image:</span>
                          <span className="text-right">{container.image}</span>
                        </div>
                        {state && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">State:</span>
                            <div className="text-right">
                              <div>{state[0]}</div>
                              {state[1].startedAt && (
                                <div className="text-xs text-muted-foreground">
                                  Started {formatDistanceToNow(new Date(state[1].startedAt), { addSuffix: true })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {container.ports && container.ports.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ports:</span>
                            <div className="text-right">
                              {container.ports.map((port, i) => (
                                <div key={i}>
                                  {port.containerPort}/{port.protocol}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(container.resources.requests || container.resources.limits) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Resources:</span>
                            <div className="text-right">
                              {container.resources.requests && (
                                <div>
                                  Requests: {container.resources.requests.cpu || 'N/A'} CPU,{' '}
                                  {container.resources.requests.memory || 'N/A'} Memory
                                </div>
                              )}
                              {container.resources.limits && (
                                <div>
                                  Limits: {container.resources.limits.cpu || 'N/A'} CPU,{' '}
                                  {container.resources.limits.memory || 'N/A'} Memory
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Volumes Section */}
        {podDetails.spec.volumes && podDetails.spec.volumes.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Volumes</h3>
              <div className="space-y-4">
                {podDetails.spec.volumes.map((volume, index) => (
                  <div key={index} className="space-y-2">
                    <div className="font-medium">{volume.name}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        {volume.configMap && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Config Map:</span>
                            <span>{volume.configMap.name}</span>
                          </div>
                        )}
                        {volume.secret && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Secret:</span>
                            <span>{volume.secret.secretName}</span>
                          </div>
                        )}
                        {volume.persistentVolumeClaim && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">PVC:</span>
                            <span>{volume.persistentVolumeClaim.claimName}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {podDetails.spec.containers.map((container) => {
                          const mount = container.volumeMounts?.find(
                            (m) => m.name === volume.name
                          );
                          if (mount) {
                            return (
                              <div key={container.name} className="flex justify-between">
                                <span className="text-muted-foreground">{container.name}:</span>
                                <span>{mount.mountPath}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Labels and Annotations */}
        {(podDetails.metadata.labels || podDetails.metadata.annotations) && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Metadata</h3>
              {podDetails.metadata.labels && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Labels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(podDetails.metadata.labels).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {podDetails.metadata.annotations && (
                <div>
                  <h4 className="font-medium mb-2">Annotations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(podDetails.metadata.annotations).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
} 