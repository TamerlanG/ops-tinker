import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';

export async function GET() {
  try {
    const k8sClient = KubernetesClient.getInstance();
    const namespaces = await k8sClient.getNamespaces();
    
    return NextResponse.json({ 
      namespaces,
      currentNamespace: k8sClient.getCurrentNamespace(),
    });
  } catch (error: any) {
    console.error('Error fetching namespaces:', error);
    
    let statusCode = 500;
    let message = 'Failed to fetch namespaces';
    let details = error.message;

    if (error.message?.includes('Could not load Kubernetes configuration')) {
      statusCode = 400;
      message = 'Kubernetes configuration not found';
      details = 'Please ensure you have a valid kubeconfig file';
    } else if (error.message?.includes('Invalid kubeconfig')) {
      statusCode = 400;
      message = 'Invalid Kubernetes configuration';
      details = 'Your kubeconfig file appears to be invalid';
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('connection refused')) {
      statusCode = 503;
      message = 'Cannot connect to Kubernetes cluster';
      details = 'The Kubernetes cluster is not accessible';
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