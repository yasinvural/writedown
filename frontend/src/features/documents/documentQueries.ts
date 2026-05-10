import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDocument,
  fetchActiveDocuments,
  fetchTrashDocuments,
  patchDocument,
  restoreDocument,
  softDeleteDocument,
} from "../../api/documents";
import { documentKeys } from "../../queries/queryKeys";

export type { DocumentDto } from "../../api/documents";

function useInvalidateDocumentLists() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: documentKeys.activeList() });
    void qc.invalidateQueries({ queryKey: documentKeys.trashList() });
  };
}

export function useActiveDocumentsQuery() {
  return useQuery({
    queryKey: documentKeys.activeList(),
    queryFn: fetchActiveDocuments,
  });
}

export function useTrashDocumentsQuery() {
  return useQuery({
    queryKey: documentKeys.trashList(),
    queryFn: fetchTrashDocuments,
  });
}

export function useCreateDocumentMutation() {
  const invalidate = useInvalidateDocumentLists();
  return useMutation({
    mutationFn: (payload?: { title?: string; content?: unknown }) => createDocument(payload),
    // Cache: lists change when a document is created.
    onSuccess: () => invalidate(),
  });
}

export function usePatchDocumentMutation() {
  const qc = useQueryClient();
  const invalidate = useInvalidateDocumentLists();
  return useMutation({
    mutationFn: (args: { id: string; title?: string; content?: unknown }) =>
      patchDocument(args.id, { title: args.title, content: args.content }),
    // Cache: active/trash lists and this document’s detail may change.
    onSuccess: (_data, vars) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: documentKeys.detail(vars.id) });
    },
  });
}

export function useSoftDeleteDocumentMutation() {
  const invalidate = useInvalidateDocumentLists();
  return useMutation({
    mutationFn: (id: string) => softDeleteDocument(id),
    // Cache: active and trash lists both reflect delete.
    onSuccess: () => invalidate(),
  });
}

export function useRestoreDocumentMutation() {
  const invalidate = useInvalidateDocumentLists();
  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    // Cache: active and trash lists both reflect restore.
    onSuccess: () => invalidate(),
  });
}
