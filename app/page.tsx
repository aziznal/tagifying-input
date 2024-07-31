import { TagifyingInput } from "@/components/TagifyingInput";
import { LucideGithub } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col justify-center w-full max-w-[500px] gap-1">
        <label className="font-light">Tagifying Input</label>

        <TagifyingInput
          initialValue={["Tag1", "Tag2", "Tag3"]}
        />
      </div>

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
    </div>
  );
}
