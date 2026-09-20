(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const state = {
    sounds: [],
    activeCategory: "all",
    search: "",
    listSearch: "",
    volume: 0.85,
    activeAudio: new Map(),
    unavailableIds: new Set()
  };

  const elements = {
    board: $("#soundboard"),
    emptyBoard: $("#empty-board"),
    categoryFilters: $("#category-filters"),
    soundSearch: $("#sound-search"),
    listSearch: $("#list-search"),
    listBody: $("#sound-list-body"),
    volume: $("#master-volume"),
    volumeValue: $("#volume-value"),
    stopAll: $("#stop-all"),
    sidebar: $("#sidebar"),
    menuButton: $("#menu-button"),
    loadError: $("#load-error")
  };

  function normaliseShortcut(value) {
    const shortcut = String(value || "").trim().toLowerCase();
    return shortcut === "space" ? " " : shortcut;
  }

  function isTypingTarget(target) {
    return target instanceof HTMLElement && (
      target.matches("input, textarea, select") || target.isContentEditable
    );
  }

  function text(value) {
    return String(value ?? "");
  }

  function createElement(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }

  function validateConfig(config) {
    if (!config || !Array.isArray(config.sounds)) {
      throw new Error("โครงสร้าง configuration ไม่ถูกต้อง: ต้องมีรายการ sounds");
    }

    const ids = new Set();
    const shortcuts = new Set();
    config.sounds.forEach((sound, index) => {
      if (!sound || !sound.id || !sound.name || !sound.file) {
        throw new Error(`รายการเสียงลำดับที่ ${index + 1} ต้องมี id, name และ file`);
      }
      const id = text(sound.id).trim();
      const shortcut = normaliseShortcut(sound.shortcut);
      if (ids.has(id)) throw new Error(`พบ id ซ้ำ: ${id}`);
      if (shortcut && shortcuts.has(shortcut)) throw new Error(`พบ shortcut ซ้ำ: ${sound.shortcut}`);
      ids.add(id);
      if (shortcut) shortcuts.add(shortcut);
    });
  }

  function showLoadError(detail) {
    document.querySelectorAll(".view").forEach((view) => { view.hidden = true; });
    elements.loadError.hidden = false;
    elements.loadError.replaceChildren(
      createElement("strong", "", "ไม่สามารถโหลดการตั้งค่าเสียงได้"),
      document.createTextNode("กรุณาตรวจสอบไฟล์ sounds.json แล้วลองใหม่"),
      document.createElement("br"),
      createElement("small", "", detail)
    );
  }

  function formatShortcut(shortcut) {
    const normalised = normaliseShortcut(shortcut);
    return normalised === " " ? "Space" : (text(shortcut).trim() || "—");
  }

  function setTitles(settings = {}) {
    const title = text(settings.title).trim() || "Soundboard";
    const subtitle = text(settings.subtitle).trim();
    document.title = title;
    $("#sidebar-title").textContent = title;
    $("#mobile-title").textContent = title.toUpperCase();
    $("#sidebar-subtitle").textContent = subtitle;
    $("#board-title").textContent = title;
    $("#board-subtitle").textContent = subtitle;
  }

  function visibleSounds() {
    const keyword = state.search.trim().toLocaleLowerCase("th");
    return state.sounds.filter((sound) => {
      const categoryMatches = state.activeCategory === "all" || sound.category === state.activeCategory;
      const nameMatches = !keyword || text(sound.name).toLocaleLowerCase("th").includes(keyword);
      return categoryMatches && nameMatches;
    });
  }

  function updateCardPlaybackState(id) {
    const card = elements.board.querySelector(`[data-sound-id="${CSS.escape(id)}"]`);
    if (!card) return;
    const records = state.activeAudio.get(id);
    card.classList.toggle("playing", Boolean(records && records.size));
    let label = card.querySelector(".playing-label");
    if (records && records.size && !label) {
      label = createElement("span", "playing-label", "PLAYING");
      card.append(label);
    } else if ((!records || !records.size) && label) {
      label.remove();
    }
  }

  function markUnavailable(id) {
    state.unavailableIds.add(id);
    const card = elements.board.querySelector(`[data-sound-id="${CSS.escape(id)}"]`);
    if (!card || card.querySelector(".file-label")) return;
    card.classList.add("unavailable");
    card.prepend(createElement("span", "file-label", "FILE NOT FOUND"));
  }

  function removeAudio(sound, audio) {
    const records = state.activeAudio.get(sound.id);
    if (!records) return;
    records.delete(audio);
    if (!records.size) state.activeAudio.delete(sound.id);
    updateCardPlaybackState(sound.id);
  }

  function playSound(sound) {
    const audio = new Audio(sound.file);
    audio.preload = "metadata";
    audio.volume = state.volume;
    const records = state.activeAudio.get(sound.id) || new Set();
    records.add(audio);
    state.activeAudio.set(sound.id, records);
    updateCardPlaybackState(sound.id);

    audio.addEventListener("ended", () => removeAudio(sound, audio), { once: true });
    audio.addEventListener("error", () => {
      markUnavailable(sound.id);
      removeAudio(sound, audio);
    }, { once: true });
    audio.play().catch(() => removeAudio(sound, audio));
  }

  function stopAll() {
    [...state.activeAudio.entries()].forEach(([id, records]) => {
      records.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      state.activeAudio.delete(id);
      updateCardPlaybackState(id);
    });
  }

  function renderCategories() {
    const categories = [...new Set(state.sounds.map((sound) => sound.category || "อื่น ๆ"))];
    elements.categoryFilters.replaceChildren();
    [["all", "ทั้งหมด"], ...categories.map((category) => [category, category])].forEach(([value, label]) => {
      const button = createElement("button", `filter-button${state.activeCategory === value ? " active" : ""}`, label);
      button.type = "button";
      button.setAttribute("aria-pressed", String(state.activeCategory === value));
      button.addEventListener("click", () => {
        state.activeCategory = value;
        renderCategories();
        renderBoard();
      });
      elements.categoryFilters.append(button);
    });
  }

  function renderBoard() {
    const sounds = visibleSounds();
    elements.board.replaceChildren();
    sounds.forEach((sound) => {
      const card = createElement("button", "sound-card");
      card.type = "button";
      card.dataset.soundId = sound.id;
      card.setAttribute("aria-label", `เล่นเสียง ${sound.name}`);
      card.append(
        createElement("span", "card-name", sound.name),
        createElement("kbd", "shortcut", formatShortcut(sound.shortcut))
      );
      if (state.unavailableIds.has(sound.id)) {
        card.classList.add("unavailable");
        card.prepend(createElement("span", "file-label", "FILE NOT FOUND"));
      }
      card.addEventListener("pointerdown", () => card.classList.add("pressed"));
      ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => card.addEventListener(eventName, () => card.classList.remove("pressed")));
      card.addEventListener("click", () => playSound(sound));
      elements.board.append(card);
      updateCardPlaybackState(sound.id);
    });
    elements.emptyBoard.hidden = sounds.length !== 0;
  }

  function renderSoundList() {
    const keyword = state.listSearch.trim().toLocaleLowerCase("th");
    const sounds = state.sounds.filter((sound) => !keyword || `${sound.name} ${sound.category} ${sound.file}`.toLocaleLowerCase("th").includes(keyword));
    elements.listBody.replaceChildren();
    sounds.forEach((sound) => {
      const row = document.createElement("tr");
      const name = createElement("td", "", sound.name);
      const category = createElement("td", "", sound.category || "อื่น ๆ");
      const shortcut = document.createElement("td");
      shortcut.append(createElement("kbd", "key-badge", formatShortcut(sound.shortcut)));
      const file = createElement("td", "file-path", sound.file);
      row.append(name, category, shortcut, file);
      elements.listBody.append(row);
    });
    if (!sounds.length) {
      const row = document.createElement("tr");
      const cell = createElement("td", "", "ไม่พบรายการเสียง");
      cell.colSpan = 4;
      row.append(cell);
      elements.listBody.append(row);
    }
  }

  function currentRoute() {
    const route = location.hash.replace("#", "");
    return ["soundboard", "sounds", "guide"].includes(route) ? route : "soundboard";
  }

  function renderRoute() {
    const route = currentRoute();
    document.querySelectorAll("[data-view]").forEach((view) => { view.hidden = view.dataset.view !== route; });
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === route);
    });
    elements.sidebar.classList.remove("open");
    elements.menuButton.setAttribute("aria-expanded", "false");
  }

  function bindEvents() {
    elements.soundSearch.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderBoard();
    });
    elements.listSearch.addEventListener("input", (event) => {
      state.listSearch = event.target.value;
      renderSoundList();
    });
    elements.volume.addEventListener("input", (event) => {
      state.volume = Number(event.target.value);
      elements.volumeValue.value = `${Math.round(state.volume * 100)}%`;
      elements.volumeValue.textContent = elements.volumeValue.value;
      state.activeAudio.forEach((records) => records.forEach((audio) => { audio.volume = state.volume; }));
    });
    elements.stopAll.addEventListener("click", stopAll);
    elements.menuButton.addEventListener("click", () => {
      const open = elements.sidebar.classList.toggle("open");
      elements.menuButton.setAttribute("aria-expanded", String(open));
    });
    window.addEventListener("hashchange", renderRoute);
    window.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
      const sound = state.sounds.find((item) => normaliseShortcut(item.shortcut) === normaliseShortcut(event.key));
      if (sound) {
        event.preventDefault();
        playSound(sound);
      }
    });
  }

  async function initialise() {
    try {
      const response = await fetch("./sounds.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`ไม่พบ sounds.json (HTTP ${response.status})`);
      let config;
      try {
        config = JSON.parse(await response.text());
      } catch {
        throw new Error("Invalid JSON configuration.");
      }
      validateConfig(config);
      state.sounds = config.sounds.map((sound) => ({
        ...sound,
        id: text(sound.id).trim(),
        name: text(sound.name).trim(),
        file: text(sound.file).trim(),
        category: text(sound.category).trim() || "อื่น ๆ",
        shortcut: text(sound.shortcut).trim()
      }));
      const configuredVolume = Number(config.settings?.defaultVolume);
      state.volume = Number.isFinite(configuredVolume) ? Math.max(0, Math.min(1, configuredVolume)) : 0.85;
      elements.volume.value = String(state.volume);
      elements.volumeValue.value = `${Math.round(state.volume * 100)}%`;
      elements.volumeValue.textContent = elements.volumeValue.value;
      setTitles(config.settings);
      renderCategories();
      renderBoard();
      renderSoundList();
      bindEvents();
      if (!location.hash) location.hash = "soundboard";
      renderRoute();
    } catch (error) {
      showLoadError(error instanceof Error ? error.message : "ไม่ทราบสาเหตุ");
    }
  }

  initialise();
})();
