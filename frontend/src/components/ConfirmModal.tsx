import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use danger styling and focus Cancel first for destructive actions. */
  tone?: "default" | "danger";
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  tone = "default",
  disabled = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmButtonClass =
    tone === "danger"
      ? "cursor-pointer rounded-full border border-red-400/50 bg-red-500/10 px-3.5 py-2 text-sm font-normal text-red-800 hover:brightness-105 disabled:cursor-default disabled:opacity-65 dark:border-red-400/40 dark:text-red-200"
      : "cursor-pointer rounded-full border border-violet-400/50 bg-violet-500/10 px-3.5 py-2 text-sm font-normal text-zinc-900 hover:brightness-105 disabled:cursor-default disabled:opacity-65 dark:border-violet-400/50 dark:text-zinc-100";

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40 dark:bg-black/60"
        aria-label="Dismiss"
        onClick={() => onCancel()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg shadow-black/15 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
      >
        <h2
          id={titleId}
          className="m-0 text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          {title}
        </h2>
        {description ? (
          <p
            id={descriptionId}
            className="mb-0 mt-3 text-[0.95rem] leading-relaxed text-zinc-600 dark:text-zinc-400"
          >
            {description}
          </p>
        ) : null}
        <form
          className="mt-6 flex justify-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (disabled) return;
            onConfirm();
          }}
        >
          <button
            type="button"
            className="cursor-pointer rounded-full border border-zinc-200 bg-transparent px-3.5 py-2 text-sm font-normal text-zinc-800 hover:bg-zinc-100 disabled:cursor-default disabled:opacity-65 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => onCancel()}
            disabled={disabled}
            autoFocus={tone === "danger"}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className={confirmButtonClass}
            disabled={disabled}
            autoFocus={tone === "default"}
          >
            {confirmLabel}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
