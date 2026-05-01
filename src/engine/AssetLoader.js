export class AssetLoader {
  constructor({
    version = "4.0-g.8",
    forceFreshOnBoot = true,
    bootCacheToken = null,
    requestTimeoutMs = 12000,
    imageTimeoutMs = 12000,
  } = {}) {
    this.version = version;
    this.forceFreshOnBoot = forceFreshOnBoot;
    this.bootCacheToken = bootCacheToken || this.createBootCacheToken();
    this.requestTimeoutMs = requestTimeoutMs;
    this.imageTimeoutMs = imageTimeoutMs;
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
      requestTimeoutMs: this.requestTimeoutMs,
      imageTimeoutMs: this.imageTimeoutMs,
    };
  }

  async loadJSON(path) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(this.cacheBust(path), {
        cache: this.forceFreshOnBoot ? "reload" : "default",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load JSON: ${path}`);
      }

      return response.json();
    } finally {
      window.clearTimeout(timer);
    }
  }

  async loadImage(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const promise = new Promise((resolve) => {
      const img = new Image();
      let settled = false;

      const finish = (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      };

      const timer = window.setTimeout(() => {
        console.warn("[AssetLoader] Image load timeout:", path);
        finish(null);
      }, this.imageTimeoutMs);

      img.onload = () => {
        this.imageCache.set(path, img);
        finish(img);
      };

      img.onerror = () => {
        console.warn("[AssetLoader] Image load failed:", path);
        finish(null);
      };

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
