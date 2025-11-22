import Link from 'next/link';

export default function HomePage() {
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark font-sans">
      <div className="text-center">
        <h1 className="mb-8 text-4xl font-bold text-light">
          Welcome to CortexEx
        </h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="rounded-md bg-light text-dark px-6 py-3 font-medium hover:bg-light-hover focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="rounded-md bg-light px-6 py-3 font-medium text-dark hover:bg-light-hover focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
