export class LayoutManager {
  constructor({ root = document.documentElement } = {}) {
    this.root = root;
    this.resizeTimer = null;
    this.lastStableHeight = 0;
    this.lastStableWidth = 0;
    this.boundUpdate = () => this.scheduleUpdate();
    this.boundForceUpdate = () => this.updateAppHeight({ force: true });
  }

  bind() {
    this.updateAppHeight({ force: true });

    window.addEventListener("resize", this.boundUpdate, { passive: true });
    window.addEventListener("orientationchange", this.boundForceUpdate, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.boundUpdate, { passive: true });
      window.visualViewport.addEventListener("scroll", this.boundUpdate, { passive: true });
    }

    setTimeout(() => this.updateAppHeight({ force: true }), 80);
    setTimeout(() => this.updateAppHeight({ force: true }), 240);
    setTimeout(() => this.updateAppHeight({ force: true }), 600);
  }

  scheduleUpdate() {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.updateAppHeight();
    this.resizeTimer = setTimeout(() => {
      this.updateAppHeight({ settle: true });
      this.resizeTimer = null;
    }, 180);
  }

  shouldIgnoreViewportChange(nextWidth, nextHeight, { force = false, settle = false } = {}) {
    if (force || settle || !this.lastStableHeight) return false;

    const widthDelta = Math.abs(nextWidth - this.lastStableWidth);
    const heightDelta = Math.abs(nextHeight - this.lastStableHeight);

    // iOS Safari browser chrome and tap gestures can cause small visualViewport changes.
    // Ignoring small height-only changes prevents dialogue/control layout jitter.
    return widthDelta <= 2 && heightDelta > 0 && heightDelta <= 72;
  }

  updateAppHeight(options = {}) {
    const viewport = window.visualViewport;
    const viewportHeight = viewport?.height || window.innerHeight;
    const viewportWidth = viewport?.width || window.innerWidth;
    const nextHeight = Math.round(viewportHeight);
    const nextWidth = Math.round(viewportWidth);

    if (this.shouldIgnoreViewportChange(nextWidth, nextHeight, options)) {
      return;
    }

    this.lastStableHeight = nextHeight;
    this.lastStableWidth = nextWidth;

    this.root.style.setProperty("--app-height", `${nextHeight}px`);
    this.root.style.setProperty("--viewport-width", `${nextWidth}px`);
    this.root.style.setProperty("--control-zone-height", "132px");
    this.root.style.setProperty("--dialog-gap", "12px");
    this.root.style.setProperty("--dialog-bottom", "calc(var(--control-zone-height) + var(--dialog-gap) + env(safe-area-inset-bottom, 0px))");
    this.root.style.setProperty("--dialog-choice-bottom", "calc(var(--control-zone-height) + 38px + env(safe-area-inset-bottom, 0px))");
    this.root.style.setProperty("--dialog-font-size", "15px");
    this.root.style.setProperty("--menu-font-size", "14px");
    this.root.style.setProperty("--control-button-size", "82px");
  }
}
