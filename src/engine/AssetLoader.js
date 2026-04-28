export class AssetLoader {
  constructor({ version = "2.0" } = {}) {
    this.version = version;
    this.cache = new Map();
    this.imageCache = new Map();
  }

  cacheBust(path) {
    return `${path}?v=${this.version}`;
  }

  async loadJSON(path) {
    const response = await fetch(this.cacheBust(path));
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
