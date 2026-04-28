export class AssetLoader {
  constructor({
    version = "2.0",
    forceFreshOnBoot = true,
    bootCacheToken = null,
  } = {}) {
    this.version = version;
    this.forceFreshOnBoot = forceFreshOnBoot;
    this.bootCacheToken = bootCacheToken || this.createBootCacheToken();
    this.cache = new Map();
    this.imageCache = new Map();
  }

  createBootCacheToken() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  cacheBust(path) {
    const params = [`v=${encodeURIComponent(this.version)}`];

    if (this.forceFreshOnBoot) {
      params.push(`boot=${encodeURIComponent(this.bootCacheToken)}`);
    }

    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}${params.join("&")}`;
  }

  clearRuntimeCache() {
    this.cache.clear();
    this.imageCache.clear();
    this.bootCacheToken = this.createBootCacheToken();
  }

  getCacheDebugInfo() {
    return {
      version: this.version,
      forceFreshOnBoot: this.forceFreshOnBoot,
      bootCacheToken: this.bootCacheToken,
      requestCacheEntries: this.cache.size,
      imageCacheEntries: this.imageCache.size,
    };
  }

  async loadJSON(path) {
    const response = await fetch(this.cacheBust(path), {
      cache: this.forceFreshOnBoot ? "reload" : "default",
    });

    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${path}`);
    }

    return response.json();
  }

  async loadImage(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(path, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = this.cacheBust(path);
    });

    this.cache.set(path, promise);
    return promise;
  }

  async loadImageList(paths) {
    return Promise.all(paths.map((path) => this.loadImage(path)));
  }

  getImage(path) {
    return this.imageCache.get(path) || null;
  }

  hasImage(path) {
    return this.imageCache.has(path);
  }
}
