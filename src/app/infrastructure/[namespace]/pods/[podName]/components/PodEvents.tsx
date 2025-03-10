"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Event {
  type: string;
  reason: string;
  message: string;
  count: number;
  lastTimestamp: string;
  involvedObject: {
    kind: string;
    name: string;
  };
}

interface PodEventsProps {
  namespace: string;
  podName: string;
}

export default function PodEvents({ namespace, podName }: PodEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/kubernetes/pods/${namespace}/${podName}/events`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.message || 'Failed to fetch pod events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(fetchEvents, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [namespace, podName, autoRefresh]);

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'warning': return 'destructive';
      case 'normal': return 'default';
      default: return 'secondary';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive flex items-center gap-2">
            <span className="font-medium">Error:</span>
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
        </div>
        {events.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {events.length} event{events.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground text-center">
                  No events found for this pod
                </div>
              </CardContent>
            </Card>
          ) : (
            events.map((event, index) => (
              <Card key={index} className="group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventColor(event.type)}>
                        {event.type}
                      </Badge>
                      <span className="font-medium">{event.reason}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(event.lastTimestamp), { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-sm mt-2">{event.message}</p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Occurred {event.count} time{event.count === 1 ? '' : 's'}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 