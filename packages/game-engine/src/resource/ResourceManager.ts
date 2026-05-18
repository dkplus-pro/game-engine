import type { Resource, ResourceLoader } from './ResourceLoader';

export class ResourceManager {
  private cache = new Map<string, Resource>();
  private loaders = new Map<string, ResourceLoader>();

  registerLoader(type: string, loader: ResourceLoader): void {
    this.loaders.set(type, loader);
  }

  async load<T>(url: string, type?: string): Promise<T> {
    const cached = this.cache.get(url);
    if (cached && cached.loaded) return cached.data as T;

    if (cached) {
      return new Promise<T>((resolve) => {
        const check = () => {
          const r = this.cache.get(url);
          if (r && r.loaded) resolve(r.data as T);
        };
        const interval = setInterval(() => {
          const r = this.cache.get(url);
          if (r && r.loaded) {
            clearInterval(interval);
            resolve(r.data as T);
          }
        }, 10);
      });
    }

    const loader = this.determineLoader(url, type);
    if (!loader) throw new Error(`No loader registered for resource: ${url}`);

    const resource: Resource = { url, loaded: false, data: null };
    this.cache.set(url, resource);

    const loaded = await loader.load(url);
    resource.data = loaded.data;
    resource.loaded = true;

    return resource.data as T;
  }

  unload(url: string): void {
    const resource = this.cache.get(url);
    if (!resource) return;

    const loader = this.determineLoader(url);
    if (loader) loader.unload(url);

    this.cache.delete(url);
  }

  get<T>(url: string): T | undefined {
    const resource = this.cache.get(url);
    if (!resource || !resource.loaded) return undefined;
    return resource.data as T;
  }

  clear(): void {
    for (const [url] of this.cache) {
      const loader = this.determineLoader(url);
      if (loader) loader.unload(url);
    }
    this.cache.clear();
  }

  private determineLoader(url: string, type?: string): ResourceLoader | undefined {
    if (type) return this.loaders.get(type);

    const ext = url.split('.').pop()?.toLowerCase() ?? '';
    const typeMap: Record<string, string> = {
      png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image',
      mp3: 'audio', wav: 'audio', ogg: 'audio',
      json: 'json',
    };
    const inferred = typeMap[ext];
    return inferred ? this.loaders.get(inferred) : undefined;
  }
}
