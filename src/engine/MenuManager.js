export class MenuManager {
  constructor({ uiManager, gameData, flagManager, onReadKeyItem, getState }) {
    this.ui = uiManager;
    this.gameData = gameData;
    this.flagManager = flagManager;
    this.onReadKeyItem = onReadKeyItem;
    this.getState = getState;
    this.isOpen = false;
    this.currentTab = "items";

    this.menuButton = document.getElementById("menu-button");
    this.menuLayer = document.getElementById("menu-layer");
    this.closeButton = document.getElementById("menu-close-button");
    this.content = document.getElementById("menu-content");
    this.tabs = Array.from(document.querySelectorAll(".menu-tab"));
  }

  bind() {
    this.menuButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.open();
    });

    this.closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.close();
    });

    this.tabs.forEach((tab) => {
      tab.addEventListener("click", (event) => {
        event.preventDefault();
        this.selectTab(tab.dataset.menuTab);
      });
    });

    this.render();
  }

  open() {
    this.isOpen = true;
    this.menuLayer.classList.remove("hidden");
    document.body.classList.add("menu-open");
    this.render();
  }

  close() {
    this.isOpen = false;
    this.menuLayer.classList.add("hidden");
    document.body.classList.remove("menu-open");
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  selectTab(tabId) {
    this.currentTab = tabId;
    this.tabs.forEach((tab) => {
      tab.classList.toggle("selected", tab.dataset.menuTab === tabId);
    });
    this.render();
  }

  render() {
    if (!this.content) return;

    const renderers = {
      items: () => this.renderItems(),
      keyItems: () => this.renderKeyItems(),
      equipment: () => this.renderEquipment(),
      status: () => this.renderStatus(),
      save: () => this.renderSave(),
      settings: () => this.renderSettings(),
    };

    this.content.innerHTML = renderers[this.currentTab]?.() || "";
    this.bindDynamicContentEvents();
  }

  renderItems() {
    const inventory = this.gameData.player?.inventory || [];
    if (!inventory.length) {
      return `
        <h2 class="menu-panel-title">アイテム</h2>
        <p class="menu-muted">まだアイテムを持っていない。</p>
      `;
    }

    const itemRows = inventory.map((entry) => {
      const item = this.gameData.items?.[entry.itemId] || { name: entry.itemId, description: "" };
      return `
        <li class="menu-list-item">
          <strong>${item.name}</strong> × ${entry.count}
          <br><span class="menu-muted">${item.description || ""}</span>
        </li>
      `;
    }).join("");

    return `
      <h2 class="menu-panel-title">アイテム</h2>
      <ul class="menu-list">${itemRows}</ul>
    `;
  }

  renderEquipment() {
    const equipment = this.gameData.player?.equipment || {};
    const slots = this.gameData.equipmentSlots || [];

    const rows = slots.map((slot) => {
      const itemId = equipment[slot.id];
      const item = itemId ? this.gameData.items?.[itemId] : null;
      return `
        <li class="menu-list-item">
          <strong>${slot.label}</strong>：${item ? item.name : "なし"}
        </li>
      `;
    }).join("");

    return `
      <h2 class="menu-panel-title">装備</h2>
      <ul class="menu-list">${rows}</ul>
      <p class="menu-muted">装備変更は次段階で実装予定。</p>
    `;
  }

  renderStatus() {
    const status = this.gameData.player?.status || {};
    const name = this.gameData.player?.name || "主人公";

    const rows = Object.entries(status).map(([key, value]) => {
      return `<span>${this.statusLabel(key)}</span><strong>${value}</strong>`;
    }).join("");

    return `
      <h2 class="menu-panel-title">${name}</h2>
      <div class="menu-status-grid">${rows}</div>
    `;
  }

  renderSave() {
    const state = this.getState();
    const sceneName = state?.sceneName || "不明";

    return `
      <h2 class="menu-panel-title">記録</h2>
      <p>現在地：${sceneName}</p>
      <p class="menu-muted">セーブ / ロードは次段階で実装予定。</p>
      <ul class="menu-list">
        <li class="menu-list-item">記録する：未実装</li>
        <li class="menu-list-item">記録を読む：未実装</li>
      </ul>
    `;
  }

  renderSettings() {
    return `
      <h2 class="menu-panel-title">設定</h2>
      <ul class="menu-list">
        <li class="menu-list-item">音量：未実装</li>
        <li class="menu-list-item">文字速度：未実装</li>
        <li class="menu-list-item">操作設定：未実装</li>
      </ul>
    `;
  }

  statusLabel(key) {
    return {
      hp: "体力",
      strength: "力",
      defense: "守り",
      speed: "速さ",
      sense: "感覚",
    }[key] || key;
  }
}
