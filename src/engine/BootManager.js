export class BootManager {
  constructor({
    overlayId = "loading-overlay",
    titleSelector = ".loading-title",
    textSelector = ".loading-text",
    subtextSelector = ".loading-subtext",
    minimumVisibleMs = 700,
    debug = false,
  } = {}) {
    this.overlay = document.getElementById(overlayId);
    this.titleElement = this.overlay?.querySelector(titleSelector) ?? null;
    this.textElement = this.overlay?.querySelector(textSelector) ?? null;
    this.subtextElement = this.overlay?.querySelector(subtextSelector) ?? null;
    this.minimumVisibleMs = minimumVisibleMs;
    this.debug = debug;
    this.startedAt = 0;
    this.steps = [];
    this.error = null;
  }

  start(message = "ロード中…") {
    this.startedAt = Date.now();
    this.error = null;
    this.steps = [];

    this.setMessage(message);
    this.setSubtext("起動準備をしています。");
    this.overlay?.classList.remove("hidden", "error", "complete");
    this.overlay?.setAttribute("aria-busy", "true");

    this.logStep("boot:start", message);
  }

  setMessage(message) {
    if (this.textElement) {
      this.textElement.textContent = message;
    }
  }

  setSubtext(message) {
    if (this.subtextElement) {
      this.subtextElement.textContent = message;
    }
  }

  logStep(step, detail = "") {
    const record = {
      step,
      detail,
      at: Date.now(),
      elapsedMs: this.startedAt ? Date.now() - this.startedAt : 0,
    };
    this.steps.push(record);

    if (this.debug) {
      console.info("[BootManager]", step, detail);
    }

    window.dispatchEvent(new CustomEvent("matsuyoi:boot-step", { detail: record }));
  }

  async runStep(label, action) {
    this.setMessage(label);
    this.logStep("boot:step", label);

    try {
      return await action();
    } catch (error) {
      this.fail(error, label);
      throw error;
    }
  }

  async complete(message = "準備ができました。") {
    this.setMessage(message);
    this.setSubtext("まもなく開始します。");
    this.logStep("boot:complete", message);

    const elapsed = Date.now() - this.startedAt;
    const wait = Math.max(0, this.minimumVisibleMs - elapsed);

    await new Promise((resolve) => window.setTimeout(resolve, wait));

    this.overlay?.classList.add("hidden", "complete");
    this.overlay?.classList.remove("error");
    this.overlay?.setAttribute("aria-busy", "false");
  }

  fail(error, context = "起動処理") {
    const message = error?.message || String(error);
    this.error = {
      context,
      message,
      stack: error?.stack || "",
      steps: this.steps,
    };

    this.setMessage("読み込みに失敗しました。");
    this.setSubtext(`${context}: ${message}`);

    this.overlay?.classList.remove("hidden", "complete");
    this.overlay?.classList.add("error");
    this.overlay?.setAttribute("aria-busy", "false");

    this.logStep("boot:error", `${context}: ${message}`);
    console.error("[BootManager] Boot failed:", this.error);
  }

  getSummary() {
    return {
      startedAt: this.startedAt,
      steps: this.steps,
      error: this.error,
    };
  }
}
