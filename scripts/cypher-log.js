const MODULE_ID = "cypher-log";
const FLAG = "cypher-log";
const ICON = "icons/svg/book.svg";
const SETTINGS = { shelves: "shelves", theme: "theme", documentSize: "documentSize", documentPadding: "documentPadding", autosaveInterval: "autosaveInterval", launcherHidden: "launcherHidden", launcherBottom: "launcherBottom", launcherRight: "launcherRight", launcherSize: "launcherSize", launcherOpacity: "launcherOpacity", settingsX: "settingsX", settingsY: "settingsY", editorX: "editorX", editorY: "editorY", editorW: "editorW", editorH: "editorH", readerX: "readerX", readerY: "readerY", readerW: "readerW", readerH: "readerH", folderLabelFlip: "folderLabelFlip", folderLabelSize: "folderLabelSize", folderBgColor: "folderBgColor", folderBgOpacity: "folderBgOpacity" };
const THEMES = ["walnut", "midnight", "emerald", "crimson", "ivory", "jarvis", "steampunk", "neon", "green-hud"];

const TEMPLATES = [
  { id: "session-recap", name: "Session Recap", icon: "fa-scroll",
    title: "Session Recap", folder: "Recaps", tags: ["recap"],
    content: `<h1>Session Recap</h1><h2>Key Events</h2><ul><li></li></ul><h2>Decisions Made</h2><ul><li></li></ul><h2>Loose Threads</h2><ul><li></li></ul><h2>Next Steps</h2><ul><li></li></ul>` },
  { id: "npc-notes", name: "NPC Notes", icon: "fa-user",
    title: "NPC: ", folder: "NPCs", tags: ["npc"],
    content: `<h1>NPC Name</h1><p><strong>Role:</strong> </p><p><strong>Personality:</strong> </p><p><strong>Goals:</strong> </p><p><strong>Secrets:</strong> </p><p><strong>Relationships:</strong> </p>` },
  { id: "location", name: "Location", icon: "fa-map-location-dot",
    title: "Location: ", folder: "Locations", tags: ["location"],
    content: `<h1>Location Name</h1><p><strong>Type:</strong> </p><p><strong>Atmosphere:</strong> </p><h2>Notable Features</h2><ul><li></li></ul><h2>Points of Interest</h2><ul><li></li></ul>` },
  { id: "quest", name: "Quest Log", icon: "fa-shield-halved",
    title: "Quest: ", folder: "Quests", tags: ["quest"],
    content: `<h1>Quest Title</h1><p><strong>Status:</strong> Active</p><p><strong>Objective:</strong> </p><h2>Steps</h2><ol><li></li></ol><h2>Rewards</h2><ul><li></li></ul><h2>Related NPCs</h2><ul><li></li></ul>` },
  { id: "combat", name: "Combat Log", icon: "fa-khanda",
    title: "Combat: ", folder: "Combat", tags: ["combat"],
    content: `<h1>Encounter</h1><p><strong>Location:</strong> </p><p><strong>Difficulty:</strong> </p><h2>Enemies</h2><ul><li></li></ul><h2>Allies</h2><ul><li></li></ul><h2>Key Moments</h2><ul><li></li></ul><h2>Loot &amp; Rewards</h2><ul><li></li></ul>` },
  { id: "item", name: "Item Notes", icon: "fa-gem",
    title: "Item: ", folder: "Items", tags: ["item"],
    content: `<h1>Item Name</h1><p><strong>Type:</strong> </p><p><strong>Rarity:</strong> </p><p><strong>Description:</strong> </p><h2>Properties</h2><ul><li></li></ul><h2>History</h2><p></p><h2>Current Owner</h2><p></p>` },
  { id: "faction", name: "Faction", icon: "fa-users",
    title: "Faction: ", folder: "Factions", tags: ["faction"],
    content: `<h1>Faction Name</h1><p><strong>Type:</strong> </p><p><strong>Goals:</strong> </p><h2>Key Members</h2><ul><li></li></ul><h2>Allies</h2><ul><li></li></ul><h2>Enemies</h2><ul><li></li></ul><h2>Secrets</h2><p></p>` },
  { id: "custom", name: "Blank", icon: "fa-file",
    title: "", folder: "", tags: [],
    content: "" }
];

function htmlToText(html = "") {
  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent || container.innerText || "").replace(/\s+/g, " ").trim();
}
function setting(key) {
  try { return game.settings.get(MODULE_ID, SETTINGS[key]); }
  catch (error) { console.warn(`${MODULE_ID} | Setting unavailable: ${key}`, error); return undefined; }
}

function executeEditorCommand(command, value = null) {
  try {
    const succeeded = document.execCommand(command, false, value);
    if (!succeeded) console.warn(`${MODULE_ID} | Editor command was not applied: ${command}`);
    return succeeded;
  } catch (error) {
    console.error(`${MODULE_ID} | Editor command failed: ${command}`, error);
    ui.notifications.warn("CYPHER LOG could not apply that editor command.");
    return false;
  }
}

function isCypherLog(entry) {
  try { return Boolean(entry?.getFlag?.(MODULE_ID, FLAG)); }
  catch (error) { console.warn(`${MODULE_ID} | Could not inspect journal entry`, error); return false; }
}
function getFolders() {
  try { return game.settings.get(MODULE_ID, "folders") || []; }
  catch (error) { return []; }
}
function getFolder(entry) {
  try { return entry?.getFlag?.(MODULE_ID, "folder") || ""; }
  catch (error) { return ""; }
}

class CypherLog {
  static library = null;
  static entries() { 
    return (game.journal?.contents ?? []).filter(e => {
      if (!isCypherLog(e)) return false;
      if (game.user?.isGM) return true;
      try { return e.getFlag(MODULE_ID, "shared") === true; }
      catch { return false; }
    }); 
  }
  static cover(entry) {
    const cover = entry?.getFlag(MODULE_ID, "cover");
    return typeof cover === "string" && cover.trim() ? cover.trim() : null;
  }
  static applyLauncherAppearance(button = document.getElementById("cypher-log-launcher")) {
    if (!button) return;
    const bottom = Math.min(100, Math.max(0, Number(setting("launcherBottom")) || 2));
    const right = Math.min(100, Math.max(0, Number(setting("launcherRight")) || 1));
    const size = Math.min(120, Math.max(24, Number(setting("launcherSize")) || 37));
    const opacity = Math.min(100, Math.max(10, Number(setting("launcherOpacity")) || 100));
    button.hidden = Boolean(setting("launcherHidden"));
    button.style.left = "auto";
    button.style.bottom = `${bottom}%`;
    button.style.right = `${right}%`;
    button.style.width = `${size}px`;
    button.style.height = `${size}px`;
    button.style.fontSize = `${Math.max(12, Math.round(size * .42))}px`;
    button.style.opacity = String(opacity / 100);
  }
  static injectButton() {
    document.getElementById("cypher-log-launcher")?.remove();
    let integrated = false;
    // Try Cypher Taskbar (player version) first
    if (game.modules.get("cypher-taskbar")?.active) {
      this._integrateWithTaskbar();
      integrated = true;
    }
    // Also try Cypher GM Taskbar (both can be active)
    if (game.modules.get("cypher-gm-taskbar")?.active) {
      this._integrateWithGMTaskbar();
      integrated = true;
    }
    // If neither taskbar module is active, use standalone launcher
    if (integrated) return;
    const button = document.createElement("button");
    button.id = "cypher-log-launcher"; button.type = "button"; button.title = "Open CYPHER LOG";
    button.setAttribute("aria-label", "Open CYPHER LOG"); button.innerHTML = '<i class="fa-solid fa-book-open"></i>';
    let dragged = false;
    button.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      const startX = event.clientX, startY = event.clientY;
      const move = moveEvent => {
        if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return;
        dragged = true;
        const size = button.getBoundingClientRect();
        const bottom = Math.min(100, Math.max(0, ((window.innerHeight - moveEvent.clientY - size.height / 2) / window.innerHeight) * 100));
        const right = Math.min(100, Math.max(0, ((window.innerWidth - moveEvent.clientX - size.width / 2) / window.innerWidth) * 100));
        button.style.bottom = `${bottom}%`; button.style.right = `${right}%`;
      };
      const stop = async () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); await Promise.all([game.settings.set(MODULE_ID, SETTINGS.launcherBottom, Math.round(parseFloat(button.style.bottom))), game.settings.set(MODULE_ID, SETTINGS.launcherRight, Math.round(parseFloat(button.style.right)))]); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop, {once:true});
    });
    button.addEventListener("click", event => { if (dragged) { event.preventDefault(); dragged = false; return; } this.toggleLibrary(); });
    document.body.append(button); this.applyLauncherAppearance(button);
  }

  /** Inject Cypher Log button into Cypher Taskbar (player version) — right of eye button */
  static _injectTaskbarButton() {
    const bar = document.querySelector("#cypher-taskbar-bar");
    if (!bar) { console.log("Cypher Log | Taskbar bar not found in DOM yet"); return false; }
    const s1 = bar.querySelector(".ct-section-1");
    if (!s1) { console.log("Cypher Log | Taskbar section-1 not found"); return false; }
    // Remove any existing injected button
    s1.querySelector(".cl-taskbar-btn")?.remove();
    const btn = document.createElement("button");
    btn.className = "ct-btn cl-taskbar-btn";
    btn.id = "cl-taskbar-log-btn";
    btn.type = "button";
    btn.title = "Open CYPHER LOG";
    btn.setAttribute("aria-label", "Open CYPHER LOG");
    btn.innerHTML = '<i class="fa-solid fa-book-open"></i>';
    btn.style.cssText = "min-width:42px;padding:6px 10px;background:transparent;border:none;color:#e8dfd1;cursor:pointer;transition:color .2s ease;text-shadow:0 1px 3px rgba(0,0,0,.6);";
    btn.addEventListener("mouseenter", () => { btn.style.color = "#ff9f43"; });
    btn.addEventListener("mouseleave", () => { btn.style.color = "#e8dfd1"; });
    btn.addEventListener("click", () => this.toggleLibrary());
    // Insert AFTER the eye button (#ct-btn-eye)
    const eyeBtn = s1.querySelector("#ct-btn-eye");
    if (eyeBtn && eyeBtn.nextElementSibling) {
      eyeBtn.parentNode.insertBefore(btn, eyeBtn.nextElementSibling);
    } else if (eyeBtn) {
      eyeBtn.parentNode.append(btn);
    } else {
      s1.append(btn);
    }
    console.log("Cypher Log | Button injected into Cypher Taskbar");
    return true;
  }

  /** Retry injection until Cypher Taskbar DOM exists, then patch render */
  static _integrateWithTaskbar() {
    if (document.querySelector("#cl-taskbar-log-btn")) {
      console.log("Cypher Log | Already integrated with Cypher Taskbar");
      return;
    }
    // Try immediate injection
    if (this._injectTaskbarButton()) {
      this._patchTaskbarRender();
      return;
    }
    console.log("Cypher Log | Taskbar not ready, starting retry + observer...");
    // Set up MutationObserver to detect when taskbar appears
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector("#cypher-taskbar-bar")) {
        obs.disconnect();
        console.log("Cypher Log | Taskbar detected via MutationObserver");
        if (this._injectTaskbarButton()) {
          this._patchTaskbarRender();
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Also retry with interval as fallback
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (this._injectTaskbarButton()) {
        clearInterval(timer);
        observer.disconnect();
        this._patchTaskbarRender();
        return;
      }
      if (attempts > 40) { // 10 seconds max
        clearInterval(timer);
        observer.disconnect();
        console.warn("Cypher Log | Failed to integrate with Cypher Taskbar — bar not found after 10s");
      }
    }, 250);
  }

  /** Patch Cypher Taskbar render to keep our button after re-renders */
  static _patchTaskbarRender() {
    // Try to patch via window.CypherTaskbar (set by taskbar in ready hook)
    const patchViaWindow = () => {
      const TB = window.CypherTaskbar;
      if (!TB) return false;
      const tb = TB.instance;
      if (!tb || tb._clPatched) return false;
      tb._clPatched = true;
      const originalRender = tb.render.bind(tb);
      tb.render = function(...args) {
        originalRender(...args);
        requestAnimationFrame(() => CypherLog._injectTaskbarButton());
      };
      console.log("Cypher Log | Patched CypherTaskbar.render via window");
      return true;
    };
    // Try to patch via prototype (works even before instance exists)
    const patchViaPrototype = () => {
      const TB = window.CypherTaskbar;
      if (!TB || TB.prototype._clPatched) return false;
      TB.prototype._clPatched = true;
      const originalRender = TB.prototype.render;
      TB.prototype.render = function(...args) {
        originalRender.apply(this, args);
        requestAnimationFrame(() => CypherLog._injectTaskbarButton());
      };
      console.log("Cypher Log | Patched CypherTaskbar.render via prototype");
      return true;
    };
    if (patchViaWindow()) return;
    if (patchViaPrototype()) return;
    // If neither worked, retry patching after a delay
    console.log("Cypher Log | Render patch deferred — waiting for CypherTaskbar...");
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (patchViaWindow() || patchViaPrototype()) {
        clearInterval(timer);
        return;
      }
      if (attempts > 20) {
        clearInterval(timer);
        console.warn("Cypher Log | Could not patch CypherTaskbar.render after 5s");
      }
    }, 250);
  }

  /** Inject Cypher Log button into Cypher GM Taskbar SECTION 1 */
  static _injectGMTaskbarButton() {
    const bar = document.querySelector("#cypher-gm-taskbar-bar");
    if (!bar) return false;
    // Target SECTION 1's button container
    const sectionButtons = bar.querySelector(".cgm-section-buttons");
    if (!sectionButtons) return false;
    // Remove any existing injected button
    sectionButtons.querySelector(".cl-section-btn")?.remove();
    const btn = document.createElement("button");
    btn.className = "cgm-section-btn cl-section-btn";
    btn.type = "button";
    btn.title = "Open CYPHER LOG";
    btn.setAttribute("aria-label", "Open CYPHER LOG");
    btn.innerHTML = '<i class="fa-solid fa-book-open"></i>';
    btn.addEventListener("click", () => this.toggleLibrary());
    // Prepend before any other buttons in SECTION 1
    sectionButtons.prepend(btn);
    return true;
  }

  /** Retry injection until GM Taskbar DOM exists, then patch render */
  static _integrateWithGMTaskbar() {
    // Already injected successfully?
    if (document.querySelector(".cl-gm-taskbar-btn")) return;
    // Try immediate injection
    if (this._injectGMTaskbarButton()) {
      this._patchGMTaskbarRender();
      return;
    }
    // Retry every 250ms until successful (GM Taskbar init is ~500ms after ready)
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (this._injectGMTaskbarButton()) {
        clearInterval(timer);
        this._patchGMTaskbarRender();
        return;
      }
      if (attempts > 20) { // 5 seconds max
        clearInterval(timer);
        console.warn("Cypher Log | Failed to integrate with GM Taskbar — bar not found after 5s");
      }
    }, 250);
  }

  /** Patch GM Taskbar render to keep our button after re-renders */
  static _patchGMTaskbarRender() {
    const gm = window.cypherGMTaskbar;
    if (!gm || gm._clPatched) return;
    gm._clPatched = true;
    const originalRender = gm.render.bind(gm);
    gm.render = function(...args) {
      originalRender(...args);
      // Defer to next tick so DOM is ready
      requestAnimationFrame(() => CypherLog._injectGMTaskbarButton());
    };
  }
  static toggleLibrary() { return this.library?.isConnected ? this.closeLibrary() : this.openLibrary(); }
  static closeLibrary() {
    const lib = this.library;
    if (lib?.isConnected) {
      lib.classList.add("cl-closing");
      setTimeout(() => {
        lib.remove();
        document.querySelectorAll('.cl-export-menu, .cl-settings-window').forEach(el => el.remove());
        this.library = null;
      }, 350);
    } else {
      document.querySelectorAll('.cl-export-menu, .cl-settings-window').forEach(el => el.remove());
      this.library = null;
    }
  }
  static libraryStyle() {
    const sizes = { xxsmall: { w: "72px", h: "115px" }, xsmall: { w: "92px", h: "145px" }, small: { w: "112px", h: "175px" }, medium: { w: "142px", h: "210px" }, large: { w: "172px", h: "255px" } };
    const size = sizes[setting("documentSize")];
    return `--cl-shelf-count:${setting("shelves")};--cl-book-width:${size.w};--cl-book-height:${size.h};--cl-book-padding:${setting("documentPadding")}px;`;
  }
  static positionLibraryNearLauncher(library) {
    let launcher = document.getElementById("cypher-log-launcher");
    // Fallback to GM taskbar button or player taskbar button
    if (!launcher) launcher = document.querySelector(".cl-gm-taskbar-btn");
    if (!launcher) launcher = document.querySelector("#cl-taskbar-log-btn");
    if (!launcher || !library?.isConnected) return;
    const icon = launcher.getBoundingClientRect();
    const margin = 12, iconGap = 10, shelf = library.getBoundingClientRect();
    const width = Math.min(shelf.width, window.innerWidth - margin * 2);
    const height = Math.min(shelf.height, window.innerHeight - margin * 2);
    const centerX = icon.left + icon.width / 2, centerY = icon.top + icon.height / 2;
    const preferLeft = centerX > window.innerWidth / 2;
    const preferAbove = centerY > window.innerHeight / 2;
    let left = preferLeft ? icon.left - iconGap - width : icon.right + iconGap;
    let top = Math.max(margin, Math.min(window.innerHeight - height - margin, centerY - height / 2));
    // Keep the shelf exactly 10px beside the button when that inward side fits.
    if (left < margin || left + width > window.innerWidth - margin) {
      left = preferLeft ? icon.right + iconGap : icon.left - iconGap - width;
    }
    // Very narrow viewports: use the closest valid in-screen position.
    left = Math.max(margin, Math.min(window.innerWidth - width - margin, left));
    if (top < margin || top + height > window.innerHeight - margin) {
      top = preferAbove ? icon.top - iconGap - height : icon.bottom + iconGap;
      top = Math.max(margin, Math.min(window.innerHeight - height - margin, top));
    }
    library.style.left = `${Math.round(left)}px`; library.style.top = `${Math.round(top)}px`;
    library.style.right = "auto"; library.style.bottom = "auto";
  }
  static openLibrary() {
    this.closeLibrary();
    const library = document.createElement("section"); library.id = "cypher-log-library";
    library.className = `cl-theme-${setting("theme")} cl-slide-from-left`; library.style.cssText = this.libraryStyle();
    library.innerHTML = `<header class="cl-header"><div class="cl-header-logo"><i class="fa-solid fa-book-open"></i></div><div class="cl-library-search"><label class="cl-search-input" title="Search document title, text, or tags"><i class="fa-solid fa-magnifying-glass"></i><input type="search" data-filter="query" placeholder="Search" aria-label="Search logs"></label><select data-filter="folders" aria-label="Filter by folder"><option value="">All folders</option></select></div><div class="cl-header-actions"><button type="button" class="cl-hamburger" title="Menu" aria-label="Menu"><i class="fa-solid fa-bars"></i></button><div class="cl-dropdown"><button type="button" data-action="new"><i class="fa-solid fa-pen-nib"></i> New document</button><button type="button" data-action="folders"><i class="fa-solid fa-folder-open"></i> Manage folders</button><button type="button" data-action="settings"><i class="fa-solid fa-gear"></i> Settings</button><button type="button" data-action="close"><i class="fa-solid fa-xmark"></i> Close library</button></div></div></header><div class="cl-shelves" aria-label="CYPHER LOG document library"></div>`;
    const hamburger = library.querySelector('.cl-hamburger');
    const dropdown = library.querySelector('.cl-dropdown');
    hamburger?.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('is-open'); });
    const closeDropdown = (e) => { if (!dropdown.contains(e.target) && !hamburger.contains(e.target)) dropdown.classList.remove('is-open'); };
    window.addEventListener('click', closeDropdown);
    library.querySelector('[data-action="close"]').addEventListener("click", () => this.closeLibrary());
    library.querySelector('[data-action="new"]').addEventListener("click", () => this.openTemplatePicker());
    library.querySelector('[data-action="settings"]').addEventListener("click", () => this.openSettings());
    library.querySelector('[data-action="folders"]').addEventListener("click", () => this.openFolderManager());
    library.querySelectorAll('[data-filter]').forEach(control => control.addEventListener(control.matches('input') ? 'input' : 'change', () => this.renderShelf()));
    this.library = library; document.body.append(library); this.refreshAppearance(); this.renderShelf();
    // Trigger slide-in animation after a micro-task so the browser sees the initial hidden state
    requestAnimationFrame(() => { requestAnimationFrame(() => library.classList.add("cl-slide-visible")); });
  }
  static renderShelf() {
    const shelf = this.library?.querySelector(".cl-shelves"); if (!shelf) return;
    const query=(this.library.querySelector('[data-filter="query"]')?.value||"").trim().toLocaleLowerCase();
    const tag=this.library.querySelector('[data-filter="tags"]')?.value||"";
    const folderFilter=this.library.querySelector('[data-filter="folders"]')?.value||"";
    const sort=this.library.querySelector('[data-filter="sort"]')?.value||"name-asc";
    const allEntries=this.entries();
    const folders=getFolders();
    const foldersSelect=this.library.querySelector('[data-filter="folders"]');
    if(foldersSelect){ const current=foldersSelect.value; const folderOpts=folders.map(f=>`<option value="${foundry.utils.escapeHTML(f)}" ${f===current?'selected':''}>${foundry.utils.escapeHTML(f)}</option>`).join(''); foldersSelect.innerHTML=`<option value="">All folders</option>${folderOpts}`; }
    const tagsSelect=this.library.querySelector('[data-filter="tags"]');
    if(tagsSelect){ const current=tagsSelect.value; const allTags=[...new Set(allEntries.flatMap(e=>e.getFlag(MODULE_ID,'tags')||[]))].sort((a,b)=>a.localeCompare(b)); tagsSelect.innerHTML=`<option value="">All tags</option>${allTags.map(t=>`<option value="${foundry.utils.escapeHTML(t)}" ${t===current?'selected':''}>${foundry.utils.escapeHTML(t)}</option>`).join('')}`; }
    const entries=allEntries.filter(entry=>{ const entryTags=entry.getFlag(MODULE_ID,'tags')||[]; const entryFolder=getFolder(entry); const page=entry.pages.contents.find(p=>p.type==='text'); const haystack=`${entry.name} ${entryTags.join(' ')} ${htmlToText(page?.text?.content||'')}${entryFolder}`.toLocaleLowerCase(); return (!query||haystack.includes(query))&&(!tag||entryTags.includes(tag))&&(!folderFilter||entryFolder===folderFilter); });
    entries.sort((a,b)=>{ if(sort==='name-desc')return b.name.localeCompare(a.name); if(sort==='newest')return (b._stats?.createdTime||0)-(a._stats?.createdTime||0); if(sort==='oldest')return (a._stats?.createdTime||0)-(b._stats?.createdTime||0); return a.name.localeCompare(b.name); });
    if (!entries.length) { shelf.innerHTML = `<div class="cl-empty"><i class="fa-solid fa-feather-pointed"></i><p>Your log is empty.</p><span>Select the pen to write the first entry.</span></div>`; return; }
    shelf.innerHTML = "";
    // Group by folder when showing all folders
    if (!folderFilter && folders.length) {
      const grouped = new Map();
      const uncategorized = [];
      for (const entry of entries) {
        const f = getFolder(entry);
        if (f && folders.includes(f)) {
          if (!grouped.has(f)) grouped.set(f, []);
          grouped.get(f).push(entry);
        } else {
          uncategorized.push(entry);
        }
      }
      // Render folders in order
      let visibleFolderIndex = 0;
      for (let i = 0; i < folders.length; i++) {
        const folderName = folders[i];
        const folderEntries = grouped.get(folderName) || [];
        if (!folderEntries.length) continue;
        const section = document.createElement("div");
        section.className = "cl-folder-section" + (visibleFolderIndex % 2 === 1 ? " cl-folder-even" : "");
        visibleFolderIndex++;
        const label = document.createElement("div");
        label.className = "cl-folder-label";
        label.innerHTML = `<i class="fa-solid fa-folder"></i><span>${foundry.utils.escapeHTML(folderName)}</span>`;
        const bookGrid = document.createElement("div");
        bookGrid.className = "cl-folder-books";
        for (const entry of folderEntries) {
          this._renderBookCard(entry, bookGrid);
        }
        section.append(label, bookGrid);
        shelf.append(section);
      }
      // Render uncategorized
      if (uncategorized.length) {
        const section = document.createElement("div");
        section.className = "cl-folder-section" + (visibleFolderIndex % 2 === 1 ? " cl-folder-even" : "");
        const label = document.createElement("div");
        label.className = "cl-folder-label cl-folder-uncategorized";
        label.innerHTML = `<i class="fa-solid fa-layer-group"></i><span>Uncategorized</span>`;
        const bookGrid = document.createElement("div");
        bookGrid.className = "cl-folder-books";
        for (const entry of uncategorized) {
          this._renderBookCard(entry, bookGrid);
        }
        section.append(label, bookGrid);
        shelf.append(section);
      }
    } else {
      const section = document.createElement("div");
      section.className = "cl-folder-section cl-folder-single";
      const bookGrid = document.createElement("div");
      bookGrid.className = "cl-folder-books";
      for (const entry of entries) {
        this._renderBookCard(entry, bookGrid);
      }
      section.append(bookGrid);
      shelf.append(section);
    }
    // Add scrollable class when more than 3 folder sections
    const sectionCount = shelf.querySelectorAll('.cl-folder-section').length;
    shelf.classList.toggle('cl-shelves-scrollable', sectionCount > 3);
  }
  static _renderBookCard(entry, shelf) {
    const page = entry.pages.contents.find(p => p.type === "text");
    const card = document.createElement("article");
    card.className = "cl-book"; card.tabIndex = 0;
    const cover = this.cover(entry);
    let isShared = false;
    try { isShared = entry.getFlag(MODULE_ID, "shared") === true; } catch {}
    card.innerHTML = `<div class="cl-cover${cover ? " has-cover" : ""}"></div><h3 class="cl-card-title">${foundry.utils.escapeHTML(entry.name)}</h3>${isShared ? '<span class="cl-shared-badge" title="Shared with players"><i class="fa-solid fa-users"></i></span>' : ''}<button class="cl-book-delete" title="Delete document" aria-label="Delete document"><i class="fa-solid fa-trash-can"></i></button>`;
    if (cover) {
      const image = document.createElement("img");
      image.className = "cl-cover-image";
      image.src = cover;
      image.alt = "";
      image.addEventListener("error", () => { console.warn(`${MODULE_ID} | Cover image could not load: ${cover}`); image.remove(); card.querySelector(".cl-cover")?.classList.remove("has-cover"); });
      card.querySelector(".cl-cover").append(image);
    }
    card.addEventListener("click", () => this.openReader(entry)); card.addEventListener("keydown", e => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); this.openReader(entry); }});
    const delBtn = card.querySelector(".cl-book-delete");
    if (delBtn) {
      delBtn.addEventListener("click", (e) => { e.stopPropagation(); this.confirmDelete(entry); });
    }
    shelf.append(card);
  }
  static refreshAppearance() {
    const lib = this.library;
    if (lib?.isConnected) {
      // Preserve slide animation classes while updating theme
      const hadVisible = lib.classList.contains("cl-slide-visible");
      const hadClosing = lib.classList.contains("cl-closing");
      lib.className = `cl-theme-${setting("theme")} cl-slide-from-left`;
      if (hadVisible) lib.classList.add("cl-slide-visible");
      if (hadClosing) lib.classList.add("cl-closing");
      // Apply CSS variables without touching positioning (left/top/width/height handled by CSS)
      const cssVars = this.libraryStyle();
      lib.style.cssText = cssVars;
      this.renderShelf();
    }
    document.querySelectorAll(".cl-editor-window").forEach(win => { win.className = `cl-editor-window cl-theme-${setting("theme")}`; });
    this.applyLauncherAppearance();
    // Apply folder label styles (lib already declared above)
    if (lib?.isConnected) {
      const flip = setting("folderLabelFlip");
      const size = setting("folderLabelSize") ?? 10;
      const bgColor = setting("folderBgColor") ?? "#8b5e34";
      const bgOpacity = (setting("folderBgOpacity") ?? 0) / 100;
      lib.style.setProperty("--cl-folder-flip", flip ? "180deg" : "0deg");
      lib.style.setProperty("--cl-folder-size", `${size}px`);
      // Convert hex to rgb for even-folder background
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      lib.style.setProperty("--cl-folder-bg", `rgba(${r},${g},${b},${bgOpacity})`);
      lib.style.setProperty("--cl-folder-bg-fade", `rgba(${r},${g},${b},${Math.max(0, bgOpacity - 0.06)})`);
    }
  }
  static confirmDelete(entry) {
    document.querySelector(".cl-delete-dialog")?.remove();
    const dialog = document.createElement("section");
    dialog.className = "cl-delete-dialog";
    dialog.innerHTML = `<header><span><i class="fa-solid fa-triangle-exclamation"></i> Delete Document</span><button data-action="close"><i class="fa-solid fa-xmark"></i></button></header><main><p class="cl-delete-warning">Are you really, really sure!?</p><p class="cl-delete-target">"${foundry.utils.escapeHTML(entry.name)}"</p><p class="cl-delete-hint">This action cannot be undone.</p></main><footer><button class="cl-delete-cancel" data-action="close">Cancel</button><button class="cl-delete-confirm" data-action="confirm"><i class="fa-solid fa-trash-can"></i> Delete Forever</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.remove();
    dialog.querySelectorAll('[data-action="close"]').forEach(b => b.addEventListener("click", close));
    dialog.querySelector('[data-action="confirm"]').addEventListener("click", async () => {
      try {
        await entry.delete();
        ui.notifications.info(`CYPHER LOG | "${entry.name}" has been deleted.`);
        this.renderShelf();
      } catch (error) {
        console.error(`${MODULE_ID} | Failed to delete entry`, error);
        ui.notifications.error("CYPHER LOG could not delete the document.");
      }
      close();
    });
  }
  static openFolderManager() {
    document.querySelector(".cl-folder-manager")?.remove();
    const folders = getFolders();
    const dialog = document.createElement("section");
    dialog.className = "cl-folder-manager";
    const renderList = () => {
      const list = dialog.querySelector(".cl-folder-list");
      if (!list) return;
      if (!folders.length) { list.innerHTML = `<p class="cl-folder-empty">No folders yet.</p>`; return; }
      list.innerHTML = folders.map((f, i) => `<div class="cl-folder-item" data-index="${i}"><i class="fa-solid fa-folder"></i><input type="text" value="${foundry.utils.escapeHTML(f)}" data-index="${i}"><button data-action="delete" data-index="${i}" title="Delete folder"><i class="fa-solid fa-trash-can"></i></button></div>`).join('');
      list.querySelectorAll('input').forEach(input => input.addEventListener('change', async () => {
        const idx = Number(input.dataset.index);
        const oldName = folders[idx];
        const newName = input.value.trim();
        if (!newName || newName === oldName) { renderList(); return; }
        folders[idx] = newName;
        await game.settings.set(MODULE_ID, "folders", [...folders]);
        // Update entries that had the old folder name
        for (const entry of this.entries()) {
          const ef = getFolder(entry);
          if (ef === oldName) await entry.setFlag(MODULE_ID, "folder", newName);
        }
        this.renderShelf();
        ui.notifications.info(`CYPHER LOG | Folder renamed to "${newName}".`);
      }));
      list.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.index);
        const name = folders[idx];
        if (!confirm(`Delete folder "${name}"? Documents in this folder will become uncategorized.`)) return;
        folders.splice(idx, 1);
        await game.settings.set(MODULE_ID, "folders", [...folders]);
        this.renderShelf();
        renderList();
        ui.notifications.info(`CYPHER LOG | Folder "${name}" deleted.`);
      }));
    };
    dialog.innerHTML = `<header><span><i class="fa-solid fa-folder-open"></i> Manage Folders</span><button data-action="close"><i class="fa-solid fa-xmark"></i></button></header><main><div class="cl-folder-list"></div><div class="cl-folder-add"><input type="text" placeholder="New folder name"><button data-action="add"><i class="fa-solid fa-plus"></i> Add Folder</button></div></main>`;
    document.body.append(dialog);
    const close = () => dialog.remove();
    dialog.querySelector('[data-action="close"]').addEventListener("click", close);
    dialog.querySelector('[data-action="add"]').addEventListener("click", async () => {
      const input = dialog.querySelector('.cl-folder-add input');
      const name = input.value.trim();
      if (!name) return;
      if (folders.includes(name)) { ui.notifications.warn("CYPHER LOG | Folder already exists."); return; }
      folders.push(name);
      await game.settings.set(MODULE_ID, "folders", [...folders]);
      input.value = "";
      renderList();
      this.renderShelf();
      ui.notifications.info(`CYPHER LOG | Folder "${name}" created.`);
    });
    renderList();
  }
  static openSettings() {
    document.querySelector(".cl-settings-window")?.remove();
    const win = document.createElement("section"); win.className = "cl-settings-window";
    const savedX = Number(setting("settingsX")), savedY = Number(setting("settingsY"));
    if (savedX >= 0) win.style.left = `${Math.min(window.innerWidth - 280, savedX)}px`;
    if (savedY >= 0) win.style.top = `${Math.min(window.innerHeight - 120, savedY)}px`;
    const options = (values, current) => values.map(([v, label]) => `<option value="${v}" ${v === current ? "selected" : ""}>${label}</option>`).join("");
    win.innerHTML = `<header><span><i class="fa-solid fa-gear"></i> Library Settings</span><button data-action="close"><i class="fa-solid fa-xmark"></i></button></header><main><section class="cl-settings-column"><label>Number of shelves<select name="shelves">${options([["1","One shelf"],["2","Two shelves"],["3","Three shelves"],["4","Four shelves"],["5","Five shelves"]], String(setting("shelves")))}</select></label><label>Theme<select name="theme">${options([["walnut","Walnut"],["midnight","Midnight"],["emerald","Emerald"],["crimson","Crimson"],["ivory","Ivory parchment"],["jarvis","Jarvis"],["steampunk","Steampunk"],["neon","Neon"],["green-hud","Green HUD"]], setting("theme"))}</select></label><label>Document size<select name="documentSize">${options([["xxsmall","XX-Small"],["xsmall","X-Small"],["small","Small"],["medium","Medium"],["large","Large"]], setting("documentSize"))}</select></label><label>Document padding <output>${setting("documentPadding")}px</output><input name="documentPadding" type="range" min="4" max="32" step="2" value="${setting("documentPadding")}"></label><label>Autosave open document<select name="autosaveInterval">${options([["5","Every 5 minutes"],["10","Every 10 minutes"],["15","Every 15 minutes"]], String(setting("autosaveInterval") ?? 5))}</select></label></section><section class="cl-settings-column"><fieldset class="cl-launcher-settings"><legend><i class="fa-solid fa-book-open"></i> CYPHER LOG icon</legend><label class="cl-setting-check"><input name="launcherHidden" type="checkbox" ${setting("launcherHidden") ? "checked" : ""}> Hide CYPHER LOG icon</label><label>Vertical position <output>${setting("launcherBottom") ?? 2}%</output><input name="launcherBottom" type="range" min="0" max="100" step="1" value="${setting("launcherBottom") ?? 2}"></label><label>Right position <output>${setting("launcherRight") ?? 1}%</output><input name="launcherRight" type="range" min="0" max="100" step="1" value="${setting("launcherRight") ?? 1}"></label><label>Icon size <output>${setting("launcherSize") ?? 37}px</output><input name="launcherSize" type="range" min="24" max="120" step="1" value="${setting("launcherSize") ?? 37}"></label><label>Icon opacity <output>${setting("launcherOpacity") ?? 100}%</output><input name="launcherOpacity" type="range" min="10" max="100" step="1" value="${setting("launcherOpacity") ?? 100}"></label></fieldset><fieldset class="cl-launcher-settings"><legend><i class="fa-solid fa-folder-open"></i> Folder Labels</legend><label class="cl-setting-check"><input name="folderLabelFlip" type="checkbox" ${setting("folderLabelFlip") ? "checked" : ""}> Flip text direction</label><label>Font size <output>${setting("folderLabelSize") ?? 10}px</output><input name="folderLabelSize" type="range" min="6" max="20" step="1" value="${setting("folderLabelSize") ?? 10}"></label><label>Background colour<input name="folderBgColor" type="color" value="${setting("folderBgColor") ?? "#8b5e34"}"></label><label>Background opacity <output>${setting("folderBgOpacity") ?? 0}%</output><input name="folderBgOpacity" type="range" min="0" max="100" step="5" value="${setting("folderBgOpacity") ?? 0}"></label></fieldset></section></main><footer><button class="cl-save"><i class="fa-solid fa-xmark"></i> Close</button></footer>`;
    document.body.append(win); win.addEventListener("click", e => e.stopPropagation());
    const settingsMain = win.querySelector("main");
    const applySettingsLayout = () => {
      const compact = window.innerWidth < 760;
      win.style.width = compact ? "min(94vw, 540px)" : "760px";
      win.style.maxWidth = "94vw";
      settingsMain.style.gridTemplateColumns = compact ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)";
    };
    applySettingsLayout();
    const persistSettingsBounds = () => Promise.all([game.settings.set(MODULE_ID, SETTINGS.settingsX, Math.round(win.offsetLeft)), game.settings.set(MODULE_ID, SETTINGS.settingsY, Math.round(win.offsetTop))]);
    const header = win.querySelector("header");
    header.addEventListener("pointerdown", event => {
      if (event.target.closest("button") || event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      const rect = win.getBoundingClientRect(), startX = event.clientX, startY = event.clientY, startLeft = win.offsetLeft, startTop = win.offsetTop;
      header.setPointerCapture?.(event.pointerId);
      const move = moveEvent => { win.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, startLeft + moveEvent.clientX - startX))}px`; win.style.top = `${Math.max(0, Math.min(window.innerHeight - rect.height, startTop + moveEvent.clientY - startY))}px`; };
      const stop = () => { header.releasePointerCapture?.(event.pointerId); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); persistSettingsBounds(); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop, {once:true}); window.addEventListener("pointercancel", stop, {once:true});
    });
    win.querySelector('[data-action="close"]').addEventListener("click", () => win.remove());
    const inputs = win.querySelectorAll("select, input");
    for (const input of inputs) input.addEventListener("input", async () => {
      try {
        const key = input.name; const numeric = ["shelves", "documentPadding", "autosaveInterval", "launcherBottom", "launcherRight", "launcherSize", "launcherOpacity", "folderLabelSize", "folderBgOpacity"].includes(key); const value = input.type === "checkbox" ? input.checked : numeric ? Number(input.value) : input.value;
        if (!SETTINGS[key]) { console.warn(`${MODULE_ID} | Unknown setting: ${key}`); return; }
        const settingKey = `${MODULE_ID}.${SETTINGS[key]}`;
        if (!game.settings.settings.has(settingKey)) {
          ui.notifications.warn(`CYPHER LOG | Setting "${key}" is not registered yet. Please reload the world or re-enable the Cypher Log module.`);
          return;
        }
        await game.settings.set(MODULE_ID, SETTINGS[key], value);
        const output = input.closest("label")?.querySelector("output"); if (output) output.value = `${input.value}${["documentPadding", "launcherSize", "folderLabelSize"].includes(key) ? "px" : "%"}`;
        this.refreshAppearance();
        // Force shelf re-render when folder appearance changes
        if (["folderLabelFlip", "folderLabelSize", "folderBgColor", "folderBgOpacity"].includes(key)) this.renderShelf();
      } catch (err) {
        console.error(`${MODULE_ID} | Setting save failed:`, err);
        ui.notifications.error(`CYPHER LOG | Could not save "${input.name}". ${err.message}`);
      }
    });
    win.querySelector(".cl-save").addEventListener("click", () => win.remove());
  }
  static openImageDialog(writing, existing=null) {
    document.querySelector(".cl-image-dialog")?.remove();
    const dialog = document.createElement("section"); dialog.className = "cl-image-dialog";
    const modeTitle = existing ? "Edit Image" : "Insert Image";
    const currentImg = existing?.querySelector("img");
    const curUrl = currentImg?.getAttribute("src") || "";
    const style = existing?.style || null;
    const curWidth = style?.width?.endsWith("%") ? style.width.replace("%","") : "";
    const curHeight = style?.height?.endsWith("px") ? style.height.replace("px","") : "";
    const curPadding = style?.padding?.replace("px","") || "";
    const curMargin = style?.margin?.replace("px","") || "";
    const curFloat = style?.float || "none";
    let curAlign = "center";
    if (style) {
      const dl = style.display;
      if (dl === "block" && style.marginLeft === "auto" && style.marginRight === "auto") curAlign = "center";
      else if (dl === "block" && style.marginLeft === "auto") curAlign = "right";
      else curAlign = "left";
    }
    dialog.innerHTML = `<header><span><i class="fa-solid fa-image"></i> ${modeTitle}</span><button type="button" data-action="close"><i class="fa-solid fa-xmark"></i></button></header><main><label>Image URL<input name="url" type="url" placeholder="https://example.com/image.jpg" required autofocus value="${foundry.utils.escapeHTML(curUrl)}"></label><div class="cl-image-grid"><label>Width (%)<input name="width" type="number" min="1" max="100" placeholder="Auto" value="${curWidth}"></label></div><div class="cl-image-grid"><label>Padding (px)<input name="padding" type="number" min="0" max="100" value="${curPadding || 0}"></label><label>Margin (px)<input name="margin" type="number" min="0" max="100" value="${curMargin || 8}"></label></div><label>Alignment<select name="align"><option value="left" ${curAlign === "left" ? "selected" : ""}>Left</option><option value="center" ${curAlign === "center" ? "selected" : ""}>Center</option><option value="right" ${curAlign === "right" ? "selected" : ""}>Right</option></select></label><label>Text float<select name="float"><option value="none" ${curFloat === "none" ? "selected" : ""}>No float</option><option value="left" ${curFloat === "left" ? "selected" : ""}>Float left</option><option value="right" ${curFloat === "right" ? "selected" : ""}>Float right</option></select></label><label><input name="aspect" type="checkbox" ${existing?.dataset?.keepAspect === 'false' ? '' : 'checked'}> Keep aspect ratio while resizing</label><p class="cl-image-note">Select an existing image, then use the image button to edit it. Drag the handle in the bottom-right corner after insertion to resize.</p></main><footer><button type="button" class="cl-image-insert"><i class="fa-solid fa-plus"></i> ${existing ? "Apply" : "Insert Image"}</button></footer>`;
    document.body.append(dialog); dialog.addEventListener("click", e => e.stopPropagation()); dialog.querySelector('[data-action="close"]').addEventListener("click", () => dialog.remove());
    dialog.querySelector(".cl-image-insert").addEventListener("click", () => {
      const get=(n)=>dialog.querySelector(`[name="${n}"]`).value, url=get("url").trim(), padding=Math.max(0,Number(get("padding"))||0), margin=Math.max(0,Number(get("margin"))||0), width=Math.min(100,Math.max(0,Number(get("width").trim()||"0")||0)), align=get("align"), float=get("float"), aspect=dialog.querySelector('[name="aspect"]').checked;
      if (!url) return ui.notifications.warn("Enter an image URL.");
      const safe=foundry.utils.escapeHTML(url); let style=`border:0;padding:${padding}px;margin:${margin}px;max-width:100%;height:${"auto"};width:${width ? `${width}%` : "auto"};`;
      if (float !== "none") style += `float:${float};`; else if (align === "center") style += "display:block;margin-left:auto;margin-right:auto;"; else style += `display:block;margin-${align === "left" ? "right" : "left"}:auto;`;
      if(existing){ existing.style.cssText=style; existing.dataset.keepAspect=String(aspect); const imgNode=existing.querySelector('img'); if(imgNode) imgNode.src=safe; dialog.remove(); return; }
      writing.focus(); executeEditorCommand("insertHTML",`<span class="cl-inline-image" contenteditable="false" data-keep-aspect="${aspect}" style="${style}"><img src="${safe}" alt=""><span class="cl-image-resize" title="Drag to resize"></span></span>`); dialog.remove();
    });
  }
  static openAdvancedTableDialog(writing) {
    const getSelected=()=>({table:writing.querySelector('.cl-selected-table'),row:writing.querySelector('.cl-selected-row'),cell:writing.querySelector('.cl-selected-cell')}); const initial=getSelected(); if(!initial.table&&!initial.row&&!initial.cell)return ui.notifications.warn('Click a table, row, or cell first.');
    document.querySelector('.cl-table-dialog')?.remove();const dialog=document.createElement('section');dialog.className='cl-table-dialog';
    dialog.innerHTML=`<header><span><i class="fa-solid fa-table"></i> Advanced Table Controls</span><button data-action="close"><i class="fa-solid fa-xmark"></i></button></header><main><div class="cl-table-target"><button data-target="table">Select table</button><button data-target="row">Select row</button><button data-target="cell">Select cell</button></div><div class="cl-image-grid"><label>Width (%)<input name="width" type="number" min="1" max="100" value="100"></label><label>Row / cell height (px)<input name="height" type="number" min="0"></label></div><div class="cl-image-grid"><label>Background<input name="bg" type="color" value="#fffdf5"></label><label>Text color<input name="color" type="color" value="#21150d"></label></div><div class="cl-image-grid"><label>Cell padding (px)<input name="padding" type="number" min="0" value="6"></label><label>Table margin (px)<input name="margin" type="number" min="0" value="10"></label></div><div class="cl-image-grid"><label>Border<select name="border"><option value="1px solid #74614a">Solid</option><option value="1px dashed #74614a">Dashed</option><option value="0">None</option></select></label><label>Cell spacing (px)<input name="spacing" type="number" min="0" value="0"></label></div><fieldset class="cl-cell-inspector" disabled><legend><i class="fa-solid fa-table-cells"></i> Selected cell controls</legend><div class="cl-image-grid"><label>Width (%)<input data-cell-control="width" type="number" min="1" max="100"></label><label>Height (px)<input data-cell-control="height" type="number" min="0"></label></div><div class="cl-image-grid"><label>Padding (px)<input data-cell-control="padding" type="number" min="0"></label><label>Text alignment<select data-cell-control="textAlign"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></label></div><div class="cl-image-grid"><label>Vertical alignment<select data-cell-control="verticalAlign"><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label><label>Border<select data-cell-control="border"><option value="1px solid #74614a">Solid</option><option value="1px dashed #74614a">Dashed</option><option value="0">None</option></select></label></div><div class="cl-image-grid"><label>Background<input data-cell-control="backgroundColor" type="color" value="#fffdf5"></label><label>Text colour<input data-cell-control="color" type="color" value="#21150d"></label></div><div class="cl-image-grid"><label>Column span<input data-cell-control="colSpan" type="number" min="1" value="1"></label><label>Row span<input data-cell-control="rowSpan" type="number" min="1" value="1"></label></div></fieldset><p class="cl-image-note">Choose a target mode above, then click a table element in the editor. The Selected cell controls affect only that one cell.</p></main><footer><button data-action="clear">Clear selection</button><button data-action="delete" class="danger">Delete selected</button><button data-action="apply"><i class="fa-solid fa-check"></i> Apply edits</button></footer>`;document.body.append(dialog);
    const selected=()=>{const s=getSelected();return s.cell?{type:'cell',el:s.cell}:s.row?{type:'row',el:s.row}:s.table?{type:'table',el:s.table}:null};const cellInspector=dialog.querySelector('.cl-cell-inspector');const toHex=color=>{const match=String(color||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);return match?`#${[match[1],match[2],match[3]].map(v=>Number(v).toString(16).padStart(2,'0')).join('')}`:color;};const syncCellControls=cell=>{cellInspector.disabled=!cell;if(!cell)return;cellInspector.querySelectorAll('[data-cell-control]').forEach(control=>{const key=control.dataset.cellControl,computed=getComputedStyle(cell);let value=key==='colSpan'?cell.colSpan:key==='rowSpan'?cell.rowSpan:cell.style[key]||computed[key]||'';if(key==='width'){value=cell.style.width.endsWith('%')?cell.style.width.replace('%',''):'';}if(key==='height'||key==='padding')value=String(value).replace(/px$/,'');if(key==='backgroundColor'||key==='color')value=toHex(value);if(!value&&key==='backgroundColor')value='#fffdf5';if(!value&&key==='color')value='#21150d';try{control.value=value;}catch(error){console.warn(`${MODULE_ID} | Could not display cell control value: ${key}`,error);}});};const sync=()=>{const s=selected(),type=s?.type;dialog.querySelectorAll('[data-target]').forEach(b=>b.classList.toggle('active',b.dataset.target===writing.dataset.tableSelectMode));dialog.querySelector('[data-action="apply"]').disabled=!s;dialog.querySelector('[data-action="delete"]').disabled=!s;syncCellControls(type==='cell'?s.el:null);};
    const refreshSelectedCell=()=>window.setTimeout(sync,0);writing.addEventListener('click',refreshSelectedCell);dialog.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>{writing.dataset.tableSelectMode=b.dataset.target;sync();});dialog.querySelectorAll('[data-cell-control]').forEach(control=>control.addEventListener('input',()=>{const cell=selected()?.type==='cell'?selected().el:null;if(!cell)return;const key=control.dataset.cellControl,value=control.value;if(key==='colSpan'||key==='rowSpan')cell[key]=Math.max(1,Number(value)||1);else if(key==='width')cell.style.width=`${Math.min(100,Math.max(1,Number(value)||1))}%`;else if(key==='height'||key==='padding')cell.style[key]=`${Math.max(0,Number(value)||0)}px`;else cell.style[key]=value;}));const clear=()=>{writing.dataset.tableSelectMode='';writing.querySelectorAll('.cl-selected-table,.cl-selected-row,.cl-selected-cell').forEach(e=>e.classList.remove('cl-selected-table','cl-selected-row','cl-selected-cell'));sync();};dialog.querySelector('[data-action="clear"]').onclick=clear;dialog.querySelector('[data-action="close"]').onclick=()=>{writing.removeEventListener('click',refreshSelectedCell);writing.dataset.tableSelectMode='';dialog.remove();};dialog.querySelector('[data-action="delete"]').onclick=()=>{const s=selected();if(s&&confirm(`Delete this ${s.type}?`)){s.el.remove();clear();}};dialog.querySelector('[data-action="apply"]').onclick=()=>{const s=selected();if(!s)return;const q=n=>dialog.querySelector(`[name="${n}"]`).value,el=s.el;if(s.type==='table'){const width=Math.min(100,Math.max(1,Number(q('width'))||100));el.style.setProperty('width',`${width}%`,'important');el.style.maxWidth='100%';el.style.margin=`${q('margin')}px auto`;el.style.backgroundColor=q('bg');el.style.color=q('color');el.style.borderSpacing=`${q('spacing')}px`;el.style.borderCollapse=q('spacing')==='0'?'collapse':'separate';el.style.border=q('border');}if(s.type==='row'){el.style.height=`${q('height')}px`;el.style.backgroundColor=q('bg');el.style.color=q('color');}/* Cell controls apply immediately; Apply edits intentionally leaves selected-cell values untouched. */sync();};sync();
  }

  static openTableDialog(writing) {
    document.querySelector(".cl-table-dialog")?.remove(); const dialog=document.createElement("section"); dialog.className="cl-table-dialog";
    dialog.innerHTML=`<header><span><i class="fa-solid fa-table"></i> Insert Table</span><button data-action="close"><i class="fa-solid fa-xmark"></i></button></header><main>
      <div class="cl-image-grid"><label>Columns<input name="cols" type="number" min="1" max="20" value="3"></label><label>Rows<input name="rows" type="number" min="1" max="50" value="3"></label></div>
      <div class="cl-image-grid"><label>Width<select name="width"><option value="100%">Full width</option><option value="auto">Auto</option><option value="600px">600 px</option><option value="400px">400 px</option></select></label><label>Alignment<select name="align"><option value="left">Left</option><option value="center" selected>Center</option><option value="right">Right</option></select></label></div>
      <div class="cl-image-grid"><label>Table float<select name="float"><option value="none" selected>No float</option><option value="left">Float left</option><option value="right">Float right</option></select></label><label>Border style<select name="border"><option value="1px solid #74614a">Solid</option><option value="1px dashed #74614a">Dashed</option><option value="1px dotted #74614a">Dotted</option><option value="0">None</option></select></label></div>
      <div class="cl-image-grid"><label>Cell padding (px)<input name="padding" type="number" min="0" max="50" value="6"></label><label>Cell height (px)<input name="cellHeight" type="number" min="0" value="20"></label></div><div class="cl-image-grid"><label>Cell spacing (px)<input name="spacing" type="number" min="0" max="30" value="0"></label></div>
      <div class="cl-image-grid"><label>Table background<input name="tableBg" type="color" value="#fff9e9"></label><label>Header background<input name="headerBg" type="color" value="#eadbbd"></label></div>
      <div class="cl-image-grid"><label>Cell background<input name="cellBg" type="color" value="#fffdf5"></label><label>Text color<input name="textColor" type="color" value="#21150d"></label></div>
      <div class="cl-image-grid"><label>Row background 1<input name="rowBg1" type="color" value="#fffdf5"></label><label>Row background 2<input name="rowBg2" type="color" value="#f7efd9"></label></div>
      <label><input name="header" type="checkbox" checked> Include header row</label>
      <label><input name="caption" type="checkbox"> Include caption</label>
      <p class="cl-image-note">After inserting, click inside a cell to edit. Use the new cell tools in the table toolbar to add rows, add cells, set spans, and recolor selected cells or rows.</p>
    </main><footer><button class="cl-table-insert"><i class="fa-solid fa-plus"></i> Insert Table</button></footer>`;
    document.body.append(dialog);dialog.querySelector('[data-action="close"]').onclick=()=>dialog.remove();dialog.querySelector('.cl-table-insert').onclick=()=>{
      const q=n=>dialog.querySelector(`[name="${n}"]`), rows=Math.max(1,+q('rows').value), cols=Math.max(1,+q('cols').value), header=q('header').checked, caption=q('caption').checked, border=q('border').value, padding=Math.max(0,+q('padding').value||0), cellHeight=Math.max(0,+q('cellHeight').value||10), spacing=Math.max(0,+q('spacing').value||0), width=q('width').value, align=q('align').value, fl=q('float').value, tableBg=q('tableBg').value, headerBg=q('headerBg').value, cellBg=q('cellBg').value, rowBg1=q('rowBg1').value, rowBg2=q('rowBg2').value, textColor=q('textColor').value;
      const cell=(tag,text,bg)=>`<${tag} style="border:${border};padding:${padding}px;height:${cellHeight}px;background:${bg};color:${textColor}">${text}</${tag}>`;
      const body=Array.from({length:rows},(_,r)=>`<tr style="background:${r % 2 ? rowBg2 : rowBg1}">${Array.from({length:cols},(_,c)=>cell(header&&r===0?'th':'td',header&&r===0?`Heading ${c+1}`:'',header&&r===0?headerBg:cellBg)).join('')}</tr>`).join('');
      const cap=caption?'<caption style="caption-side:top;padding:6px;font-weight:bold">Table caption</caption>':''; let margin=align==='center'?'10px auto':align==='right'?'10px 0 10px auto':'10px 0'; let style=`width:${width};margin:${margin};border-collapse:${spacing ? 'separate':'collapse'};border-spacing:${spacing}px;background:${tableBg};color:${textColor};`; if (fl!=='none') style+=`float:${fl};`;
      writing.focus();executeEditorCommand('insertHTML',`<table style="${style}">${cap}<tbody>${body}</tbody></table><p></p>`);dialog.remove();};
  }

  static async exportDocument(entry, format) {
    const page=entry?.pages.contents.find(p=>p.type==='text'); if(!page)return;
    const safeName=(entry.name||'cypher-log').replace(/[\\/:*?"<>|]+/g,'-').trim()||'cypher-log';
    const cover=this.cover(entry); const tags=entry.getFlag(MODULE_ID,'tags')||[];
    const source=document.createElement('article'); source.className='cl-reader-content cypher-log-export'; source.innerHTML=`<h1>${foundry.utils.escapeHTML(entry.name)}</h1>${page.text.content||''}${tags.length?`<footer class="cl-reader-tags"><i class="fa-solid fa-tags"></i>${tags.map(t=>`<span>${foundry.utils.escapeHTML(t)}</span>`).join('')}</footer>`:''}`;
    const sandbox=document.createElement('div'); sandbox.className=`cl-export-sandbox cl-theme-${setting('theme')}`; sandbox.append(source); document.body.append(sandbox);
    const props=['display','float','clear','position','box-sizing','width','height','max-width','min-width','margin','margin-top','margin-right','margin-bottom','margin-left','padding','padding-top','padding-right','padding-bottom','padding-left','border','border-radius','background','background-color','background-image','background-size','background-position','color','font','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration','text-indent','vertical-align','list-style','border-collapse','border-spacing','table-layout','white-space','word-break','overflow','object-fit','object-position','break-inside','page-break-inside'];
    source.querySelectorAll('*').forEach(node=>{const computed=getComputedStyle(node); const inline=props.map(prop=>`${prop}:${computed.getPropertyValue(prop)}!important`).join(';'); node.setAttribute('style',`${node.getAttribute('style')||''};${inline}`); node.removeAttribute('contenteditable'); node.classList.remove('cl-selected-table','cl-selected-row','cl-selected-cell','is-selected');});
    const body=source.outerHTML; sandbox.remove();
    const style=`@page{size:auto;margin:15mm 14mm 18mm}*{box-sizing:border-box}html{background:#fff}body{max-width:900px;margin:0 auto;padding:48px;background:#fffdf6;color:#261b14;font:18px/1.6 Georgia,serif;background-image:linear-gradient(#fffdf6e8,#f0dfb8e8)${cover?`,url('${cover.replace(/'/g,"%27")}')`:''};background-size:auto,cover;background-attachment:fixed}.cypher-log-export{max-width:72ch;margin:auto}.cypher-log-export h1{margin:0 0 1.2em;font-family:var(--font-header,Georgia,serif);font-size:2em;color:#392519}.cypher-log-export img{max-width:100%;height:auto}.cypher-log-export table{max-width:100%;break-inside:avoid}.cypher-log-export tr,.cypher-log-export img,.cypher-log-export h1,.cypher-log-export h2,.cypher-log-export h3{break-inside:avoid;page-break-inside:avoid}.cl-inline-image{break-inside:avoid;page-break-inside:avoid}.cl-image-resize{display:none!important}.cl-reader-tags{display:flex;gap:6px;flex-wrap:wrap;margin:24px auto 0;padding-top:14px;border-top:1px solid #d7bd85;color:#6d5232;font:12px sans-serif}.cl-reader-tags span{padding:2px 8px;border:1px solid #b7cdb7;border-radius:999px;background:#e8f1e7;color:#35613d}@media print{html,body{width:auto;max-width:none;background:#fff!important}body{padding:0}.cypher-log-export{max-width:none}a{color:inherit;text-decoration:underline}img{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`;
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${foundry.utils.escapeHTML(entry.name)}</title><style>${style}</style></head><body>${body}</body></html>`;
    if(format==='pdf'){
      document.querySelector('.cl-export-print-view')?.remove(); const printView=document.createElement('section'); printView.className='cl-export-print-view'; printView.innerHTML=`<header><strong><i class="fa-solid fa-file-pdf"></i> ${foundry.utils.escapeHTML(entry.name)}</strong><div><button type="button" data-action="print"><i class="fa-solid fa-print"></i> Print / Save PDF</button><button type="button" data-action="download"><i class="fa-solid fa-download"></i> Download print HTML</button><button type="button" data-action="close"><i class="fa-solid fa-xmark"></i></button></div></header><main>${body}</main>`; document.body.append(printView);
      printView.querySelector('[data-action="close"]').onclick=()=>printView.remove();
      printView.querySelector('[data-action="print"]').onclick=async()=>{await Promise.all([...printView.querySelectorAll('img')].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve;}))); window.print();};
      printView.querySelector('[data-action="download"]').onclick=()=>foundry.utils.saveDataToFile(html,'text/html;charset=utf-8',`${safeName}-print.html`); return;
    }
    if(format==='word'){const word=`<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${foundry.utils.escapeHTML(entry.name)}</title><style>${style}</style></head><body>${body}</body></html>`; return foundry.utils.saveDataToFile(word,'application/msword;charset=utf-8',`${safeName}.doc`);}
    return foundry.utils.saveDataToFile(html,'text/html;charset=utf-8',`${safeName}.html`);
  }
  static openExportMenu(entry, anchor) {
    document.querySelector('.cl-export-menu')?.remove(); const menu=document.createElement('div'); menu.className='cl-export-menu';
    menu.innerHTML=`<button type="button" data-format="pdf"><i class="fa-solid fa-file-pdf"></i> Precise PDF / Print</button><button type="button" data-format="word"><i class="fa-solid fa-file-word"></i> Download Word</button><button type="button" data-format="html"><i class="fa-solid fa-file-code"></i> Download styled HTML</button>`;
    document.body.append(menu); const rect=anchor.getBoundingClientRect(); menu.style.left=`${Math.max(8,rect.right-menu.offsetWidth)}px`; menu.style.top=`${rect.bottom+4}px`;
    menu.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>{this.exportDocument(entry,button.dataset.format);menu.remove();}));
    setTimeout(()=>document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target)&&event.target!==anchor)menu.remove();},{once:true}),0);
  }
  static openReader(entry) {
    const page=entry?.pages.contents.find(p=>p.type==='text'); if(!entry||!page)return;
    const win=document.createElement('section');win.className=`cl-reader-window cl-theme-${setting("theme")}`;
    const saved={x:setting("readerX"),y:setting("readerY"),w:setting("readerW"),h:setting("readerH")},scale=.8,maxWidth=Math.floor((window.innerWidth-32)/scale),maxHeight=Math.floor((window.innerHeight-32)/scale),width=Math.min(maxWidth,saved.w>0?saved.w:Math.round(window.innerWidth*.56)),height=Math.min(maxHeight,saved.h>0?saved.h:Math.round(window.innerHeight*.624));
    const existingReaders = document.querySelectorAll('.cl-reader-window');
    const offset = existingReaders.length * 30;
    const left=Math.max(16,Math.min(window.innerWidth-width*scale-16,(saved.x>=0?saved.x:Math.round((window.innerWidth-width*scale)/2))+offset)),top=Math.max(16,Math.min(window.innerHeight-height*scale-16,(saved.y>=0?saved.y:Math.round((window.innerHeight-height*scale)/2))+offset));
    const cover=this.cover(entry); const coverVar=cover ? `--cl-reader-cover:url('${encodeURI(cover).replace(/'/g, "%27")}');` : ''; win.style.cssText=`left:${left}px;top:${top}px;width:${width}px;height:${height}px;${coverVar}`;
    const tags=entry.getFlag(MODULE_ID,'tags')||[];
    const linkedContent = (page.text.content || '').replace(/\[Log:\s*([^\]]+)\]/g, '<a class="cl-log-link" data-log="$1">$1</a>');
    win.innerHTML=`<header class="cl-reader-header"><span><i class="fa-solid fa-book-open"></i> ${foundry.utils.escapeHTML(entry.name)}</span><div><button type="button" class="cl-reader-edit" title="Edit log"><i class="fa-solid fa-pen"></i><span>Edit</span></button><button type="button" class="cl-reader-export" title="Export document"><i class="fa-solid fa-file-export"></i></button><button type="button" data-action="close" title="Close"><i class="fa-solid fa-xmark"></i></button></div></header><main><article class="cl-reader-content"><h1>${foundry.utils.escapeHTML(entry.name)}</h1>${linkedContent}</article>${tags.length?`<footer class="cl-reader-tags"><i class="fa-solid fa-tags"></i>${tags.map(t=>`<span>${foundry.utils.escapeHTML(t)}</span>`).join('')}</footer>`:''}</main><div class="cl-reader-resize" title="Resize"></div>`;
    document.body.append(win); win.addEventListener("click", e => e.stopPropagation());
    win.querySelectorAll('.cl-log-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetName = link.dataset.log.trim();
        const target = CypherLog.entries().find(e => e.name === targetName);
        if (target) CypherLog.openReader(target);
        else ui.notifications.warn(`Log "${targetName}" not found.`);
      });
    });
    const readerMain=win.querySelector('main');
    const saveReaderBounds=()=>{game.settings.set(MODULE_ID,SETTINGS.readerX,win.offsetLeft);game.settings.set(MODULE_ID,SETTINGS.readerY,win.offsetTop);game.settings.set(MODULE_ID,SETTINGS.readerW,win.offsetWidth);game.settings.set(MODULE_ID,SETTINGS.readerH,win.offsetHeight);};
    const chapters=[...win.querySelectorAll('.cl-reader-content span.cl-chapter[data-chapter="true"]')];
    let strip=null;
    const positionStrip=()=>{ if(!strip) return; const rect=win.getBoundingClientRect(); strip.style.left=`${rect.right}px`; strip.style.top=`${rect.top+42}px`; strip.style.zIndex=String((Number.parseInt(getComputedStyle(win).zIndex||'100002',10)||100002)+1); };
    if(chapters.length){
      strip=document.createElement('div'); strip.className='cl-reader-strip';
      chapters.forEach((chapter,index)=>{ chapter.id ||= `cl-reader-chapter-${index}`; const tab=document.createElement('div'); tab.className='cl-reader-stub'; tab.dataset.chapterId=chapter.id; tab.title=chapter.textContent.trim()||`Chapter ${index+1}`; tab.innerHTML=`<span class="cl-reader-stub-label">${foundry.utils.escapeHTML(chapter.textContent.trim()||`CHAPTER ${index+1}`)}</span>`; tab.addEventListener('click',()=>{ readerMain.scrollTo({top:Math.max(0,chapter.offsetTop-readerMain.offsetTop-24),behavior:'smooth'}); strip.querySelectorAll('.cl-reader-stub').forEach(s=>s.classList.remove('is-active')); tab.classList.add('is-active'); }); strip.append(tab); });
      document.body.append(strip); positionStrip(); strip.querySelector('.cl-reader-stub')?.classList.add('is-active');
      readerMain.addEventListener('scroll',()=>{ let active=chapters[0]; for(const chapter of chapters){ if(chapter.offsetTop-readerMain.offsetTop<=readerMain.scrollTop+40) active=chapter; } const activeId=active?.id; strip.querySelectorAll('.cl-reader-stub').forEach(stub=>stub.classList.toggle('is-active',stub.dataset.chapterId===activeId)); },{passive:true});
    }
    const closeReader=()=>{ strip?.remove(); win.remove(); };
    win.querySelector('[data-action="close"]').onclick=()=>closeReader();
    win.querySelector('.cl-reader-edit').onclick=()=>{ closeReader(); this.openEditor(entry); };
    win.querySelector('.cl-reader-export').onclick=event=>this.openExportMenu(entry,event.currentTarget);
    const readerHeader=win.querySelector('.cl-reader-header');
    readerHeader.addEventListener('pointerdown',e=>{ if(e.target.closest('button'))return; e.preventDefault(); const rect=win.getBoundingClientRect(),startX=e.clientX,startY=e.clientY,startLeft=win.offsetLeft,startTop=win.offsetTop,sx=rect.width/win.offsetWidth,sy=rect.height/win.offsetHeight; readerHeader.setPointerCapture?.(e.pointerId); const drag=ev=>{ win.style.left=`${Math.max(16,Math.min(window.innerWidth-rect.width-16,startLeft+(ev.clientX-startX)/sx))}px`; win.style.top=`${Math.max(16,Math.min(window.innerHeight-rect.height-16,startTop+(ev.clientY-startY)/sy))}px`; positionStrip(); }; const stop=()=>{ readerHeader.releasePointerCapture?.(e.pointerId); window.removeEventListener('pointermove',drag); window.removeEventListener('pointerup',stop); saveReaderBounds(); }; window.addEventListener('pointermove',drag); window.addEventListener('pointerup',stop); });
    const handle=win.querySelector('.cl-reader-resize');
    handle.addEventListener('pointerdown',e=>{ e.preventDefault(); const rect=win.getBoundingClientRect(),sw=win.offsetWidth,sh=win.offsetHeight,sx=rect.width/sw,sy=rect.height/sh,x=e.clientX,y=e.clientY; handle.setPointerCapture?.(e.pointerId); const resize=ev=>{ win.style.width=`${Math.max(420,Math.min((window.innerWidth-rect.left-16)/sx,(rect.width+ev.clientX-x)/sx))}px`; win.style.height=`${Math.max(300,Math.min((window.innerHeight-rect.top-16)/sy,(rect.height+ev.clientY-y)/sy))}px`; positionStrip(); }; const stop=()=>{ handle.releasePointerCapture?.(e.pointerId); window.removeEventListener('pointermove',resize); window.removeEventListener('pointerup',stop); saveReaderBounds(); }; window.addEventListener('pointermove',resize); window.addEventListener('pointerup',stop); });
  }
  static openTemplatePicker() {
    const dialog = document.createElement("section");
    dialog.className = `cl-editor-window cl-theme-${setting("theme")} cl-template-picker`;
    dialog.style.cssText = `left:50%;top:50%;transform:translate(-50%,-50%);width:420px;height:auto;max-height:80vh;`;
    const templateCards = TEMPLATES.map(t => `
      <button type="button" class="cl-template-card" data-template="${t.id}">
        <i class="fa-solid ${t.icon}"></i>
        <span class="cl-template-name">${t.name}</span>
        <span class="cl-template-desc">${t.title || "Blank document"}</span>
      </button>
    `).join('');
    dialog.innerHTML = `<header class="cl-editor-header"><span><i class="fa-solid fa-layer-group"></i> Choose Template</span><button type="button" data-action="close"><i class="fa-solid fa-xmark"></i></button></header>
    <main class="cl-template-grid">${templateCards}</main>`;
    document.body.append(dialog); dialog.addEventListener("click", e => e.stopPropagation());
    dialog.querySelector('[data-action="close"]').addEventListener("click", () => dialog.remove());
    dialog.querySelectorAll('.cl-template-card').forEach(card => {
      card.addEventListener('click', () => {
        const template = TEMPLATES.find(t => t.id === card.dataset.template);
        dialog.remove();
        this.openEditor(null, template);
      });
    });
  }

  static openEditor(entry=null, template=null) {
    let page = entry?.pages.contents.find(p => p.type === "text"); const editable = entry ? entry.isOwner : game.user.can("JOURNAL_CREATE");
    const dialog = document.createElement("section"); dialog.className = `cl-editor-window cl-theme-${setting("theme")}`;
    const saved = {x: setting("editorX"), y: setting("editorY"), w: setting("editorW"), h: setting("editorH")};
    const width = saved.w > 0 ? saved.w : Math.round(window.innerWidth * .56), height = saved.h > 0 ? saved.h : Math.round(window.innerHeight * .624);
    const left = saved.x >= 0 ? saved.x : Math.round((window.innerWidth - width) / 2), top = saved.y >= 0 ? saved.y : Math.round((window.innerHeight - height) / 2);
    dialog.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
    const entryFolder = entry ? getFolder(entry) : (template?.folder || "");
    const folders = getFolders();
    const folderOptions = folders.map(f => `<option value="${foundry.utils.escapeHTML(f)}" ${f === entryFolder ? 'selected' : ''}>${foundry.utils.escapeHTML(f)}</option>`).join('');
    dialog.innerHTML = `<header class="cl-editor-header"><span><i class="fa-solid fa-pen-nib"></i> ${entry ? "Edit log" : "New log"}</span><button type="button" data-action="close"><i class="fa-solid fa-xmark"></i></button></header><main>
      <section class="cl-document-meta"><input class="cl-title" type="text" value="${foundry.utils.escapeHTML(entry?.name ?? template?.title ?? "Untitled Log")}" ${editable ? "" : "disabled"} aria-label="Document title"><label class="cl-cover-url"><i class="fa-solid fa-image"></i><input type="url" value="${foundry.utils.escapeHTML(entry?.getFlag(MODULE_ID, "cover") ?? "")}" placeholder="Cover image URL (optional)" ${editable ? "" : "disabled"} aria-label="Cover image URL"></label><label class="cl-folder-select"><i class="fa-solid fa-folder-open"></i><select ${editable ? "" : "disabled"} aria-label="Folder"><option value="">No folder</option>${folderOptions}</select></label><label class="cl-shared-check" title="Visible to all players"><input type="checkbox" name="shared" ${entry?.getFlag(MODULE_ID, "shared") ? 'checked' : ''} ${editable ? '' : 'disabled'}><i class="fa-solid fa-users"></i> Shared with players</label></section>
      <nav class="cl-menubar" aria-label="Editor menus"><div class="cl-menu-row"><button data-menu="file">File <i class="fa-solid fa-caret-down"></i></button><button data-menu="edit">Edit <i class="fa-solid fa-caret-down"></i></button><button data-menu="insert">Insert <i class="fa-solid fa-caret-down"></i></button><button data-menu="view">View <i class="fa-solid fa-caret-down"></i></button><button data-menu="format">Format <i class="fa-solid fa-caret-down"></i></button><button data-menu="table">Table <i class="fa-solid fa-caret-down"></i></button><button data-menu="tools">Tools <i class="fa-solid fa-caret-down"></i></button></div><div class="cl-menu-panels"><div data-panel="file"><button data-editor-action="save">Save</button><button data-editor-action="close">Close</button></div><div data-panel="edit"><button data-command="undo">Undo</button><button data-command="redo">Redo</button><button data-command="selectAll">Select all</button><button data-command="removeFormat">Clear formatting</button></div><div data-panel="insert"><button data-command="createLink">Link</button><button data-command="insertImage">Image</button><button data-command="insertTable">Table</button><button data-command="insertHorizontalRule">Horizontal line</button></div><div data-panel="view"><button data-editor-action="focus">Focus writing area</button></div><div data-panel="format"><button data-command="formatBlock" data-value="h1">Heading 1</button><button data-command="formatBlock" data-value="h2">Heading 2</button><button data-command="formatBlock" data-value="p">Paragraph</button><button data-command="formatBlock" data-value="blockquote">Quote</button><button data-command="formatBlock" data-value="pre">Code block</button><button data-command="bold">Bold</button><button data-command="italic">Italic</button><button data-command="underline">Underline</button><button type="button" data-editor-action="uppercase">CAPITALISE</button><button type="button" data-editor-action="sentenceCase">First letter caps</button></div><div data-panel="table"><button data-command="insertTable">Insert table</button><button data-table-action="editTable">Edit table settings</button><button data-table-action="deleteTable">Delete table</button><hr><button data-table-action="addRowAbove">Add row above</button><button data-table-action="addRowBelow">Add row below</button><button data-table-action="addCellBefore">Add cell before</button><button data-table-action="addCellAfter">Add cell after</button><button data-table-action="deleteRow">Delete row</button><button data-table-action="deleteCell">Delete cell</button><button data-table-action="colSpan">Column span</button><button data-table-action="rowSpan">Row span</button><button data-table-action="cellBg">Cell colour</button><button data-table-action="rowBg">Row colour</button></div><div data-panel="tools"><button data-editor-action="date">Insert date</button><button data-editor-action="time">Insert time</button><button data-editor-action="datetime">Insert date & time</button></div></div></nav><div class="cl-game-date-tools"><button type="button" class="cl-game-date-button" data-calendaria-toggle title="Calendaria game date"><i class="fa-solid fa-calendar-day"></i> Game date</button><div class="cl-game-date-popover" role="menu"><button type="button" data-calendaria-action="date"><i class="fa-solid fa-calendar-plus"></i> Insert game date</button><button type="button" data-calendaria-action="time"><i class="fa-solid fa-clock"></i> Insert game time</button></div></div><nav class="cl-toolbar" aria-label="Document formatting"><div class="cl-tool-group"><button type="button" data-command="undo" title="Undo"><i class="fa-solid fa-rotate-left"></i></button><button type="button" data-command="redo" title="Redo"><i class="fa-solid fa-rotate-right"></i></button></div><div class="cl-tool-group"><select data-command="formatBlock" title="Paragraph style"><option value="p">Normal</option><option value="h1">Title</option><option value="h2">Heading 1</option><option value="h3">Heading 2</option><option value="h4">Heading 3</option><option value="blockquote">Quote</option><option value="pre">Code block</option></select></div><div class="cl-tool-group cl-heading-tools" aria-label="Heading controls"><button type="button" data-heading-chapter title="Mark chapter">CHAPTER</button><button type="button" data-heading-level="h1" title="Apply Heading 1">H1</button><button type="button" data-heading-level="h2" title="Apply Heading 2">H2</button><button type="button" data-heading-level="h3" title="Apply Heading 3">H3</button></div><div class="cl-tool-group"><select data-command="fontName" title="Font family"><option>Arial</option><option>Georgia</option><option>Tahoma</option><option>Times New Roman</option><option>Trebuchet MS</option><option>Verdana</option><option value="Roboto">Roboto (Google)</option><option value="Lora">Lora (Google)</option><option value="Montserrat">Montserrat (Google)</option><option value="Merriweather">Merriweather (Google)</option><option value="Playfair Display">Playfair Display (Google)</option><option value="Cinzel">Cinzel (Google)</option><option value="Bebas Neue">Bebas Neue (Google)</option><option value="Caveat">Caveat (Google)</option><option value="Cormorant Garamond">Cormorant Garamond (Google)</option><option value="Crimson Text">Crimson Text (Google)</option><option value="DM Sans">DM Sans (Google)</option><option value="EB Garamond">EB Garamond (Google)</option><option value="Fira Sans">Fira Sans (Google)</option><option value="IM Fell English">IM Fell English (Google)</option><option value="Libre Baskerville">Libre Baskerville (Google)</option><option value="MedievalSharp">MedievalSharp (Google)</option><option value="Nunito">Nunito (Google)</option><option value="Oswald">Oswald (Google)</option><option value="Pacifico">Pacifico (Google)</option><option value="Patrick Hand">Patrick Hand (Google)</option><option value="Source Sans 3">Source Sans 3 (Google)</option><option value="Space Grotesk">Space Grotesk (Google)</option><option value="Special Elite">Special Elite (Google)</option></select><select data-command="fontSize" title="Font size"><option value="1">8</option><option value="2">10</option><option value="3" selected>12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">36</option></select></div><div class="cl-tool-group"><button type="button" data-command="bold" title="Bold"><b>B</b></button><button type="button" data-command="italic" title="Italic"><i>I</i></button><button type="button" data-command="underline" title="Underline"><u>U</u></button><button type="button" data-command="strikeThrough" title="Strikethrough"><s>S</s></button><input class="cl-color" data-command="foreColor" type="color" value="#21150d" title="Text colour"><input class="cl-color" data-command="hiliteColor" type="color" value="#fff9e9" title="Highlight colour"></div><div class="cl-tool-group"><button type="button" data-command="justifyLeft" title="Align left"><i class="fa-solid fa-align-left"></i></button><button type="button" data-command="justifyCenter" title="Center"><i class="fa-solid fa-align-center"></i></button><button type="button" data-command="justifyRight" title="Align right"><i class="fa-solid fa-align-right"></i></button><button type="button" data-command="justifyFull" title="Justify"><i class="fa-solid fa-align-justify"></i></button></div><div class="cl-tool-group"><button type="button" data-command="insertUnorderedList" title="Bullets"><i class="fa-solid fa-list-ul"></i></button><button type="button" data-command="insertOrderedList" title="Numbered list"><i class="fa-solid fa-list-ol"></i></button><button type="button" data-command="outdent" title="Decrease indent"><i class="fa-solid fa-outdent"></i></button><button type="button" data-command="indent" title="Increase indent"><i class="fa-solid fa-indent"></i></button></div><div class="cl-tool-group"><button type="button" data-command="insertImage" title="Insert image"><i class="fa-solid fa-image"></i></button><button type="button" class="cl-insert-table-button" data-command="insertTable" title="Insert table"><i class="fa-solid fa-table"></i></button><button type="button" class="cl-advanced-table-button" data-editor-action="tableMenu" title="Advanced table controls" aria-label="Advanced table controls"><i class="fa-solid fa-sliders"></i></button><button type="button" data-command="insertHorizontalRule" title="Horizontal line"><i class="fa-solid fa-minus"></i></button><button type="button" data-command="removeFormat" title="Clear formatting"><i class="fa-solid fa-eraser"></i></button></div></div></nav><article class="cl-writing" contenteditable="${editable}" spellcheck="true">${page?.text.content ?? template?.content ?? "<p>Begin your record…</p>"}</article><section class="cl-tags" aria-label="Log tags"><label for="cl-log-tags"><i class="fa-solid fa-tags"></i> Tags</label><input id="cl-log-tags" class="cl-tag-input" type="text" value="${foundry.utils.escapeHTML((entry?.getFlag(MODULE_ID, "tags") ?? template?.tags ?? []).join(", "))}" placeholder="Add tags separated by commas" ${editable ? "" : "disabled"} autocomplete="off"><div class="cl-tag-suggestions" aria-label="Most used tags"></div></section></main><div class="cl-resize-handle" title="Resize"></div><footer>${editable ? '<button type="button" class="cl-save"><i class="fa-solid fa-floppy-disk"></i> Save Log</button>' : '<span class="cl-readonly"><i class="fa-solid fa-lock"></i> Read-only</span>'}</footer>`;
    document.body.append(dialog); dialog.addEventListener('click', e => e.stopPropagation()); dialog.addEventListener('keydown', e => { if (e.target.closest('.cl-writing') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) e.stopPropagation(); }); const writing = dialog.querySelector(".cl-writing");
    const clearSelectedImages=()=>writing.querySelectorAll('.cl-inline-image.is-selected').forEach(el=>el.classList.remove('is-selected'));
    writing.addEventListener('click', event=>{ const host=event.target.closest?.('.cl-inline-image'); clearSelectedImages(); if(host) host.classList.add('is-selected'); });
    writing.addEventListener('contextmenu', event=>{ const host=event.target.closest?.('.cl-inline-image'); if(!host)return; event.preventDefault(); event.stopPropagation(); clearSelectedImages(); host.classList.add('is-selected'); CypherLog.openImageDialog(writing,host); });
    dialog.querySelectorAll('[data-heading-level]').forEach(button=>button.addEventListener('mousedown',event=>{event.preventDefault();writing.focus();const tag=button.dataset.headingLevel;if(!['h1','h2','h3'].includes(tag))return;executeEditorCommand('formatBlock',`<${tag}>`);}));
    dialog.querySelector('[data-heading-chapter]')?.addEventListener('mousedown',event=>{event.preventDefault();writing.focus();const sel=window.getSelection();if(!sel||sel.rangeCount===0)return;const range=sel.getRangeAt(0);const marker=document.createElement('span');marker.className='cl-chapter';marker.dataset.chapter='true';marker.textContent=range.toString()||'Chapter';range.deleteContents();range.insertNode(marker);sel.removeAllRanges();const newRange=document.createRange();newRange.selectNodeContents(marker);sel.addRange(newRange);});
    const tagInput=dialog.querySelector('.cl-tag-input'),tagSuggestions=dialog.querySelector('.cl-tag-suggestions');
    const normalizeTags=value=>[...new Set(String(value||'').split(',').map(t=>t.trim().replace(/\s+/g,' ')).filter(Boolean))];
    const popularTags=()=>{const counts=new Map();this.entries().forEach(log=>(log.getFlag(MODULE_ID,'tags')||[]).forEach(t=>{t=String(t).trim();if(t)counts.set(t,(counts.get(t)||0)+1)}));return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5)};
    const renderTagSuggestions=()=>{const current=normalizeTags(tagInput?.value).map(t=>t.toLowerCase()),tags=popularTags().filter(([t])=>!current.includes(t.toLowerCase()));tagSuggestions.innerHTML=tags.length?`<span class="cl-tags-label">Most used:</span>${tags.map(([t,n])=>`<button type="button" class="cl-tag-chip" data-tag="${foundry.utils.escapeHTML(t)}" title="Used ${n} times">${foundry.utils.escapeHTML(t)}</button>`).join('')}`:'<span class="cl-tags-label">No saved tags yet</span>';tagSuggestions.querySelectorAll('.cl-tag-chip').forEach(b=>b.onclick=()=>{const tags=normalizeTags(tagInput.value);if(!tags.some(t=>t.toLowerCase()===b.dataset.tag.toLowerCase()))tags.push(b.dataset.tag);tagInput.value=tags.join(', ');renderTagSuggestions();tagInput.focus()})};tagInput?.addEventListener('input',renderTagSuggestions);renderTagSuggestions();
    const coverInput = dialog.querySelector(".cl-cover-url input");
    const updateCoverBackground = () => { const url = coverInput.value.trim(); writing.style.setProperty("--cl-cover-image", url ? `url("${url.replaceAll('"', '\\"')}")` : "none"); };
    updateCoverBackground(); coverInput.addEventListener("input", updateCoverBackground);
    dialog.querySelector('[data-action="close"]').addEventListener("click", () => dialog.remove());
    writing.addEventListener("pointerdown", event => { if (!editable || event.button !== 0) return; const handle=event.target.closest(".cl-image-resize"); if (!handle) return; event.preventDefault(); const box=handle.closest(".cl-inline-image"), rect=box.getBoundingClientRect(), sx=event.clientX, sy=event.clientY, img=box.querySelector("img"), ratio=(img?.naturalWidth && img?.naturalHeight ? img.naturalWidth / img.naturalHeight : rect.width / rect.height), keep=box.dataset.keepAspect !== "false"; const move=e=>{const width=Math.max(40,rect.width+e.clientX-sx); box.style.width=`${width}px`; box.style.height=keep ? `${Math.max(40,width/ratio)}px` : `${Math.max(40,rect.height+e.clientY-sy)}px`;}; const stop=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",stop);};window.addEventListener("pointermove",move);window.addEventListener("pointerup",stop); });
    const persistBounds = () => Promise.all([["editorX", dialog.offsetLeft], ["editorY", dialog.offsetTop], ["editorW", dialog.offsetWidth], ["editorH", dialog.offsetHeight]].map(([key, value]) => game.settings.set(MODULE_ID, SETTINGS[key], value)));
    const move = (event, mode) => { event.preventDefault(); event.stopPropagation(); const rect=dialog.getBoundingClientRect(), startX=event.clientX, startY=event.clientY, startLeft=dialog.offsetLeft, startTop=dialog.offsetTop, startWidth=dialog.offsetWidth, startHeight=dialog.offsetHeight, scaleX=rect.width/startWidth, scaleY=rect.height/startHeight; dialog.setPointerCapture?.(event.pointerId); const update=e=>{const dx=(e.clientX-startX)/scaleX,dy=(e.clientY-startY)/scaleY;if(mode==="drag"){dialog.style.left=`${Math.max(0,startLeft+dx)}px`;dialog.style.top=`${Math.max(0,startTop+dy)}px`;}else{const maxWidth=(window.innerWidth-rect.left)/scaleX,maxHeight=(window.innerHeight-rect.top)/scaleY;dialog.style.width=`${Math.max(420,Math.min(maxWidth,startWidth+dx))}px`;dialog.style.height=`${Math.max(300,Math.min(maxHeight,startHeight+dy))}px`;}}; const stop=()=>{dialog.releasePointerCapture?.(event.pointerId);window.removeEventListener("pointermove",update);window.removeEventListener("pointerup",stop);window.removeEventListener("pointercancel",stop);persistBounds();};window.addEventListener("pointermove",update);window.addEventListener("pointerup",stop);window.addEventListener("pointercancel",stop);};
    dialog.querySelector(".cl-editor-header").addEventListener("pointerdown", e => { if (!e.target.closest("button")) move(e, "drag"); }); dialog.querySelector(".cl-resize-handle").addEventListener("pointerdown", e => move(e, "resize"));
    const transformSelection = mode => {
      writing.focus();
      const selection = window.getSelection();
      if (!selection?.rangeCount || selection.isCollapsed || !writing.contains(selection.anchorNode)) { ui.notifications.warn("Select text in the document first."); return; }
      const selectedText = selection.toString();
      const transformed = mode === "uppercase" ? selectedText.toLocaleUpperCase() : `${selectedText.charAt(0).toLocaleUpperCase()}${selectedText.slice(1)}`;
      if (transformed !== selectedText) executeEditorCommand("insertText", transformed);
    };
    dialog.querySelectorAll('[data-editor-action="uppercase"]').forEach(button => button.addEventListener("click", () => transformSelection("uppercase")));
    dialog.querySelectorAll('[data-editor-action="sentenceCase"]').forEach(button => button.addEventListener("click", () => transformSelection("sentenceCase")));
    dialog.querySelectorAll("[data-command]").forEach(control => control.addEventListener(control.tagName === "SELECT" || control.type === "color" ? "change" : "click", () => { writing.focus(); const command=control.dataset.command; let value=control.dataset.value || control.value || null; if (command === "createLink") value=window.prompt("Link URL"); if (command === "insertImage") { this.openImageDialog(writing); return; } if (command === "insertTable") { this.openTableDialog(writing); return; } if (command === "formatBlock" && value) { const tag=String(value).replace(/[<>]/g,""); value=["p","h1","h2","h3","h4","blockquote","pre"].includes(tag)?`<${tag}>`:"<p>"; } if (command !== "createLink" && command !== "insertImage" || value) executeEditorCommand(command,value); }));
    const closeMenus=()=>dialog.querySelectorAll('.cl-menu-panels>div.is-open').forEach(x=>x.classList.remove('is-open'));
    dialog.querySelectorAll('[data-menu]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();const panel=dialog.querySelector(`[data-panel="${button.dataset.menu}"]`),open=panel.classList.contains('is-open');closeMenus();if(!open)panel.classList.add('is-open');}));
    dialog.addEventListener('click',event=>{if(!event.target.closest('.cl-menubar'))closeMenus();});
    const calendariaPopover=dialog.querySelector('.cl-game-date-popover'),calendariaToggle=dialog.querySelector('[data-calendaria-toggle]');calendariaToggle?.addEventListener('click',e=>{e.stopPropagation();calendariaPopover.classList.toggle('is-open');});dialog.addEventListener('click',e=>{if(!e.target.closest('.cl-game-date-tools'))calendariaPopover?.classList.remove('is-open');});dialog.querySelectorAll('[data-calendaria-action]').forEach(button=>button.addEventListener('click',()=>{const api=globalThis.CALENDARIA?.api;if(!api)return ui.notifications.warn('Calendaria is not active or its API is unavailable.');try{const now=api.getCurrentDateTime?.(),zone=api.getActiveZone?.(),weatherData=api.getCurrentWeather?.(zone?.id??zone),formatted=api.formatDate?.(now,'dateLong'),date=typeof formatted==='string'?formatted:(formatted?.formatted||formatted?.date||''),hour=String(now?.hour??0).padStart(2,'0'),minute=String(now?.minute??0).padStart(2,'0'),rawWeather=typeof weatherData==='string'?weatherData:(weatherData?.label||weatherData?.name||weatherData?.description||weatherData?.current?.label||''),weather=String(rawWeather).replace(/^CALENDARIA\.Common\./,'').replace(/([a-z])([A-Z])/g,'$1 $2');if(!date)return ui.notifications.warn('Calendaria did not return a current game date.');writing.focus();const heading=`<h3 class="cl-game-date-subtitle"><i class="fa-solid fa-calendar-day"></i> ${foundry.utils.escapeHTML(date)} · ${hour}:${minute}${weather?` <span class="cl-game-weather"><i class="fa-solid fa-cloud-sun"></i> ${foundry.utils.escapeHTML(weather)}</span>`:''}</h3>`;executeEditorCommand('insertHTML',button.dataset.calendariaAction==='time'?`<em>${hour}:${minute}</em>`:heading);calendariaPopover.classList.remove('is-open');}catch(error){console.error(`${MODULE_ID} | Calendaria error`,error);ui.notifications.error('Could not read Calendaria game data.');}}));
    dialog.querySelectorAll('[data-editor-action]').forEach(button=>button.addEventListener('click',()=>{const a=button.dataset.editorAction;closeMenus();if(a==='save')return dialog.querySelector('.cl-save')?.click();if(a==='close'){ clearAutosave(); return dialog.remove(); }if(a==='tableMenu')return this.openAdvancedTableDialog(writing);writing.focus();const d=new Date();if(a==='date')executeEditorCommand('insertText',d.toLocaleDateString());if(a==='time')executeEditorCommand('insertText',d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));if(a==='datetime')executeEditorCommand('insertText',`${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`);}));
    writing.addEventListener('click',event=>{const cell=event.target.closest('td,th'),table=cell?.closest('table')||event.target.closest('table');const clear=()=>writing.querySelectorAll('.cl-selected-table,.cl-selected-row,.cl-selected-cell').forEach(el=>el.classList.remove('cl-selected-table','cl-selected-row','cl-selected-cell'));if(!table){clear();writing.dataset.tableSelectMode='';return;}const mode=writing.dataset.tableSelectMode||(event.ctrlKey||event.metaKey?'table':event.altKey?'row':'cell');clear();const selected=mode==='table'?table:mode==='row'?(cell?.parentElement||table):cell||table;selected.classList.add(`cl-selected-${mode}`);writing.dataset.tableSelectMode=mode;});
    dialog.querySelectorAll('[data-table-action]').forEach(control => control.addEventListener('click', () => {
      const action=control.dataset.tableAction,sel=window.getSelection(); const markedCell=writing.querySelector('.cl-selected-cell'),markedRow=writing.querySelector('.cl-selected-row'),markedTable=writing.querySelector('.cl-selected-table'); const cell=markedCell||(sel?.anchorNode?.nodeType===1 ? sel.anchorNode.closest?.('td,th') : sel?.anchorNode?.parentElement?.closest?.('td,th'))||markedRow?.querySelector('td,th'),table=cell?.closest('table')||markedRow?.closest('table')||markedTable; if (!table) return ui.notifications.warn('Place the cursor in a table cell first.'); if(action==='deleteTable'){if(window.confirm('Delete this table?'))table.remove();return;} if(action==='editTable'){this.openAdvancedTableDialog(writing);return;} if (!cell) return ui.notifications.warn('Place the cursor in a table cell first.');
      const row=cell.parentElement;
      if (action === 'addRowAbove' || action === 'addRowBelow') { const clone=row.cloneNode(true); clone.querySelectorAll('th,td').forEach(c=>c.innerHTML=''); row[action==='addRowAbove'?'before':'after'](clone); return; }
      if (action === 'addCellBefore' || action === 'addCellAfter') { const tag=cell.tagName.toLowerCase(); const newCell=document.createElement(tag); newCell.innerHTML=''; newCell.style.cssText=cell.style.cssText; cell[action==='addCellBefore'?'before':'after'](newCell); return; }
      if (action === 'deleteRow') return row.remove();
      if (action === 'deleteCell') return cell.remove();
      if (action === 'colSpan') { const span=Math.max(1,Number(window.prompt('Column span', cell.colSpan || 1))||1); cell.colSpan=span; return; }
      if (action === 'rowSpan') { const span=Math.max(1,Number(window.prompt('Row span', cell.rowSpan || 1))||1); cell.rowSpan=span; return; }
      if (action === 'cellBg') { const color=window.prompt('Cell background color', cell.style.backgroundColor || '#fffdf5'); if (color) cell.style.backgroundColor=color; return; }
      if (action === 'rowBg') { const color=window.prompt('Row background color', row.style.backgroundColor || '#fffdf5'); if (color) row.style.backgroundColor=color; return; }
    }));
    let autosaveTimer = null;
    let saving = false;
    let dirty = false;
    let pendingSave = false;
    let lastSavedSnapshot = null;
    const snapshot = () => JSON.stringify({name:dialog.querySelector(".cl-title").value.trim() || "Untitled Log", content:writing.innerHTML, tags:normalizeTags(tagInput?.value), cover:dialog.querySelector(".cl-cover-url input").value.trim().replace(/\s/g, "") || ICON, folder:dialog.querySelector(".cl-folder-select select")?.value || "", shared:dialog.querySelector('[name="shared"]')?.checked ?? false});
    const markDirty = () => { dirty = snapshot() !== lastSavedSnapshot; };
    const saveDocument = async ({autosave = false, force = false} = {}) => {
      if (!editable) return null;
      markDirty();
      if (!force && !dirty) return entry;
      if (saving) { pendingSave = true; return null; }
      saving = true;
      const data = JSON.parse(snapshot());
      try {
        let savedEntry = entry;
        if (entry) {
          await entry.update({name:data.name}); await entry.setFlag(MODULE_ID, "cover", data.cover === ICON ? "" : data.cover);
          await entry.setFlag(MODULE_ID, "tags", data.tags); await entry.setFlag(MODULE_ID, "folder", data.folder); await entry.setFlag(MODULE_ID, "shared", data.shared); await page.update({name:data.name, text:{content:data.content}});
        } else {
          savedEntry = await JournalEntry.create({name:data.name, pages:[{name:data.name, type:"text", text:{content:data.content, format:CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML}}], flags:{[MODULE_ID]:{[FLAG]:true, cover:data.cover === ICON ? "" : data.cover, tags:data.tags, folder:data.folder, shared:data.shared}}});
          entry = savedEntry; page = savedEntry.pages.contents.find(p => p.type === "text");
        }
        lastSavedSnapshot = JSON.stringify(data); dirty = snapshot() !== lastSavedSnapshot;
        this.renderShelf(); if (autosave) ui.notifications.info("CYPHER LOG autosaved.");
        return savedEntry;
      } catch (error) {
        console.error(`${MODULE_ID} | Could not save log`, error);
        ui.notifications.error(autosave ? "CYPHER LOG could not autosave this document." : "CYPHER LOG could not save this document.");
        return null;
      } finally {
        saving = false;
        if (pendingSave) { pendingSave = false; window.setTimeout(() => saveDocument({autosave:true}), 0); }
      }
    };
    lastSavedSnapshot = snapshot();
    const sharedCheck = dialog.querySelector('[name="shared"]');
    if (sharedCheck) {
      sharedCheck.addEventListener('change', markDirty);
      sharedCheck.addEventListener('click', e => e.stopPropagation());
    }
    [writing, dialog.querySelector(".cl-title"), dialog.querySelector(".cl-cover-url input"), tagInput].filter(Boolean).forEach(control => control.addEventListener("input", markDirty));
    const clearAutosave = () => { if (autosaveTimer) window.clearInterval(autosaveTimer); autosaveTimer = null; document.removeEventListener("visibilitychange", onVisibilityChange); window.removeEventListener("blur", onWindowBlur); };
    const autosaveIfDirty = () => { if (dialog.isConnected && dirty) saveDocument({autosave:true}); };
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") autosaveIfDirty(); };
    const onWindowBlur = () => autosaveIfDirty();
    const startAutosave = () => { clearAutosave(); const minutes = Number(setting("autosaveInterval")) || 5; autosaveTimer = window.setInterval(autosaveIfDirty, minutes * 60 * 1000); document.addEventListener("visibilitychange", onVisibilityChange); window.addEventListener("blur", onWindowBlur); };
    startAutosave();
    dialog.querySelector('[data-action="close"]')?.addEventListener("click", () => { autosaveIfDirty(); clearAutosave(); }, {once:true});
    dialog.querySelector(".cl-save")?.addEventListener("click", async () => { const savedEntry = await saveDocument({force:true}); if (!savedEntry) return; clearAutosave(); ui.notifications.info("CYPHER LOG saved."); dialog.remove(); this.openReader(savedEntry); });
  }
}
Hooks.once("init", () => { game.settings.register(MODULE_ID, SETTINGS.shelves, {scope:"client",config:false,type:Number,default:2}); game.settings.register(MODULE_ID, SETTINGS.theme, {scope:"client",config:false,type:String,default:"walnut",choices:Object.fromEntries(THEMES.map(x=>[x,x]))}); game.settings.register(MODULE_ID, SETTINGS.documentSize, {scope:"client",config:false,type:String,default:"medium"}); game.settings.register(MODULE_ID, SETTINGS.documentPadding, {scope:"client",config:false,type:Number,default:12}); game.settings.register(MODULE_ID, SETTINGS.autosaveInterval, {scope:"client",config:false,type:Number,default:5,choices:{5:"5 minutes",10:"10 minutes",15:"15 minutes"}}); game.settings.register(MODULE_ID, SETTINGS.launcherHidden, {scope:"client",config:false,type:Boolean,default:false}); game.settings.register(MODULE_ID, SETTINGS.launcherBottom, {scope:"client",config:false,type:Number,default:2}); game.settings.register(MODULE_ID, SETTINGS.launcherRight, {scope:"client",config:false,type:Number,default:1}); game.settings.register(MODULE_ID, SETTINGS.launcherSize, {scope:"client",config:false,type:Number,default:37}); game.settings.register(MODULE_ID, SETTINGS.launcherOpacity, {scope:"client",config:false,type:Number,default:100}); game.settings.register(MODULE_ID, SETTINGS.settingsX, {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, SETTINGS.settingsY, {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, SETTINGS.editorX, {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, SETTINGS.editorY, {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, SETTINGS.editorW, {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, SETTINGS.editorH, {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, "readerX", {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, "readerY", {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, "readerW", {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, "readerH", {scope:"client",config:false,type:Number,default:-1}); game.settings.register(MODULE_ID, "folders", {scope:"world",config:false,type:Array,default:[]}); game.settings.register(MODULE_ID, SETTINGS.folderLabelFlip, {scope:"client",config:false,type:Boolean,default:false}); game.settings.register(MODULE_ID, SETTINGS.folderLabelSize, {scope:"client",config:false,type:Number,default:10}); game.settings.register(MODULE_ID, SETTINGS.folderBgColor, {scope:"client",config:false,type:String,default:"#8b5e34"}); game.settings.register(MODULE_ID, SETTINGS.folderBgOpacity, {scope:"client",config:false,type:Number,default:0}); });
Hooks.once("ready", () => {
    CypherLog.injectButton();
  }); Hooks.on("createJournalEntry", entry => { if (isCypherLog(entry)) CypherLog.renderShelf(); }); Hooks.on("updateJournalEntry", entry => { if (isCypherLog(entry)) CypherLog.renderShelf(); });
Hooks.on("updateJournalEntryPage", page => { if (isCypherLog(page.parent)) CypherLog.renderShelf(); }); Hooks.on("deleteJournalEntry", () => CypherLog.renderShelf()); Hooks.on("renderPause", () => CypherLog.injectButton()); globalThis.CypherLog = CypherLog;
globalThis.CypherLog.VERSION = "2.6.7";
