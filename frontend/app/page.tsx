import Link from 'next/link';

export default function HomePage() {
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark font-sans">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-block rounded-full border border-light/20 bg-light/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-light/80">
          Beta 2.0
        </div>
        <h1 className="mb-6 text-6xl font-bold leading-tight text-light sm:text-7xl lg:text-8xl">
          Instant Learning
          <br />
          <span className="bg-gradient-to-r from-light to-light/60 bg-clip-text text-transparent">
            Powered by AI
          </span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-light/70 sm:text-xl">
          Spare yourself unnecessary explanations and
          <br />
          stop leaving the learning guessing.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/auth/register"
            className="rounded-xl bg-light px-8 py-4 text-base font-semibold text-dark transition-all hover:bg-light-hover hover:scale-105 hover:shadow-[0_0px_40px_rgba(249,249,223,0.3)]"
          >
            Register
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light transition-all hover:border-light/40 hover:bg-light/5"
          >
            Log In
          </Link>
        </div>
        <p className="mt-12 text-sm text-light/50">
          Trusted by people from companies that create cool stuff
        </p>
      </div>
    </div>
  );
}
