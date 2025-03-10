import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';

export async function GET(
  request: Request,
  context: { params: { namespace: string; podName: string } }
) {
  const k8sClient = KubernetesClient.getInstance();
  const { namespace, podName } = await Promise.resolve(context.params);

  try {
    const metrics = await k8sClient.getResourceMetrics(namespace);
    if (!metrics) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch pod metrics',
          details: 'Metrics server not available. Please install metrics-server in your cluster.',
        },
        { status: 503 }
      );
    }

    // Find metrics for the specific pod
    const podMetrics = (metrics as any).items?.find(
      (item: any) => item.metadata?.name === podName
    );

    if (!podMetrics) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch pod metrics',
          details: 'No metrics found for this pod. The pod might be too new or metrics collection might be delayed.',
        },
        { status: 404 }
      );
    }

    // Calculate total CPU and memory usage across all containers
    const usage = podMetrics.containers?.reduce(
      (acc: any, container: any) => {
        // CPU usage comes in format like '100m' (100 millicores)
        const cpuRaw = container.usage?.cpu || '0';
        const cpuMillicores = parseInt(cpuRaw.replace(/[^0-9]/g, ''));
        const cpuPercentage = (cpuMillicores / 1000) * 100;

        // Memory usage comes in format like '100Mi' or '1Gi'
        const memoryRaw = container.usage?.memory || '0';
        const memoryBytes = parseInt(memoryRaw.replace(/[^0-9]/g, ''));
        const memoryMi = memoryBytes / (1024 * 1024); // Convert to MiB
        const memoryPercentage = (memoryMi / 1024) * 100; // Assuming 1Gi limit for now

        return {
          cpu: acc.cpu + cpuPercentage,
          memory: acc.memory + memoryPercentage,
        };
      },
      { cpu: 0, memory: 0 }
    );

    return NextResponse.json({
      cpu: usage.cpu,
      memory: usage.memory,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching pod metrics:', error);
    
    // Check if the error is due to metrics-server not being available
    if (error.statusCode === 404 || error.message?.includes('404')) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch pod metrics',
          details: 'Metrics API not available. Please ensure metrics-server is installed and running in your cluster.',
          docs: 'https://github.com/kubernetes-sigs/metrics-server#installation',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch pod metrics',
        details: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
} 