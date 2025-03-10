import { NextResponse } from 'next/server';
import { KubernetesClient } from '@/lib/kubernetes/client';

interface PortForwardRequest {
  localPort: number;
  remotePort: number;
}

// Store active port forwards
const activePortForwards = new Map<string, any>();

export async function GET(
  request: Request,
  { params }: { params: { namespace: string; podName: string } }
) {
  const { namespace, podName } = params;
  const key = `${namespace}/${podName}`;
  
  // Get active port forwards for this pod
  const portForwards = Array.from(activePortForwards.entries())
    .filter(([k]) => k.startsWith(key))
    .map(([k, v]) => {
      const [, , localPort, remotePort] = k.split('/');
      return {
        localPort: parseInt(localPort),
        remotePort: parseInt(remotePort),
        status: v.active ? 'active' : 'stopped'
      };
    });

  return NextResponse.json({ portForwards });
}

export async function POST(
  request: Request,
  { params }: { params: { namespace: string; podName: string } }
) {
  const k8sClient = KubernetesClient.getInstance();
  const { namespace, podName } = params;

  try {
    const body: PortForwardRequest = await request.json();
    const { localPort, remotePort } = body;

    // Validate ports
    if (!localPort || !remotePort || localPort < 1 || localPort > 65535 || remotePort < 1 || remotePort > 65535) {
      return NextResponse.json(
        { error: 'Invalid port numbers' },
        { status: 400 }
      );
    }

    const key = `${namespace}/${podName}/${localPort}/${remotePort}`;

    // Check if port forward already exists
    if (activePortForwards.has(key)) {
      return NextResponse.json(
        { error: 'Port forward already exists' },
        { status: 409 }
      );
    }

    // Start port forwarding
    const portForward = await k8sClient.portForward(namespace, podName, localPort, remotePort);

    // Store the port forward
    activePortForwards.set(key, {
      portForward,
      active: true,
      localPort,
      remotePort
    });

    return NextResponse.json({
      message: 'Port forward started successfully',
      localPort,
      remotePort
    });
  } catch (error) {
    console.error('Error setting up port forward:', error);
    return NextResponse.json(
      { error: 'Failed to set up port forward' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { namespace: string; podName: string } }
) {
  const { namespace, podName } = params;

  try {
    const body: PortForwardRequest = await request.json();
    const { localPort, remotePort } = body;

    const key = `${namespace}/${podName}/${localPort}/${remotePort}`;
    const portForward = activePortForwards.get(key);

    if (!portForward) {
      return NextResponse.json(
        { error: 'Port forward not found' },
        { status: 404 }
      );
    }

    // Stop the port forward
    try {
      portForward.portForward.close();
    } catch (error) {
      console.error('Error closing port forward:', error);
    }

    // Remove from active port forwards
    activePortForwards.delete(key);

    return NextResponse.json({
      message: 'Port forward stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping port forward:', error);
    return NextResponse.json(
      { error: 'Failed to stop port forward' },
      { status: 500 }
    );
  }
} 