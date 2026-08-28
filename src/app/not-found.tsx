import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Logo />
      <p className="text-sm text-zinc-400">That page is private or does not exist.</p>
      <Link href="/" className="rd-btn-ghost">
        Home
      </Link>
    </div>
  );
}
