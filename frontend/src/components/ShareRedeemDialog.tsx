import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "../api/http";
import { useRedeemShareCodeMutation } from "../features/documents/documentQueries";

type ShareRedeemDialogProps = {
  open: boolean;
  onCancel: () => void;
  onOpened: (documentId: string) => void | Promise<void>;
};

export function ShareRedeemDialog({ open, onCancel, onOpened }: ShareRedeemDialogProps) {
  const titleId = useId();
  const inputId = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const redeemMut = useRedeemShareCodeMutation();

  useEffect(() => {
    if (!open) return;
    setCode("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        redeemMut.reset();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const submitting = redeemMut.isPending;

  async function submit() {
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a share code.");
      return;
    }
    try {
      const { documentId } = await redeemMut.mutateAsync(trimmed);
      await onOpened(documentId);
      redeemMut.reset();
      onCancel();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          setError("Too many attempts. Wait a bit and try again.");
        } else {
          setError(e.message);
        }
      } else {
        setError("Could not open document.");
      }
    }
  }

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40 dark:bg-black/60"
        aria-label="Dismiss"
        onClick={() => {
          redeemMut.reset();
          onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg shadow-black/15 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
      >
        <h2 id={titleId} className="m-0 text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Open shared document
        </h2>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label
            htmlFor={inputId}
            className="flex flex-col gap-1.5 text-[0.9rem] font-normal text-zinc-900 dark:text-zinc-100"
          >
            Share code
            <input
              id={inputId}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-base text-zinc-900 outline-offset-1 focus:outline-2 focus:outline-violet-500/50 disabled:opacity-65 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              type="text"
              value={code}
              onChange={(ev) => setCode(ev.target.value)}
              disabled={submitting}
              autoComplete="off"
              autoFocus
            />
          </label>
          {error ? <p className="m-0 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="cursor-pointer rounded-full border border-zinc-200 bg-transparent px-3.5 py-2 text-sm font-normal text-zinc-800 hover:bg-zinc-100 disabled:cursor-default disabled:opacity-65 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => {
                redeemMut.reset();
                onCancel();
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-full border border-violet-400/50 bg-violet-500/10 px-3.5 py-2 text-sm font-normal text-zinc-900 hover:brightness-105 disabled:cursor-default disabled:opacity-65 dark:border-violet-400/50 dark:text-zinc-100"
              disabled={submitting}
            >
              Open
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
