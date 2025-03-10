import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Stream } from 'stream';

export class KubernetesClient {
  private static instance: KubernetesClient;
  private kc: k8s.KubeConfig;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;
  private metricsApi: k8s.CustomObjectsApi;
  private configPath: string | null = null;

  private constructor() {
    this.kc = new k8s.KubeConfig();
    this.loadConfig();
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    this.metricsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
  }

  private loadConfig() {
    try {
      this.kc.loadFromDefault();
      console.log('Loaded Kubernetes config from default location');
    } catch (error) {
      console.warn('Failed to load Kubernetes config from default location:', error);
      // Fallback to in-cluster config if available
      try {
        this.kc.loadFromCluster();
        console.log('Loaded Kubernetes config from in-cluster');
      } catch (clusterError) {
        console.warn('Failed to load Kubernetes config from in-cluster:', clusterError);
      }
    }
  }

  public static getInstance(): KubernetesClient {
    if (!KubernetesClient.instance) {
      KubernetesClient.instance = new KubernetesClient();
    }
    return KubernetesClient.instance;
  }

  public getConfigInfo() {
    return {
      currentContext: this.kc.getCurrentContext(),
      currentNamespace: this.getCurrentNamespace(),
      contexts: this.kc.getContexts().map(ctx => ctx.name),
    };
  }

  public getCurrentNamespace(): string {
    return this.kc.getContextObject(this.kc.getCurrentContext())?.namespace || 'default';
  }

  public async getNodes() {
    try {
      const response = await this.coreV1Api.listNode();
      return response.items;
    } catch (error: any) {
      console.error('Error fetching nodes:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch nodes. Make sure your cluster is accessible.'
      );
    }
  }

  public async getNamespaces() {
    try {
      const response = await this.coreV1Api.listNamespace();
      return response.items;
    } catch (error: any) {
      console.error('Error fetching namespaces:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch namespaces. Make sure your cluster is accessible.'
      );
    }
  }

  public async getServices(namespace: string = 'default') {
    try {
      const response = await this.coreV1Api.listNamespacedService({ namespace });
      return response.items;
    } catch (error: any) {
      console.error('Error fetching services:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch services. Make sure your cluster is accessible.'
      );
    }
  }

  public async getPods(namespace: string = 'default') {
    try {
      const response = await this.coreV1Api.listNamespacedPod({ namespace });
      return response.items;
    } catch (error: any) {
      console.error('Error fetching pods:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch pods. Make sure your cluster is accessible.'
      );
    }
  }

  public async getDeployments(namespace: string = 'default') {
    try {
      const response = await this.appsV1Api.listNamespacedDeployment({ namespace });
      return response.items;
    } catch (error: any) {
      console.error('Error fetching deployments:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch deployments. Make sure your cluster is accessible.'
      );
    }
  }

  public async getConfigMaps(namespace: string = 'default') {
    try {
      const response = await this.coreV1Api.listNamespacedConfigMap({ namespace });
      return response.items;
    } catch (error: any) {
      console.error('Error fetching config maps:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch config maps. Make sure your cluster is accessible.'
      );
    }
  }

  public async getSecrets(namespace: string = 'default') {
    try {
      const response = await this.coreV1Api.listNamespacedSecret({ namespace });
      return response.items.map((secret: k8s.V1Secret) => ({
        ...secret,
        data: Object.keys(secret.data || {}).reduce((acc, key) => {
          acc[key] = '[REDACTED]';
          return acc;
        }, {} as Record<string, string>)
      }));
    } catch (error: any) {
      console.error('Error fetching secrets:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch secrets. Make sure your cluster is accessible.'
      );
    }
  }

  public async getEvents(namespace: string = 'default') {
    try {
      const response = await this.coreV1Api.listNamespacedEvent({ namespace });
      return response.items;
    } catch (error: any) {
      console.error('Error fetching events:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch events. Make sure your cluster is accessible.'
      );
    }
  }

  public async getResourceMetrics(namespace: string = 'default') {
    try {
      const response = await this.metricsApi.listNamespacedCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        namespace,
        plural: 'pods'
      });
      return response;
    } catch (error: any) {
      console.error('Error fetching metrics:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch metrics. Make sure metrics-server is installed.'
      );
    }
  }

  public async getPodDetails(name: string, namespace: string = 'default') {
    try {
      const response = await this.coreV1Api.readNamespacedPod({name, namespace});
      return response;
    } catch (error: any) {
      console.error('Error fetching pod details:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch pod details. Make sure your cluster is accessible.'
      );
    }
  }

  public async getPodLogs(
    namespace: string,
    podName: string,
    options: {
      container?: string;
      follow?: boolean;
      tailLines?: number;
      timestamps?: boolean;
    } = {}
  ): Promise<any> {
    try {
      const log = new k8s.Log(this.kc);
      const logStream = new Stream.PassThrough();

      const req = await log.log(namespace, podName, options.container || '', logStream, {
        follow: options.follow || false,
        tailLines: options.tailLines || 50,
        pretty: false,
        timestamps: options.timestamps || false,
      });

      return { logStream, req };
    } catch (error: any) {
      console.error('Error fetching pod logs:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch pod logs. Make sure your cluster is accessible.'
      );
    }
  }

  public async execPodCommand(
    namespace: string,
    podName: string,
    options: {
      command: string[];
      container?: string;
      stdin?: boolean;
      stdout?: boolean;
      stderr?: boolean;
      tty?: boolean;
    }
  ): Promise<any> {
    try {
      const exec = new k8s.Exec(this.kc);
      const command = Array.isArray(options.command) ? options.command[0] : options.command;
      return await exec.exec(
        namespace,
        podName,
        command,
        options.container || '',
        options.stdin || false,
        options.stdout || true,
        options.stderr || true,
        options.tty || false
      );
    } catch (error: any) {
      console.error('Error executing command in pod:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to execute command in pod'
      );
    }
  }

  public async portForward(
    namespace: string,
    podName: string,
    localPort: number,
    remotePort: number
  ): Promise<any> {
    try {
      const portForward = new k8s.PortForward(this.kc);
      return await portForward.portForward(namespace, podName, [localPort], [remotePort], null, null);
    } catch (error: any) {
      console.error('Error setting up port forwarding:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to set up port forwarding'
      );
    }
  }

  public async deletePod(namespace: string, podName: string) {
    try {
      await this.coreV1Api.deleteNamespacedPod(podName, namespace, {});
    } catch (error: any) {
      console.error('Error deleting pod:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to delete pod'
      );
    }
  }

  public async restartPod(namespace: string, podName: string) {
    try {
      const timestamp = new Date().toISOString();
      const pod = await this.coreV1Api.readNamespacedPod(podName, namespace, {});
      
      // Add or update annotation to trigger restart
      const annotations = pod.metadata?.annotations || {};
      annotations['kubectl.kubernetes.io/restartedAt'] = timestamp;
      
      const patch = {
        metadata: {
          annotations: annotations
        }
      };

      await this.coreV1Api.patchNamespacedPod(podName, namespace, patch, undefined, {
        headers: {
          'Content-Type': 'application/strategic-merge-patch+json'
        }
      });
    } catch (error: any) {
      console.error('Error restarting pod:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to restart pod'
      );
    }
  }
} 