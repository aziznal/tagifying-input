import { TagifyingInput } from "@/components/TagifyingInput";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="flex flex-col gap-1">

      <label className="text-sm font-light">
        Tagifying Input
      </label>

      <TagifyingInput />
      </div>
    </div>
  );
}
