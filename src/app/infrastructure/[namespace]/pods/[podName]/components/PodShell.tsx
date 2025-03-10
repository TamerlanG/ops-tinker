"use client";

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Card } from "@/components/ui/card";
import 'xterm/css/xterm.css';

interface PodShellProps {
  namespace: string;
  podName: string;
}

export default function PodShell({ namespace, podName }: PodShellProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const webSocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1b1e',
        foreground: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    // Mount terminal
    term.open(terminalRef.current);
    fitAddon.fit();

    // Connect to WebSocket
    const ws = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/kubernetes/pods/${namespace}/${podName}/exec`
    );

    ws.onopen = () => {
      term.writeln('Connected to pod shell...');
      term.focus();
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln('\r\nConnection closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      term.writeln('\r\nError: Failed to connect to pod shell');
    };

    // Handle terminal input
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows,
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    // Store references
    terminalInstance.current = term;
    webSocket.current = ws;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      ws.close();
    };
  }, [namespace, podName]);

  return (
    <Card className="p-4">
      <div 
        ref={terminalRef} 
        className="h-[500px] rounded-md overflow-hidden"
        style={{ background: '#1a1b1e' }}
      />
    </Card>
  );
} 