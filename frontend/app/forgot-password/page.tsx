import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ceramic-background via-white to-ceramic-secondary p-4">
      <section className="w-full max-w-lg rounded-2xl border border-white/40 bg-white/90 p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-ceramic-primary">
          Mwazanga Hardware
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ceramic-accent">
          Forgot your password?
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Self-service password reset is not set up. Please contact your system
          administrator to reset your username and password.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ceramic-primary px-4 font-semibold text-white hover:bg-ceramic-primary/90"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
