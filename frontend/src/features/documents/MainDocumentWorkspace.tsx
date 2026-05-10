import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type DocumentDto,
  useActiveDocumentsQuery,
  useCreateDocumentMutation,
  usePatchDocumentMutation,
  useRestoreDocumentMutation,
  useSoftDeleteDocumentMutation,
  useTrashDocumentsQuery,
} from "../../api/documents";
import { DocumentEditorPane } from "./DocumentEditorPane";

function scrollTextStyle() {
  return "min-h-0 flex-1 overflow-y-auto";
}

type DocumentSidebarProps = {
  active: DocumentDto[];
  trash: DocumentDto[];
  selectedId: string | null;
  isBusy: boolean;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onSoftDelete: (id: string) => void;
  onRestore: (id: string) => void;
};

function DocumentSidebar({
  active,
  trash,
  selectedId,
  isBusy,
  onSelect,
  onCreate,
  onRename,
  onSoftDelete,
  onRestore,
}: DocumentSidebarProps) {
  const [promptOpen, setPromptOpen] = useState(false);

  function handleRenameClick(doc: DocumentDto) {
    if (promptOpen) return;
    setPromptOpen(true);
    const next = window.prompt("Document title", doc.title);
    setPromptOpen(false);
    if (next === null) return;
    const t = next.trim();
    if (!t || t === doc.title) return;
    onRename(doc.id, t);
  }

  return (
    <aside
      className={`flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/20 ${scrollTextStyle()}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Documents
        </span>
        <button
          type="button"
          disabled={isBusy}
          className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          onClick={() => void onCreate()}
          title="New document"
        >
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
      <ul className="m-0 list-none space-y-0.5 px-2 pb-4">
        {active.length === 0 ? (
          <li className="px-2 py-2 text-left text-sm text-zinc-400 dark:text-zinc-500">
            No documents yet.
          </li>
        ) : (
          active.map((doc) => {
            const selected = doc.id === selectedId;
            return (
              <li key={doc.id}>
                <div
                  className={`group flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors ${
                    selected
                      ? "bg-zinc-200/60 dark:bg-zinc-800/60"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <button
                    type="button"
                    disabled={isBusy}
                    className={`min-w-0 flex-1 cursor-pointer truncate text-left text-sm ${selected ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}
                    onClick={() => void onSelect(doc.id)}
                  >
                    {doc.title}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={isBusy}
                      className="cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                      title="Rename"
                      onClick={() => handleRenameClick(doc)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      className="cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      title="Move to trash"
                      onClick={() => void onSoftDelete(doc.id)}
                    >
                      Del
                    </button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <details className="mt-auto shrink-0 border-t border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
          Trash ({trash.length})
        </summary>
        <ul className="m-0 list-none space-y-0.5 px-2 pb-2 pt-0">
          {trash.length === 0 ? (
            <li className="px-2 py-1 text-left text-sm text-zinc-400 dark:text-zinc-500">
              Empty
            </li>
          ) : (
            trash.map((doc) => (
              <li
                key={doc.id}
                className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
              >
                <span className="min-w-0 flex-1 truncate text-left text-sm text-zinc-500 dark:text-zinc-400">
                  {doc.title}
                </span>
                <button
                  type="button"
                  disabled={isBusy}
                  className="shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200 hover:text-zinc-900 group-hover:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                  onClick={() => void onRestore(doc.id)}
                >
                  Restore
                </button>
              </li>
            ))
          )}
        </ul>
      </details>
    </aside>
  );
}

export function MainDocumentWorkspace() {
  const activeQuery = useActiveDocumentsQuery();
  const trashQuery = useTrashDocumentsQuery();
  const createMut = useCreateDocumentMutation();
  const patchMut = usePatchDocumentMutation();
  const deleteMut = useSoftDeleteDocumentMutation();
  const restoreMut = useRestoreDocumentMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const flushBeforeLeaveRef = useRef<(() => Promise<void>) | null>(null);

  const active = activeQuery.data ?? [];
  const trash = trashQuery.data ?? [];

  const selectedDoc = useMemo(
    () => active.find((d) => d.id === selectedId) ?? null,
    [active, selectedId],
  );

  const isBusy =
    createMut.isPending ||
    patchMut.isPending ||
    deleteMut.isPending ||
    restoreMut.isPending;

  const trySelectDocument = useCallback(async (id: string | null) => {
    const flush = flushBeforeLeaveRef.current;
    if (flush) {
      try {
        await flush();
      } catch {
        return;
      }
    }
    setSelectedId(id);
  }, []);

  useEffect(() => {
    if (selectedId !== null && !active.some((d) => d.id === selectedId)) {
      void trySelectDocument(active[0]?.id ?? null);
    }
  }, [active, selectedId, trySelectDocument]);

  useEffect(() => {
    if (selectedId === null && active.length > 0) {
      setSelectedId(active[0].id);
    }
  }, [active, selectedId]);

  const registerFlush = useCallback((fn: (() => Promise<void>) | null) => {
    flushBeforeLeaveRef.current = fn;
  }, []);

  async function handleCreate() {
    try {
      const doc = await createMut.mutateAsync(undefined);
      await trySelectDocument(doc.id);
    } catch {
      /* errors surface in devtools; toast can follow */
    }
  }

  async function handleRename(id: string, title: string) {
    try {
      await patchMut.mutateAsync({ id, title });
    } catch {
      /* ignore */
    }
  }

  async function handleSoftDelete(id: string) {
    const remaining = active.filter((d) => d.id !== id);
    const nextAfterDelete =
      selectedId === id ? (remaining[0]?.id ?? null) : selectedId;
    try {
      await deleteMut.mutateAsync(id);
    } catch {
      return;
    }
    if (selectedId === id) {
      await trySelectDocument(nextAfterDelete);
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreMut.mutateAsync(id);
    } catch {
      /* ignore */
    }
  }

  const loadError = activeQuery.error ?? trashQuery.error;

  return (
    <section className="flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-zinc-950">
      {loadError ? (
        <p className="m-0 p-4 text-left text-sm text-red-600 dark:text-red-400">
          Could not load documents. Check that the API is running and you are
          signed in.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 w-full">
          <DocumentSidebar
            active={active}
            trash={trash}
            selectedId={selectedId}
            isBusy={isBusy || activeQuery.isPending}
            onSelect={trySelectDocument}
            onCreate={handleCreate}
            onRename={handleRename}
            onSoftDelete={handleSoftDelete}
            onRestore={handleRestore}
          />
          <div
            className={`flex min-w-0 flex-1 flex-col bg-white dark:bg-zinc-950 ${scrollTextStyle()}`}
          >
            <DocumentEditorPane
              document={selectedDoc}
              registerFlush={registerFlush}
            />
          </div>
        </div>
      )}
    </section>
  );
}
