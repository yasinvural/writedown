import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type ShareInviteDialogProps = {
  open: boolean;
  code: string;
  disabled?: boolean;
  onClose: () => void;
};

export function ShareInviteDialog({ open, code, disabled = false, onClose }: ShareInviteDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !code) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* Clipboard may fail without permission or non-secure context */
    }
  }

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40 dark:bg-black/60"
        aria-label="Dismiss"
        onClick={() => onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg shadow-black/15 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
      >
        <h2 id={titleId} className="m-0 text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Share code
        </h2>
        <p className="m-3 mb-4 text-left text-[0.875rem] text-zinc-500 dark:text-zinc-400">
          Anyone signed in who enters this code can open and edit this document.
        </p>
        <div className="my-5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <code className="select-all whitespace-pre-wrap break-all text-sm text-zinc-900 dark:text-zinc-100">
            {code}
          </code>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={disabled}
            className="cursor-pointer rounded-full border border-zinc-200 bg-transparent px-3.5 py-2 text-sm font-normal text-zinc-800 hover:bg-zinc-100 disabled:cursor-default disabled:opacity-65 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => void handleCopy()}
          >
            Copy
          </button>
          <button
            type="button"
            disabled={disabled}
            className="cursor-pointer rounded-full border border-violet-400/50 bg-violet-500/10 px-3.5 py-2 text-sm font-normal text-zinc-900 hover:brightness-105 disabled:cursor-default disabled:opacity-65 dark:border-violet-400/50 dark:text-zinc-100"
            onClick={() => onClose()}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
