import type { DocumentDto } from "../../api/documents";
import { DocumentEditorLoaded } from "./DocumentEditorLoaded";

type DocumentEditorPaneProps = {
  document: DocumentDto | null;
  registerFlush: (fn: (() => Promise<void>) | null) => void;
};

export function DocumentEditorPane(props: DocumentEditorPaneProps) {
  if (!props.document) {
    return (
      <div className="p-6 text-left">
        <p className="m-0 text-sm text-zinc-500 dark:text-zinc-400">Select a document or create one.</p>
      </div>
    );
  }
  return <DocumentEditorLoaded document={props.document} registerFlush={props.registerFlush} />;
}
