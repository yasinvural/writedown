import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type TextPromptDialogProps = {
  open: boolean;
  title: string;
  label: string;
  defaultValue: string;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function TextPromptDialog({
  open,
  title,
  label,
  defaultValue,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  disabled = false,
  onConfirm,
  onCancel,
}: TextPromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const titleId = useId();
  const inputId = useId();

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
        className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg shadow-black/15 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
      >
        <h2
          id={titleId}
          className="m-0 text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          {title}
        </h2>
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (disabled) return;
            onConfirm(value);
          }}
        >
          <label
            htmlFor={inputId}
            className="flex flex-col gap-1.5 text-[0.9rem] font-normal text-zinc-900 dark:text-zinc-100"
          >
            {label}
            <input
              id={inputId}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-base text-zinc-900 outline-offset-1 focus:outline-2 focus:outline-violet-500/50 disabled:opacity-65 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              type="text"
              value={value}
              onChange={(ev) => setValue(ev.target.value)}
              disabled={disabled}
              autoComplete="off"
              autoFocus
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-full border border-zinc-200 bg-transparent px-3.5 py-2 text-sm font-normal text-zinc-800 hover:bg-zinc-100 disabled:cursor-default disabled:opacity-65 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => onCancel()}
              disabled={disabled}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-full border border-violet-400/50 bg-violet-500/10 px-3.5 py-2 text-sm font-normal text-zinc-900 hover:brightness-105 disabled:cursor-default disabled:opacity-65 dark:border-violet-400/50 dark:text-zinc-100"
              disabled={disabled}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
