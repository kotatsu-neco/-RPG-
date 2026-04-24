export class LayoutManager {
  constructor({ root = document.documentElement } = {}) {
    this.root = root;
    this.resizeTimer = null;
    this.boundUpdate = () => this.scheduleUpdate();
  }

  bind() {
    this.updateAppHeight();

    window.addEventListener("resize", this.boundUpdate, { passive: true });
    window.addEventListener("orientationchange", this.boundUpdate, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.boundUpdate, { passive: true });
      window.visualViewport.addEventListener("scroll", this.boundUpdate, { passive: true });
    }

    setTimeout(() => this.updateAppHeight(), 80);
    setTimeout(() => this.updateAppHeight(), 240);
    setTimeout(() => this.updateAppHeight(), 600);
  }

  scheduleUpdate() {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.updateAppHeight();
    this.resizeTimer = setTimeout(() => {
      this.updateAppHeight();
      this.resizeTimer = null;
    }, 180);
  }

  updateAppHeight() {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    this.root.style.setProperty("--app-height", `${Math.round(viewportHeight)}px`);
  }
}
