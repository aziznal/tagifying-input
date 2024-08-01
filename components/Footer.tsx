import { LucideGithub } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <div className="text-center w-full mt-16 flex flex-wrap gap-1 items-center justify-center">
      <span>Made by</span>

      <Link
        href="https://github.com/aziznal/my-link-tree"
        target="_blank"
        className="flex gap-2 hover:text-rose-700 text-rose-500"
      >
        aziznal <LucideGithub />
      </Link>
    </div>
  );
}
