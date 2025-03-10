import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';

export async function GET(
  request: Request,
  { params }: { params: { namespace: string; podName: string } }
) {
  const k8sClient = KubernetesClient.getInstance();
  const { namespace, podName } = await params;

  try {
    const events = await k8sClient.getEvents(namespace);
    
    // Filter events related to this pod
    const podEvents = events.filter(event => 
      event.involvedObject?.kind === 'Pod' && 
      event.involvedObject?.name === podName
    );

    // Sort events by timestamp (most recent first)
    podEvents.sort((a, b) => {
      const timeA = new Date(a.lastTimestamp || a.metadata?.creationTimestamp || 0).getTime();
      const timeB = new Date(b.lastTimestamp || b.metadata?.creationTimestamp || 0).getTime();
      return timeB - timeA;
    });

    // Transform events for the frontend
    const transformedEvents = podEvents.map(event => ({
      type: event.type,
      reason: event.reason,
      message: event.message,
      count: event.count,
      lastTimestamp: event.lastTimestamp || event.metadata?.creationTimestamp,
      involvedObject: {
        kind: event.involvedObject?.kind,
        name: event.involvedObject?.name,
      },
    }));

    return NextResponse.json({ events: transformedEvents });
  } catch (error) {
    console.error('Error fetching pod events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pod events' },
      { status: 500 }
    );
  }
} 