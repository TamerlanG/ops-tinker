import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class KubernetesClient {
  private static instance: KubernetesClient;
  private kc: k8s.KubeConfig;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;
  private configPath: string | null = null;

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
        this.configPath = kubeconfigPath;
      } catch (error) {
        console.error('Failed to load Kubernetes configuration:', error);
        throw new Error('Could not load Kubernetes configuration');
      }
    }
  }

  public getConfigInfo() {
    const currentContext = this.kc.getCurrentContext();
    const contextObject = this.kc.getContextObject(currentContext);
    return {
      currentContext,
      configPath: this.configPath,
      contexts: this.kc.getContexts().map(ctx => ctx.name),
      currentNamespace: contextObject?.namespace || 'default'
    };
  }

  public getCurrentNamespace(): string {
    const currentContext = this.kc.getCurrentContext();
    const contextObject = this.kc.getContextObject(currentContext);
    return contextObject?.namespace || 'default';
  }

  public static getInstance(): KubernetesClient {
    if (!KubernetesClient.instance) {
      KubernetesClient.instance = new KubernetesClient();
    }
    return KubernetesClient.instance;
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

  public async getPods(namespace: string = 'default') {
    try {
      const response = await this.coreV1Api.listNamespacedPod({ namespace});
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
      return response.items.map(secret => ({
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

  public async getResourceMetrics(namespace: string = 'default') {
    try {
      const metricsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
      const { body } = await metricsApi.listNamespacedCustomObject(
        'metrics.k8s.io',
        'v1beta1',
        namespace,
        'pods'
      );
      return body;
    } catch (error: any) {
      console.error('Error fetching metrics:', error?.body || error);
      throw new Error(
        error?.body?.message || 
        error?.message || 
        'Failed to fetch metrics. Make sure metrics-server is installed.'
      );
    }
  }
} 