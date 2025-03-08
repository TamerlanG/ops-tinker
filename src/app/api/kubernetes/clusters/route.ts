import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';
import { V1Node, V1NodeCondition } from '@kubernetes/client-node';

export async function GET() {
  try {
    const k8sClient = KubernetesClient.getInstance();
    
    // Get cluster information
    const nodes = await k8sClient.getNodes();
    
    // Get config info for debugging
    const configInfo = k8sClient.getConfigInfo();
    
    // Transform the data for our UI
    const clusterInfo = nodes.map((node: V1Node) => {
      const conditions = node.status?.conditions || [];
      const ready = conditions.find((c: V1NodeCondition) => c.type === 'Ready');
      const status = ready?.status === 'True' ? 'Healthy' : 'Warning';

      // Calculate resource usage (in a real scenario, you'd want to use metrics-server)
      const cpuCapacity = parseInt(node.status?.capacity?.cpu || '0');
      const memoryCapacity = parseInt(node.status?.capacity?.memory?.replace(/[^0-9]/g, '') || '0');
      
      // For demo purposes, generate random usage between 0-100%
      const cpuUsage = Math.floor(Math.random() * 100);
      const memoryUsage = Math.floor(Math.random() * 100);

      return {
        name: node.metadata?.name || 'unknown',
        status,
        cpu: cpuUsage,
        memory: memoryUsage,
        conditions: conditions.map((c: V1NodeCondition) => ({
          type: c.type,
          status: c.status,
          message: c.message,
        })),
        info: {
          kubeletVersion: node.status?.nodeInfo?.kubeletVersion,
          osImage: node.status?.nodeInfo?.osImage,
          containerRuntime: node.status?.nodeInfo?.containerRuntimeVersion,
        },
      };
    });

    return NextResponse.json({ 
      clusters: clusterInfo,
      config: configInfo,
    });
  } catch (error: any) {
    console.error('Error fetching cluster information:', error);
    
    let statusCode = 500;
    let message = 'Failed to fetch cluster information';
    let details = error.message;

    // Check for specific error types
    if (error.message?.includes('Could not load Kubernetes configuration')) {
      statusCode = 400;
      message = 'Kubernetes configuration not found';
      details = 'Please ensure you have a valid kubeconfig file. Common locations are:\n' +
                '- $KUBECONFIG environment variable\n' +
                '- ~/.kube/config\n' +
                '- /etc/kubernetes/admin.conf';
    } else if (error.message?.includes('Invalid kubeconfig')) {
      statusCode = 400;
      message = 'Invalid Kubernetes configuration';
      details = 'Your kubeconfig file appears to be invalid. Please check its contents.';
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('connection refused')) {
      statusCode = 503;
      message = 'Cannot connect to Kubernetes cluster';
      details = 'The Kubernetes cluster is not accessible. Please ensure:\n' +
                '- The cluster is running\n' +
                '- You have network access to the cluster\n' +
                '- The API server endpoint is correct';
    }

    return NextResponse.json(
      { 
        error: message,
        details: details,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
} 