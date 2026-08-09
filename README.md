# CYPHER LOG v2.5.2

## GM Taskbar Integration (v2.5.2)

- **SECTION 1 integration** — When both modules are active, Cypher Log now injects its button into the Cypher GM Taskbar's **SECTION 1** area (the white section between the GM brand and the right controls), rather than the taskbar's right control group.
- **Cypher Log handles its own placement** — The integration is driven entirely from the Cypher Log module. The GM Taskbar provides the container; Cypher Log injects itself at runtime.
- **Persistent after taskbar re-renders** — The integration patches the GM Taskbar's render cycle so the Cypher Log button is re-injected after any taskbar refresh.
- **Library positioning** — The Cypher Log library still opens positioned beside the button, whether it's the standalone launcher or the GM Taskbar-integrated button.

## Fix: GM Taskbar Timing (v2.5.1)

- Fixed race condition where the Cypher Log button failed to appear because the GM Taskbar had not yet initialised its DOM when Cypher Log attempted injection. Now uses a retry loop with up to 5 seconds of attempts, and immediately injects on the first successful detection.
- Button is now prepended as the first icon in the taskbar's right controls (before Settings, Name Generator, or any other module buttons).

## Bug Fixes (v2.4.3)

- **Fixed cover image URL escaping** — URLs containing single quotes no longer break the reader window CSS.
- **Fixed advanced table dialog target buttons** — Added missing "Select row" and "Select cell" buttons so users can switch selection modes from the dialog.
- **Fixed table selection state sync** — The click handler now correctly writes to `tableSelectMode` (was writing to a mismatched `tableSelection` property), so the advanced dialog now properly reflects what's selected.
- **Fixed File → Close not stopping autosave** — Closing the editor via the File menu now correctly clears the autosave timer, preventing crashes on removed DOM nodes.
- **Fixed launcher drag race condition** — Launcher position is now saved only on `pointerup` instead of every pixel during drag, eliminating excessive database writes.
- **Fixed page update dot-notation** — Journal page updates now use the nested `text: {content: ...}` format instead of `"text.content"` for better Foundry VTT 14 compatibility.
- **Fixed cover image load failure** — When a cover image fails to load, the `.has-cover` class is now properly removed from the card.
- **Removed dead code** — Eliminated unused `val()` helper function with a corrupted regex character.

## Library launcher anchoring (v2.4.2)

Fixed Library anchoring to the CYPHER LOG icon. The Library now calculates its position only after shelf content has rendered, using the final measured library dimensions. It opens on the inward side of the icon with a 10px gap where space allows, then clamps only when required by the viewport.
