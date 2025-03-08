import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';
import { V1Service, V1Pod } from '@kubernetes/client-node';

export async function GET(request: Request) {
  // Get namespace parameter early so it's available throughout the function scope
  const { searchParams } = new URL(request.url);
  const k8sClient = KubernetesClient.getInstance();
  const namespace = searchParams.get('namespace') || k8sClient.getCurrentNamespace();

  try {
    // Get config info for debugging
    const configInfo = k8sClient.getConfigInfo();

    // Get services and pods
    const [services, pods] = await Promise.all([
      k8sClient.getServices(namespace),
      k8sClient.getPods(namespace),
    ]);
    
    // Transform the data for our UI
    const servicesInfo = services.map((service: V1Service) => {
      const servicePods = pods.filter((pod: V1Pod) => {
        const serviceSelector = service.spec?.selector || {};
        const podLabels = pod.metadata?.labels || {};
        return Object.entries(serviceSelector).every(
          ([key, value]) => podLabels[key] === value
        );
      });

      // Calculate service status based on pod statuses
      const status = getServiceStatus(servicePods);
      
      // For demo purposes, generate random resource usage
      const cpuUsage = Math.floor(Math.random() * 100);
      const memoryUsage = Math.floor(Math.random() * 100);

      return {
        name: service.metadata?.name || 'unknown',
        namespace: service.metadata?.namespace,
        type: service.spec?.type,
        clusterIP: service.spec?.clusterIP,
        ports: service.spec?.ports?.map(port => ({
          port: port.port,
          targetPort: port.targetPort,
          protocol: port.protocol,
        })),
        status,
        pods: {
          total: servicePods.length,
          running: servicePods.filter((pod: V1Pod) => pod.status?.phase === 'Running').length,
        },
        cpu: cpuUsage,
        memory: memoryUsage,
      };
    });

    // If no services found, return a 404 with a friendly message
    if (servicesInfo.length === 0) {
      return NextResponse.json(
        {
          error: 'No services found',
          details: `No services found in namespace "${namespace}". This could mean:\n` +
                  '- The namespace exists but has no services\n' +
                  '- You might not have permission to view services in this namespace\n' +
                  '- The namespace might be newly created',
          timestamp: new Date().toISOString(),
          namespace,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      services: servicesInfo,
      config: configInfo,
      namespace,
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    
    let statusCode = 500;
    let message = 'Failed to fetch services';
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
    } else if (error.statusCode === 404 || error.message?.includes('not found')) {
      statusCode = 404;
      message = 'Namespace not found';
      details = `The namespace "${namespace}" does not exist in the cluster.\n` +
                'Please check:\n' +
                '- The namespace name is spelled correctly\n' +
                '- The namespace exists in your cluster\n' +
                '- You have permission to access this namespace';
    } else if (error.statusCode === 403 || error.message?.includes('forbidden')) {
      statusCode = 403;
      message = 'Access denied';
      details = `You don't have permission to view services in namespace "${namespace}".\n` +
                'Please check:\n' +
                '- You are using the correct kubeconfig context\n' +
                '- Your user/service account has the necessary RBAC permissions';
    }

    return NextResponse.json(
      { 
        error: message,
        details: details,
        timestamp: new Date().toISOString(),
        namespace,
      },
      { status: statusCode }
    );
  }
}

function getServiceStatus(pods: V1Pod[]): string {
  if (pods.length === 0) return 'No Pods';
  
  const allRunning = pods.every(pod => pod.status?.phase === 'Running');
  if (allRunning) return 'Running';
  
  const anyRunning = pods.some(pod => pod.status?.phase === 'Running');
  if (anyRunning) return 'Partially Running';
  
  return 'Not Running';
} 