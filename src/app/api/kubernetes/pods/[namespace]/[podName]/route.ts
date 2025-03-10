import { NextRequest } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { namespace: string; podName: string } }
) {
  const k8sClient = KubernetesClient.getInstance();
  const routeParams = await params;
  const { namespace, podName } = routeParams;

  try {
    const pod = await k8sClient.getPodDetails(podName, namespace);
    return Response.json(pod);
  } catch (error: any) {
    console.error('Error fetching pod details:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch pod details',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 