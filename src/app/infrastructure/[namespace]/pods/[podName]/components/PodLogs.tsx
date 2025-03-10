"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Search } from "lucide-react";

interface PodLogsProps {
  namespace: string;
  podName: string;
}

export default function PodLogs({ namespace, podName }: PodLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let eventSource: EventSource;

    const startLogStream = () => {
      eventSource = new EventSource(`/api/kubernetes/pods/${namespace}/${podName}/logs`);
      
      eventSource.onmessage = (event) => {
        try {
          const logLine = JSON.parse(event.data);
          setLogs(prev => [...prev, logLine]);
          
          // Auto-scroll if following is enabled
          if (isFollowing && scrollAreaRef.current) {
            const scrollArea = scrollAreaRef.current;
            scrollArea.scrollTop = scrollArea.scrollHeight;
          }
        } catch (error) {
          console.error('Error parsing log data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setError('Failed to connect to log stream');
        eventSource.close();
      };
    };

    startLogStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [namespace, podName, isFollowing]);

  const filteredLogs = searchQuery
    ? logs.filter(log => log.toLowerCase().includes(searchQuery.toLowerCase()))
    : logs;

  const downloadLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${podName}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={toggleFollow}>
          {isFollowing ? 'Pause' : 'Follow'}
        </Button>
        <Button variant="outline" onClick={downloadLogs}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-[600px] border rounded-md bg-black p-4"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
            if (!isAtBottom && isFollowing) {
              setIsFollowing(false);
            }
          }}
        >
          <pre className="font-mono text-sm text-green-400">
            {filteredLogs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
} 