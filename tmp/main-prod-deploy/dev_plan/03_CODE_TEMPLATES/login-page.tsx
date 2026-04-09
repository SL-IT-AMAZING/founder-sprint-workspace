import { signInWithLinkedIn } from "@/actions/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-lg border border-dark-12">
        <h1 className="text-2xl font-heading mb-6 text-center">Sign In</h1>
        <form action={signInWithLinkedIn}>
          <button
            type="submit"
            className="w-full h-12 px-6 bg-dark text-cream rounded-md font-medium flex items-center justify-center gap-2"
          >
            Sign in with LinkedIn
          </button>
        </form>
      </div>
    </div>
  );
}
