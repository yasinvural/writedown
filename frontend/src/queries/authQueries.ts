import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, login, logout, register, type AuthUser } from "../api/auth";
import { authKeys } from "./queryKeys";

export function useSessionQuery() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: fetchMe,
  });
}

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      register(email, password),
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData<AuthUser | null>(authKeys.session(), null);
    },
  });
}
