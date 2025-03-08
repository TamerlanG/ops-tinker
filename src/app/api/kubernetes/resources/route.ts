import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const k8sClient = KubernetesClient.getInstance();
  const namespace = searchParams.get('namespace') || k8sClient.getCurrentNamespace();

  try {
    const [
      pods,
      deployments,
      configMaps,
      secrets,
      events,
    ] = await Promise.all([
      k8sClient.getPods(namespace),
      k8sClient.getDeployments(namespace),
      k8sClient.getConfigMaps(namespace),
      k8sClient.getSecrets(namespace),
      k8sClient.getEvents(namespace),
    ]);

    // Try to get metrics if available
    let metrics = null;
    try {
      metrics = await k8sClient.getResourceMetrics(namespace);
    } catch (error) {
      console.warn('Metrics not available:', error);
    }

    return NextResponse.json({
      pods: pods.map(pod => ({
        name: pod.metadata?.name,
        namespace: pod.metadata?.namespace,
        status: pod.status?.phase,
        node: pod.spec?.nodeName,
        ip: pod.status?.podIP,
        restarts: pod.status?.containerStatuses?.[0]?.restartCount || 0,
        age: pod.metadata?.creationTimestamp,
      })),
      deployments: deployments.map(deployment => ({
        name: deployment.metadata?.name,
        namespace: deployment.metadata?.namespace,
        replicas: `${deployment.status?.availableReplicas || 0}/${deployment.spec?.replicas || 0}`,
        status: deployment.status?.availableReplicas === deployment.spec?.replicas ? 'Healthy' : 'Unhealthy',
        strategy: deployment.spec?.strategy?.type,
        age: deployment.metadata?.creationTimestamp,
      })),
      configMaps: configMaps.map(cm => ({
        name: cm.metadata?.name,
        namespace: cm.metadata?.namespace,
        dataKeys: Object.keys(cm.data || {}),
        age: cm.metadata?.creationTimestamp,
      })),
      secrets: secrets.map(secret => ({
        name: secret.metadata?.name,
        namespace: secret.metadata?.namespace,
        type: secret.type,
        dataKeys: Object.keys(secret.data || {}),
        age: secret.metadata?.creationTimestamp,
      })),
      events: events
        .sort((a, b) => 
          (new Date(b.lastTimestamp || b.metadata?.creationTimestamp || 0).getTime()) - 
          (new Date(a.lastTimestamp || a.metadata?.creationTimestamp || 0).getTime())
        )
        .slice(0, 50)
        .map(event => ({
          name: event.metadata?.name,
          namespace: event.metadata?.namespace,
          type: event.type,
          reason: event.reason,
          message: event.message,
          involvedObject: {
            kind: event.involvedObject?.kind,
            name: event.involvedObject?.name,
          },
          count: event.count,
          lastTimestamp: event.lastTimestamp || event.metadata?.creationTimestamp,
        })),
      metrics: metrics ? {
        pods: metrics.items.map((podMetric: any) => ({
          name: podMetric.metadata?.name,
          namespace: podMetric.metadata?.namespace,
          usage: podMetric.containers?.reduce((acc: any, container: any) => {
            acc.cpu += parseInt(container.usage?.cpu || '0');
            acc.memory += parseInt(container.usage?.memory?.replace(/[^0-9]/g, '') || '0');
            return acc;
          }, { cpu: 0, memory: 0 }),
        })),
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch resources',
        details: error.message,
        timestamp: new Date().toISOString(),
        namespace,
      },
      { status: 500 }
    );
  }
} 