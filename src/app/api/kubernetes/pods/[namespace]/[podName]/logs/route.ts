import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';

export async function GET(
  request: Request,
  { params }: { params: { namespace: string; podName: string } }
) {
  const k8sClient = KubernetesClient.getInstance();
  const { namespace, podName } = await params;

  // Create a new TransformStream for server-sent events
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start streaming logs
  try {
    const { logStream, req } = await k8sClient.getPodLogs(namespace, podName, {
      follow: true,
      tailLines: 100,
      timestamps: true,
    });

    // Handle log stream
    logStream.on('data', async (chunk: Buffer) => {
      try {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          await writer.write(
            `data: ${JSON.stringify(line)}\n\n`
          );
        }
      } catch (error) {
        console.error('Error processing log chunk:', error);
      }
    });

    logStream.on('error', async (error: Error) => {
      console.error('Log stream error:', error);
      await writer.write(`data: ${JSON.stringify({ error: 'Log stream error' })}\n\n`);
      await writer.close();
      req.abort(); // Abort the request when there's an error
    });

    logStream.on('end', async () => {
      console.log('Log stream ended');
      await writer.close();
      req.abort(); // Clean up the request when the stream ends
    });

    // Handle client disconnect
    request.signal.addEventListener('abort', () => {
      req.abort();
    });

    // Return the response with the appropriate headers
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error setting up log stream:', error);
    return NextResponse.json(
      { error: 'Failed to stream logs' },
      { status: 500 }
    );
  }
} 