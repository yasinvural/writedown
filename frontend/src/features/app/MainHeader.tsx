type MainHeaderProps = {
  email: string;
  onSignOut: () => void;
};

export function MainHeader({ email, onSignOut }: MainHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Writedown
        </h1>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
        <p className="m-0 text-sm text-zinc-500 dark:text-zinc-400">
          {email}
        </p>
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        onClick={onSignOut}
      >
        Sign out
      </button>
    </header>
  );
}
