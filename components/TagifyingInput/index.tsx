"use client";

import { cn } from "@/lib/utils";
import { LucideX } from "lucide-react";
import { useRef, useState } from "react";

// TODO: make tag separator an inputtable param

interface TagifyingInputProps {
  initialValue?: string[];

  onValueChange?: (newValue: string[]) => void;

  className?: string;
}

const TAG_SEPARATOR = " ";

export const TagifyingInput = ({
  initialValue,
  onValueChange,
  className,
}: TagifyingInputProps) => {
  const [tags, setTags] = useState<string[]>(initialValue ?? []);

  const inputRef = useRef<HTMLInputElement>(null);

  const onRawInputChange = (value: string) => {
    if (value.length < 2) return;

    if (value.at(-1) === TAG_SEPARATOR) {
      const newTagText = value.slice(0, value.length - 1);

      setTags((tags) => [...tags, newTagText]);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removeTagAtIndex = (tagIndex: number) => {
    setTags((tags) => tags.toSpliced(tagIndex, 1));
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 relative border p-2 rounded-md w-[500px] overflow-x-auto",
        className,
      )}
    >
      {tags.map((tag, i) => (
        <Tag key={i} text={tag} onRemoved={() => removeTagAtIndex(i)} />
      ))}

      <input
        className="border-none outline-none grow"
        onChange={(event) => onRawInputChange(event.target.value)}
        ref={inputRef}
      />
    </div>
  );
};

interface TagProps {
  text: string;
  onRemoved?: () => void;
}

function Tag({ text, onRemoved }: TagProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <>
      {isFocused ? (
        <input value={text} />
      ) : (
        <div
          className="flex group relative px-3 hover:pl-1 hover:pr-5 transition-all py-0.5 bg-zinc-200 rounded-md text-zinc-800 cursor-pointer hover:bg-zinc-300 duration-75"
          onClick={onRemoved}
        >
          <span>{text}</span>

          <span
            className={cn(`
              opacity-0
              group-hover:opacity-100
              absolute
              right-0
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
