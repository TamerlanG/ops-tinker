"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Forward, X } from "lucide-react";

interface PortForward {
  localPort: number;
  remotePort: number;
  status: 'active' | 'stopped';
}

interface PodPortForwardProps {
  namespace: string;
  podName: string;
}

export default function PodPortForward({ namespace, podName }: PodPortForwardProps) {
  const [portForwards, setPortForwards] = useState<PortForward[]>([]);
  const [localPort, setLocalPort] = useState('');
  const [remotePort, setRemotePort] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortForwards();
  }, [namespace, podName]);

  const fetchPortForwards = async () => {
    try {
      const response = await fetch(`/api/kubernetes/pods/${namespace}/${podName}/port-forwards`);
      if (!response.ok) throw new Error('Failed to fetch port forwards');
      const data = await response.json();
      setPortForwards(data.portForwards);
    } catch (error) {
      console.error('Error fetching port forwards:', error);
      setError('Failed to fetch port forwards');
    }
  };

  const startPortForward = async () => {
    if (!localPort || !remotePort) {
      setError('Please enter both local and remote ports');
      return;
    }

    try {
      const response = await fetch(`/api/kubernetes/pods/${namespace}/${podName}/port-forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localPort: parseInt(localPort),
          remotePort: parseInt(remotePort),
        }),
      });

      if (!response.ok) throw new Error('Failed to start port forward');
      
      setLocalPort('');
      setRemotePort('');
      fetchPortForwards();
    } catch (error) {
      console.error('Error starting port forward:', error);
      setError('Failed to start port forward');
    }
  };

  const stopPortForward = async (localPort: number, remotePort: number) => {
    try {
      const response = await fetch(`/api/kubernetes/pods/${namespace}/${podName}/port-forward`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localPort, remotePort }),
      });

      if (!response.ok) throw new Error('Failed to stop port forward');
      
      fetchPortForwards();
    } catch (error) {
      console.error('Error stopping port forward:', error);
      setError('Failed to stop port forward');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <label className="text-sm font-medium">Local Port</label>
                <Input
                  type="number"
                  value={localPort}
                  onChange={(e) => setLocalPort(e.target.value)}
                  placeholder="e.g. 8080"
                  min="1"
                  max="65535"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Remote Port</label>
                <Input
                  type="number"
                  value={remotePort}
                  onChange={(e) => setRemotePort(e.target.value)}
                  placeholder="e.g. 80"
                  min="1"
                  max="65535"
                />
              </div>
            </div>
            <div className="pt-6">
              <Button onClick={startPortForward}>
                <Forward className="h-4 w-4 mr-2" />
                Forward Port
              </Button>
            </div>
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {portForwards.map((pf, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Badge variant={pf.status === 'active' ? 'default' : 'secondary'}>
                  {pf.status}
                </Badge>
                <span>
                  localhost:{pf.localPort} → {podName}:{pf.remotePort}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => stopPortForward(pf.localPort, pf.remotePort)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 