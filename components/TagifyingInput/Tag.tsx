import { cn } from "@/lib/utils";
import { LucideX } from "lucide-react";
import { useState } from "react";

interface TagProps {
  text: string;
  onRemoved?: () => void;
}

export function Tag({ text, onRemoved }: TagProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <>
      {isFocused ? (
        <input value={text} />
      ) : (
        <div
          className="flex group relative px-3 hover:pl-1 hover:pr-5 transition-all py-0.5 bg-zinc-200 rounded-md text-zinc-800 cursor-pointer hover:bg-zinc-300 duration-75 whitespace-nowrap"
          onClick={onRemoved}
        >
          <span>{text}</span>

          <span
            className={cn(`
              opacity-0
              group-hover:opacity-100
              absolute
              right-1
              top-[50%]
              translate-y-[-50%]

              text-zinc-500
              bg-zinc-300

              rounded-md
              transition-all
              duration-75
`)}
          >
            <LucideX size={16} />
          </span>
        </div>
      )}
    </>
  );
}
