export class BrowserGestureGuard {
  constructor({
    root = document,
    preventContextMenu = true,
    preventSelection = true,
    preventDoubleTapZoom = true,
    preventPinchZoom = true,
    lockScrollOrigin = true,
    doubleTapThresholdMs = 420,
    debug = false,
  } = {}) {
    this.root = root;
    this.preventContextMenu = preventContextMenu;
    this.preventSelection = preventSelection;
    this.preventDoubleTapZoom = preventDoubleTapZoom;
    this.preventPinchZoom = preventPinchZoom;
    this.lockScrollOrigin = lockScrollOrigin;
    this.doubleTapThresholdMs = doubleTapThresholdMs;
    this.debug = debug;
    this.lastTouchEndAt = 0;
    this.bound = false;
    this.unbinders = [];
  }

  bind() {
    if (this.bound) return;
    this.bound = true;

    const prevent = (event) => {
      event.preventDefault();
    };

    const preventMultiTouch = (event) => {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault();
      }
    };

    if (this.preventPinchZoom) {
      this.add(window, "gesturestart", prevent, { passive: false, capture: true });
      this.add(window, "gesturechange", prevent, { passive: false, capture: true });
      this.add(window, "gestureend", prevent, { passive: false, capture: true });
      this.add(this.root, "touchstart", preventMultiTouch, { passive: false, capture: true });
      this.add(this.root, "touchmove", preventMultiTouch, { passive: false, capture: true });
    }

    if (this.preventDoubleTapZoom) {
      this.add(this.root, "touchend", (event) => {
        const now = Date.now();
        if (now - this.lastTouchEndAt <= this.doubleTapThresholdMs) {
          event.preventDefault();
        }
        this.lastTouchEndAt = now;
      }, { passive: false, capture: true });

      this.add(this.root, "dblclick", prevent, { passive: false, capture: true });
    }

    if (this.preventSelection) {
      this.add(this.root, "selectstart", prevent, { passive: false, capture: true });
      this.add(this.root, "dragstart", prevent, { passive: false, capture: true });
    }

    if (this.preventContextMenu) {
      this.add(this.root, "contextmenu", prevent, { passive: false, capture: true });
    }

    if (this.lockScrollOrigin) {
      this.add(window, "scroll", () => window.scrollTo(0, 0), { passive: true });
    }

    if (this.debug) {
      console.info("[BrowserGestureGuard] bound");
    }
  }

  add(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.unbinders.push(() => target.removeEventListener(type, handler, options));
  }

  unbind() {
    this.unbinders.forEach((unbind) => unbind());
    this.unbinders = [];
    this.bound = false;
  }
}
