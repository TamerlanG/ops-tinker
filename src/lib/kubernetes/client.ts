import * as k8s from '@kubernetes/client-node';

export class KubernetesClient {
  private static instance: KubernetesClient;
  private kc: k8s.KubeConfig;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;

  private constructor() {
    this.kc = new k8s.KubeConfig();
    this.loadConfig();
    
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
  }

  private loadConfig() {
    try {
      // Try loading from default locations
      this.kc.loadFromDefault();
    } catch (error) {
      console.warn('Failed to load config from default location, trying KUBECONFIG');
      try {
        // Try loading from KUBECONFIG environment variable
        const kubeconfigPath = process.env.KUBECONFIG || `${process.env.HOME}/.kube/config`;
        this.kc.loadFromFile(kubeconfigPath);
      } catch (error) {
        console.error('Failed to load Kubernetes configuration:', error);
        throw new Error('Could not load Kubernetes configuration');
      }
    }
  }

  public static getInstance(): KubernetesClient {
    if (!KubernetesClient.instance) {
      KubernetesClient.instance = new KubernetesClient();
    }
    return KubernetesClient.instance;
  }

  public async getNodes() {
    try {
      const { body } = await this.coreV1Api.listNode();
      return body.items;
    } catch (error) {
      console.error('Error fetching nodes:', error);
      throw error;
    }
  }

  public async getPods(namespace: string = 'default') {
    try {
      const { body } = await this.coreV1Api.listNamespacedPod(namespace);
      return body.items;
    } catch (error) {
      console.error('Error fetching pods:', error);
      throw error;
    }
  }

  public async getDeployments(namespace: string = 'default') {
    try {
      const { body } = await this.appsV1Api.listNamespacedDeployment(namespace);
      return body.items;
    } catch (error) {
      console.error('Error fetching deployments:', error);
      throw error;
    }
  }

  public async getServices(namespace: string = 'default') {
    try {
      const { body } = await this.coreV1Api.listNamespacedService(namespace);
      return body.items;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  public async getNamespaces() {
    try {
      const { body } = await this.coreV1Api.listNamespace();
      return body.items;
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      throw error;
    }
  }
} 