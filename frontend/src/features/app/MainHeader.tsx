type MainHeaderProps = {
  email: string;
  onSignOut: () => void;
};

export function MainHeader({ email, onSignOut }: MainHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="mb-1 mt-0 text-[1.75rem] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Writedown
        </h1>
        <p className="m-0 text-[0.95rem] text-zinc-600 dark:text-zinc-400">
          Signed in as {email}
        </p>
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-100 px-3.5 py-2 text-base font-normal text-zinc-900 hover:border-violet-400/50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        onClick={onSignOut}
      >
        Sign out
      </button>
    </header>
  );
}
