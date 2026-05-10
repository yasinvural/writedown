import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  type DocumentDto,
  useActiveDocumentsQuery,
  useCreateDocumentMutation,
  useCreateShareCodeMutation,
  useDocumentQuery,
  usePatchDocumentMutation,
  useRestoreDocumentMutation,
  useSoftDeleteDocumentMutation,
  useTrashDocumentsQuery,
} from "./documentQueries";
import { DocumentEditorPane } from "./DocumentEditorPane";
import { ApiError } from "../../api/http";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ShareInviteDialog } from "../../components/ShareInviteDialog";
import { ShareRedeemDialog } from "../../components/ShareRedeemDialog";
import { TextPromptDialog } from "../../components/TextPromptDialog";
import openSharedSvg from "../../assets/open-shared.svg?raw";
import plusSvg from "../../assets/plus.svg?raw";

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
  onOpenShared: () => void;
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
  onOpenShared,
}: DocumentSidebarProps) {
  const [renameDoc, setRenameDoc] = useState<DocumentDto | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentDto | null>(null);

  const closeRenameDialog = useCallback(() => setRenameDoc(null), []);
  const closeDeleteModal = useCallback(() => setDeleteDoc(null), []);

  function confirmRename(raw: string) {
    const doc = renameDoc;
    setRenameDoc(null);
    if (!doc) return;
    const t = raw.trim();
    if (!t || t === doc.title) return;
    onRename(doc.id, t);
  }

  function confirmSoftDelete() {
    const doc = deleteDoc;
    setDeleteDoc(null);
    if (!doc) return;
    void onSoftDelete(doc.id);
  }

  return (
    <aside
      className={`flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/20 ${scrollTextStyle()}`}
    >
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Documents
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={isBusy}
              className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              onClick={() => onOpenShared()}
              title="Open shared document"
              aria-label="Open shared document"
            >
              <span
                className="inline-flex size-[1.125rem] shrink-0 items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: openSharedSvg }}
              />
            </button>
            <button
              type="button"
              disabled={isBusy}
              className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              onClick={() => void onCreate()}
              title="New document"
              aria-label="New document"
            >
              <span
                className="inline-flex size-[1.125rem] shrink-0 items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: plusSvg }}
              />
            </button>
          </div>
        </div>
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
                      onClick={() => setRenameDoc(doc)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      className="cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      title="Move to trash"
                      onClick={() => setDeleteDoc(doc)}
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

      <TextPromptDialog
        key={renameDoc?.id ?? "closed"}
        open={renameDoc !== null}
        title="Rename document"
        label="Document title"
        defaultValue={renameDoc?.title ?? ""}
        disabled={isBusy}
        onCancel={closeRenameDialog}
        onConfirm={confirmRename}
      />

      <ConfirmModal
        key={deleteDoc?.id ?? "closed"}
        open={deleteDoc !== null}
        title="Move this document to trash?"
        description="You can restore it later from trash in the sidebar."
        tone="danger"
        cancelLabel="Cancel"
        confirmLabel="Move to trash"
        disabled={isBusy}
        onCancel={closeDeleteModal}
        onConfirm={confirmSoftDelete}
      />
    </aside>
  );
}

export function MainDocumentWorkspace() {
  const activeQuery = useActiveDocumentsQuery();
  const trashQuery = useTrashDocumentsQuery();
  const createMut = useCreateDocumentMutation();
  const createShareMut = useCreateShareCodeMutation();
  const patchMut = usePatchDocumentMutation();
  const deleteMut = useSoftDeleteDocumentMutation();
  const restoreMut = useRestoreDocumentMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pinnedSharedDocumentId, setPinnedSharedDocumentId] = useState<string | null>(null);
  const [shareInviteOpen, setShareInviteOpen] = useState(false);
  const [shareInviteCode, setShareInviteCode] = useState("");
  const [redeemOpen, setRedeemOpen] = useState(false);

  const flushBeforeLeaveRef = useRef<(() => Promise<void>) | null>(null);

  const active = useMemo(() => activeQuery.data ?? [], [activeQuery.data]);
  const trash = useMemo(() => trashQuery.data ?? [], [trashQuery.data]);

  const flushBeforeNavigate = useCallback(async () => {
    const flush = flushBeforeLeaveRef.current;
    if (!flush) return;
    try {
      await flush();
    } catch {
      throw new Error("flush_failed");
    }
  }, []);

  const navigateToOwned = useCallback(
    async (id: string | null) => {
      try {
        await flushBeforeNavigate();
      } catch {
        return;
      }
      setPinnedSharedDocumentId(null);
      setSelectedId(id);
    },
    [flushBeforeNavigate],
  );

  const navigateToSharedDocument = useCallback(
    async (id: string) => {
      try {
        await flushBeforeNavigate();
      } catch {
        return;
      }
      setPinnedSharedDocumentId(id);
      setSelectedId(id);
    },
    [flushBeforeNavigate],
  );

  const resolvedSelectedId = useMemo(() => {
    if (selectedId !== null) {
      if (active.some((d) => d.id === selectedId)) return selectedId;
      if (pinnedSharedDocumentId === selectedId) return selectedId;
    }
    return active[0]?.id ?? null;
  }, [active, selectedId, pinnedSharedDocumentId]);

  const needsSharedDetail =
    resolvedSelectedId !== null &&
    !active.some((d) => d.id === resolvedSelectedId) &&
    pinnedSharedDocumentId === resolvedSelectedId;

  const sharedDetailQuery = useDocumentQuery(
    resolvedSelectedId,
    Boolean(needsSharedDetail && resolvedSelectedId),
  );

  const selectedDoc = useMemo((): DocumentDto | null => {
    if (!resolvedSelectedId) return null;
    const owned = active.find((d) => d.id === resolvedSelectedId);
    if (owned) return owned;
    if (needsSharedDetail) return sharedDetailQuery.data ?? null;
    return null;
  }, [resolvedSelectedId, active, needsSharedDetail, sharedDetailQuery.data]);

  useEffect(() => {
    if (resolvedSelectedId === selectedId) return;
    setSelectedId(resolvedSelectedId);
  }, [resolvedSelectedId, selectedId]);

  useEffect(() => {
    if (!needsSharedDetail) return;
    const err = sharedDetailQuery.error;
    if (err instanceof ApiError && err.status === 404) {
      setPinnedSharedDocumentId(null);
      void navigateToOwned(active[0]?.id ?? null);
    }
  }, [needsSharedDetail, sharedDetailQuery.error, active, navigateToOwned]);

  const isOwnerView =
    resolvedSelectedId !== null && active.some((d) => d.id === resolvedSelectedId);

  const registerFlush = useCallback((fn: (() => Promise<void>) | null) => {
    flushBeforeLeaveRef.current = fn;
  }, []);

  const isBusy =
    createMut.isPending ||
    patchMut.isPending ||
    deleteMut.isPending ||
    restoreMut.isPending ||
    createShareMut.isPending;

  async function handleCreate() {
    try {
      const doc = await createMut.mutateAsync(undefined);
      await navigateToOwned(doc.id);
    } catch {
      /* errors surface via devtools */
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
      resolvedSelectedId === id ? (remaining[0]?.id ?? null) : resolvedSelectedId;
    try {
      await deleteMut.mutateAsync(id);
    } catch {
      return;
    }
    if (resolvedSelectedId === id) {
      await navigateToOwned(nextAfterDelete ?? null);
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreMut.mutateAsync(id);
    } catch {
      /* ignore */
    }
  }

  async function handleShare() {
    if (!resolvedSelectedId || !isOwnerView) return;
    try {
      const { code } = await createShareMut.mutateAsync(resolvedSelectedId);
      setShareInviteCode(code);
      setShareInviteOpen(true);
    } catch {
      /* ignore */
    }
  }

  const loadError = activeQuery.error ?? trashQuery.error;

  let sharedFallback: ReactNode = null;
  if (needsSharedDetail && !selectedDoc) {
    if (sharedDetailQuery.isPending) {
      sharedFallback = (
        <div className="flex flex-1 items-center justify-start px-8 py-6">
          <p className="m-0 text-sm text-zinc-500 dark:text-zinc-400">Loading shared document…</p>
        </div>
      );
    } else if (sharedDetailQuery.error instanceof ApiError) {
      sharedFallback = (
        <div className="flex flex-1 flex-col gap-2 px-8 py-6">
          <p className="m-0 text-sm text-red-600 dark:text-red-400">{sharedDetailQuery.error.message}</p>
        </div>
      );
    } else if (sharedDetailQuery.error) {
      sharedFallback = (
        <div className="flex flex-1 flex-col gap-2 px-8 py-6">
          <p className="m-0 text-sm text-red-600 dark:text-red-400">Could not load document.</p>
        </div>
      );
    }
  }

  return (
    <section className="flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-zinc-950">
      {loadError ? (
        <p className="m-0 p-4 text-left text-sm text-red-600 dark:text-red-400">
          Could not load documents. Check that the API is running and you are signed in.
        </p>
      ) : (
        <div className="flex min-h-0 w-full flex-1">
          <DocumentSidebar
            active={active}
            trash={trash}
            selectedId={resolvedSelectedId}
            isBusy={isBusy || activeQuery.isPending}
            onSelect={(id) => void navigateToOwned(id)}
            onCreate={handleCreate}
            onRename={handleRename}
            onSoftDelete={handleSoftDelete}
            onRestore={handleRestore}
            onOpenShared={() => setRedeemOpen(true)}
          />
          <div className={`flex min-w-0 flex-1 flex-col bg-white dark:bg-zinc-950 ${scrollTextStyle()}`}>
            {!isOwnerView && selectedDoc ? (
              <p className="m-0 shrink-0 border-b border-zinc-200 px-8 py-2 text-left text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                You&apos;re viewing a document someone shared with you.
              </p>
            ) : null}
            {isOwnerView && resolvedSelectedId ? (
              <div className="flex shrink-0 justify-end px-8 pt-6">
                <button
                  type="button"
                  disabled={isBusy}
                  className="cursor-pointer rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title="Generate a share code"
                  onClick={() => void handleShare()}
                >
                  Share…
                </button>
              </div>
            ) : null}
            {sharedFallback ?? <DocumentEditorPane document={selectedDoc} registerFlush={registerFlush} />}
          </div>
        </div>
      )}

      <ShareInviteDialog
        open={shareInviteOpen}
        code={shareInviteCode}
        disabled={false}
        onClose={() => {
          setShareInviteOpen(false);
          setShareInviteCode("");
        }}
      />

      <ShareRedeemDialog
        open={redeemOpen}
        onCancel={() => setRedeemOpen(false)}
        onOpened={async (documentId) => {
          await navigateToSharedDocument(documentId);
        }}
      />
    </section>
  );
}
