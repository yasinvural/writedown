import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useDebouncedCallback } from "use-debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentDto } from "../../api/documents";
import { usePatchDocumentMutation } from "../../api/documents";
import { ApiError } from "../../api/http";
import { SlashCommands } from "./tiptap/slashCommandsExtension";

function normalizeContent(raw: unknown): JSONContent {
  if (
    raw !== null &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw as { type?: unknown }).type === "doc"
  ) {
    return raw as JSONContent;
  }
  return { type: "doc", content: [{ type: "paragraph" }] };
}

type Props = {
  document: DocumentDto;
  registerFlush: (fn: (() => Promise<void>) | null) => void;
};

export function DocumentEditorLoaded({ document: doc, registerFlush }: Props) {
  const patchMut = usePatchDocumentMutation();
  const editorInstanceRef = useRef<Editor | null>(null);

  const [titleDraft, setTitleDraft] = useState(doc.title);
  const titleFocusedRef = useRef(false);

  const lastSavedJson = useRef(JSON.stringify(normalizeContent(doc.content)));
  const lastSavedTitle = useRef(doc.title.trim());
  const titleDraftRef = useRef(titleDraft);
  const docRef = useRef(doc);

  const [saveError, setSaveError] = useState<string | null>(null);

  const saveIfDirty = useCallback(async () => {
    const d = docRef.current;
    const ed = editorInstanceRef.current;
    if (!ed || ed.isDestroyed) return;

    const json = ed.getJSON();
    const serialized = JSON.stringify(json);
    const trimmedTitle = titleDraftRef.current.trim();
    const contentDirty = serialized !== lastSavedJson.current;
    const titleDirty = trimmedTitle !== lastSavedTitle.current && trimmedTitle.length > 0;

    if (!contentDirty && !titleDirty) return;

    try {
      setSaveError(null);
      await patchMut.mutateAsync({
        id: d.id,
        ...(contentDirty ? { content: json as unknown } : {}),
        ...(titleDirty ? { title: trimmedTitle } : {}),
      });
      lastSavedJson.current = serialized;
      if (titleDirty) lastSavedTitle.current = trimmedTitle;
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Could not save");
      throw e;
    }
  }, [patchMut]);

  const saveIfDirtyRef = useRef(saveIfDirty);

  const debouncedSave = useDebouncedCallback(
    () => {
      void saveIfDirtyRef.current();
    },
    650,
    { flushOnExit: true },
  );

  const debouncedSaveRef = useRef(debouncedSave);
  useEffect(() => {
    debouncedSaveRef.current = debouncedSave;
  }, [debouncedSave]);

  useEffect(() => {
    docRef.current = doc;
    titleDraftRef.current = titleDraft;
  });

  useEffect(() => {
    saveIfDirtyRef.current = saveIfDirty;
  }, [saveIfDirty]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          bulletList: { keepMarks: true },
          orderedList: { keepMarks: true },
          heading: { levels: [1, 2, 3] },
        }),
        SlashCommands,
      ],
      editorProps: {
        attributes: {
          class:
            "min-h-[min(420px,calc(100vh-280px))] max-w-none text-left text-zinc-800 outline-none [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-8 dark:text-zinc-100 [&_strong]:font-semibold",
        },
      },
      content: normalizeContent(doc.content),
      onUpdate: () => {
        debouncedSaveRef.current();
      },
    },
    [doc.id],
  );

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editorInstanceRef.current = editor;
    }
    return () => {
      editorInstanceRef.current = null;
    };
  }, [editor]);

  useEffect(() => {
    registerFlush(async () => {
      debouncedSave.cancel();
      await saveIfDirtyRef.current();
    });
    return () => registerFlush(null);
  }, [registerFlush, debouncedSave, doc.id]);

  useEffect(() => {
    function onHidden() {
      if (document.visibilityState === "hidden") {
        debouncedSave.cancel();
        void saveIfDirtyRef.current();
      }
    }
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [debouncedSave]);

  const serverContentKey = JSON.stringify(doc.content);

  useEffect(() => {
    lastSavedJson.current = JSON.stringify(normalizeContent(doc.content));
    lastSavedTitle.current = doc.title.trim();
    if (!titleFocusedRef.current) {
      setTitleDraft(doc.title);
      titleDraftRef.current = doc.title;
    }
  }, [doc.id, doc.title, serverContentKey]); // eslint-disable-line react-hooks/exhaustive-deps -- serverContentKey serializes doc.content

  const saving = patchMut.isPending;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[850px] flex-1 flex-col px-8 py-12 text-left">
      <div className="mb-8 flex shrink-0 flex-col gap-2">
        <input
          id="doc-title-editor"
          type="text"
          value={titleDraft}
          onChange={(e) => {
            const v = e.target.value;
            setTitleDraft(v);
            titleDraftRef.current = v;
            debouncedSave();
          }}
          onFocus={() => {
            titleFocusedRef.current = true;
          }}
          onBlur={() => {
            titleFocusedRef.current = false;
            debouncedSave.cancel();
            void saveIfDirtyRef.current();
          }}
          className="w-full bg-transparent px-0 py-0 text-4xl font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-50 dark:placeholder:text-zinc-700"
          placeholder="Untitled"
        />

        <div className="flex items-center gap-2 text-[13px] text-zinc-400 dark:text-zinc-500">
          {saving ? <span>Saving…</span> : <span>All changes saved</span>}
          {saveError ? <span className="text-red-500 dark:text-red-400">• {saveError}</span> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {editor ? <EditorContent editor={editor} spellCheck /> : null}
      </div>
    </div>
  );
}
