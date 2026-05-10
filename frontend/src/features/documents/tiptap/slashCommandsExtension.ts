import { Extension } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { Suggestion, type SuggestionProps } from "@tiptap/suggestion";

export type SlashMenuItem = {
  title: string;
  keywords: string[];
  run: (ctx: { editor: Editor; range: Range }) => void;
};

function item(label: string, keywords: string[], run: SlashMenuItem["run"]): SlashMenuItem {
  return { title: label, keywords, run };
}

function allSlashItems(): SlashMenuItem[] {
  return [
    item("Heading 1", ["h1", "title", "heading"], ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    }),
    item("Heading 2", ["h2", "subtitle", "heading"], ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    }),
    item("Heading 3", ["h3", "heading"], ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    }),
    item("Paragraph", ["p", "text", "body"], ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    }),
    item("Bullet list", ["ul", "unordered", "list"], ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    }),
    item("Numbered list", ["ol", "ordered", "list"], ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    }),
  ];
}

function filterSlashItems(query: string): SlashMenuItem[] {
  const q = query.trim().toLowerCase();
  const items = allSlashItems();
  if (!q) return items;
  return items.filter(
    (it) =>
      it.title.toLowerCase().includes(q) ||
      it.keywords.some((k) => k.toLowerCase().includes(q) || k.toLowerCase().startsWith(q)),
  );
}

export const slashCommandsPluginKey = new PluginKey("writedownSlashCommands");

function mountSlashPopup(
  getProps: () => SuggestionProps<SlashMenuItem, SlashMenuItem> | undefined,
): {
  destroy: () => void;
  setSelectedIndex: (i: number) => void;
  getSelectedIndex: () => number;
  render: () => void;
} {
  let selectedIndex = 0;
  const root = document.createElement("div");
  root.role = "listbox";
  root.className =
    "slash-menu fixed z-[9999] min-w-[12rem] max-h-[16rem] overflow-auto rounded-xl border border-zinc-200/60 bg-white/95 py-1.5 text-left text-sm shadow-xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/95";

  function render() {
    const props = getProps();
    if (!props) return;
    const items = props.items;
    selectedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));
    root.innerHTML = "";
    items.forEach((menuItem, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "option";
      btn.textContent = menuItem.title;
      btn.className = `slash-menu-item block w-full cursor-pointer px-3 py-1.5 text-left transition-colors ${
        i === selectedIndex ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
      }`;
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", () => props.command(menuItem));
      root.appendChild(btn);
    });

    const rect = props.clientRect?.();
    if (rect) {
      root.style.left = `${rect.left + window.scrollX}px`;
      root.style.top = `${rect.bottom + window.scrollY + 4}px`;
    }
  }

  document.body.appendChild(root);

  return {
    destroy: () => {
      root.remove();
    },
    setSelectedIndex(i: number) {
      selectedIndex = i;
      render();
    },
    getSelectedIndex: () => selectedIndex,
    render,
  };
}

/** Notion-like `/` block menu wired through `@tiptap/suggestion`. */
export const SlashCommands = Extension.create({
  name: "slashCommands",

  addProseMirrorPlugins() {
    const editor = this.editor;
    let popup: ReturnType<typeof mountSlashPopup> | null = null;
    let suggestionPropsGetter: () => SuggestionProps<SlashMenuItem, SlashMenuItem> | undefined = () => undefined;

    return [
      Suggestion<SlashMenuItem, SlashMenuItem>({
        editor,
        pluginKey: slashCommandsPluginKey,
        char: "/",
        allowedPrefixes: null,
        command: ({ editor: ed, range, props }) => {
          props.run({ editor: ed, range });
          popup?.destroy();
          popup = null;
        },
        items: ({ query }) => filterSlashItems(query),
        render: () => {
          return {
            onStart: (props) => {
              suggestionPropsGetter = () => props;
              popup?.destroy();
              popup = mountSlashPopup(() => suggestionPropsGetter());
              popup.render();
            },
            onUpdate: (props) => {
              suggestionPropsGetter = () => props;
              popup?.render();
            },
            onExit: () => {
              popup?.destroy();
              popup = null;
            },
            onKeyDown: ({ event }) => {
              const p = suggestionPropsGetter();
              if (!p || !popup) return false;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                const next = Math.min(popup.getSelectedIndex() + 1, p.items.length - 1);
                popup.setSelectedIndex(next);
                return true;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                const next = Math.max(popup.getSelectedIndex() - 1, 0);
                popup.setSelectedIndex(next);
                return true;
              }
              if (event.key === "Enter") {
                const item = p.items[popup.getSelectedIndex()];
                if (item) {
                  event.preventDefault();
                  p.command(item);
                }
                return true;
              }
              return false;
            },
          };
        },
      }),
    ];
  },
});
