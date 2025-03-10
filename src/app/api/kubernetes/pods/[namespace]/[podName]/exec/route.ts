import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';
import { WebSocket } from 'ws';

export async function GET(
  request: Request,
  { params }: { params: { namespace: string; podName: string } }
) {
  if (!process.env.KUBERNETES_SERVICE_HOST) {
    return new NextResponse(null, {
      status: 426,
      statusText: 'Upgrade Required',
      headers: {
        'Upgrade': 'websocket',
      },
    });
  }

  const k8sClient = KubernetesClient.getInstance();
  const { namespace, podName } = params;

  try {
    const exec = await k8sClient.execPodCommand(namespace, podName, {
      command: ['/bin/sh'],
      stdin: true,
      stdout: true,
      stderr: true,
      tty: true,
    });

    // Create WebSocket server for the client connection
    const ws = new WebSocket.Server({ noServer: true });

    ws.on('connection', (socket) => {
      // Handle WebSocket connection
      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'resize') {
            exec.resize(message.cols, message.rows);
          } else {
            exec.stdin.write(data);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      socket.on('close', () => {
        try {
          exec.kill();
        } catch (error) {
          console.error('Error killing exec session:', error);
        }
      });

      // Handle exec streams
      exec.stdout.on('data', (data) => {
        socket.send(data);
      });

      exec.stderr.on('data', (data) => {
        socket.send(data);
      });

      exec.on('error', (error) => {
        console.error('Exec error:', error);
        socket.send(`Error: ${error.message}`);
        socket.close();
      });

      exec.on('end', () => {
        socket.close();
      });
    });

    // Return response to upgrade the connection
    return new NextResponse(null, {
      status: 101,
      statusText: 'Switching Protocols',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    });
  } catch (error) {
    console.error('Error setting up pod exec:', error);
    return NextResponse.json(
      { error: 'Failed to create exec session' },
      { status: 500 }
    );
  }
} 