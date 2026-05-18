import type { Resource, ResourceLoader } from '@game-engine/core';

const imageCache = new Map<string, HTMLImageElement>();

export class ImageResourceLoader implements ResourceLoader {
  async load(url: string): Promise<Resource> {
    const cached = imageCache.get(url);
    if (cached) {
      return { url, loaded: true, data: cached };
    }

    return new Promise<Resource>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, img);
        resolve({ url, loaded: true, data: img });
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  unload(url: string): void {
    imageCache.delete(url);
  }
}
