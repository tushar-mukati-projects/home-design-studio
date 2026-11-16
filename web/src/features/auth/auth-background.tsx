export const AuthBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/5 blur-3xl" />
    <div className="absolute -right-48 -bottom-48 size-[30rem] rounded-full bg-primary/3 blur-3xl" />
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.03]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-grid)" />
    </svg>
    <div className="absolute top-1/4 left-1/2 h-px w-64 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    <div className="absolute bottom-1/3 left-1/2 h-px w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
  </div>
);
