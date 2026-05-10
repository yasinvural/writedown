/** Centralized TanStack Query key factories (stable shapes for cache / invalidation). */

export const documentKeys = {
  all: ["documents"] as const,
  activeList: () => [...documentKeys.all, "active"] as const,
  trashList: () => [...documentKeys.all, "trash"] as const,
  detail: (id: string) => [...documentKeys.all, "detail", id] as const,
  draft: (id: string) => [...documentKeys.all, "draft", id] as const,
};

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};
