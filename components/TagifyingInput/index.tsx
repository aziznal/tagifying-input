"use client";

import { clamp, cn } from "@/lib/utils";
import { LucideX } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

// TODO: make component optionally controllable (value, onValueChange)
// TODO: move between tags with arrow keys (how to handle this on mobile?)
// TODO: add different tag removal flow for mobile (maybe a double tap where the first tap triggers shows the X)

interface TagifyingInputProps {
  initialValue?: string[];
  onValueChange?: (newValue: string[]) => void;

  /** The character at which a new tag is created using the current text inputted */
  tagSeparator?: string;

  className?: string;
}

const DEFAULT_TAG_SEPARATOR = ",";

export const TagifyingInput = ({
  initialValue,
  onValueChange,
  tagSeparator,
  className,
}: TagifyingInputProps) => {
  const [tags, setTags] = useState<string[]>(initialValue ?? []);

  const inputRef = useRef<HTMLInputElement>(null);

  const [rawInputValue, setRawInputValue] = useState<string>("");

  const [focusedTagIndex, setFocusedTagIndex] = useState<number>(
    initialValue?.length ?? 0,
  );

  const onRawInputChange = (value: string) => {
    setRawInputValue(value);

    if (value.length < 2) return;

    if (value.at(-1) === (tagSeparator ?? DEFAULT_TAG_SEPARATOR)) {
      const newTagText = value.slice(0, value.length - 1);

      setTags((tags) => tags.toSpliced(focusedTagIndex, 0, newTagText));

      setFocusedTagIndex((i) => i + 1);

      if (inputRef.current) {
        setRawInputValue("");

        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  };

  const removeTagAtIndex = (tagIndex: number) => {
    setTags((tags) => tags.toSpliced(tagIndex, 1));
  };

  // cursor moves outside right edge of input
  const moveToNextTag = () => {
    if (focusedTagIndex >= tags.length) return;
    setFocusedTagIndex((i) => i + 1);
  };

  // cursor moves outside left edge of input
  const moveToPrevTag = () => {
    if (focusedTagIndex <= 0) return;
    setFocusedTagIndex((i) => i - 1);
  };

  /** keeping focused-index in check after every change to the tags array */
  useEffect(() => {
    setFocusedTagIndex((i) => clamp(i, 0, tags.length));

    setTimeout(() => {
      inputRef.current?.focus();
    });
  }, [tags]);

  // Cursor & Focus change
  useEffect(() => {
    if (!inputRef.current) return;

    const handleCursorChange = (event: KeyboardEvent) => {
      if (!inputRef.current) return;

      const cursorOffset = inputRef.current.selectionStart;
      const cursorIsAtEnd = cursorOffset === rawInputValue.length;
      const cursorIsAtStart = cursorOffset === 0;

      if (cursorIsAtEnd && event.key === "ArrowRight") moveToNextTag();

      if (cursorIsAtStart && event.key === "ArrowLeft") moveToPrevTag();

      if (cursorIsAtStart && event.key === "Backspace")
        removeTagAtIndex(focusedTagIndex - 1);

      setTimeout(() => {
        inputRef.current?.focus();
      });
    };

    inputRef.current.addEventListener("keydown", handleCursorChange);

    return () => {
      inputRef.current?.removeEventListener("keydown", handleCursorChange);
    };
  }, [focusedTagIndex]);

  const elements = {
    tags: tags.map((tag, i) => (
      <Tag key={i} text={tag} onRemoved={() => removeTagAtIndex(i)} />
    )),
    input: (
      <input
        className={cn(
          "bg-transparent outline-none",
          focusedTagIndex !== 0 && focusedTagIndex === tags.length
            ? // input is last element
              "grow"
            : // input is at beginning or in center
              "w-[10px]",
        )}
        onChange={(event) => onRawInputChange(event.target.value)}
        value={rawInputValue}
        ref={inputRef}
      />
    ),
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 relative border p-2 rounded-md overflow-x-auto focus-within:border-2 cursor-text",
        className,
      )}
      onClick={() => {
        inputRef.current?.focus();
      }}
    >
      {/* input is only element */}
      {elements.tags.length === 0 && elements.input}

      {elements.tags.map((tag, i) => {
        return (
          <Fragment key={i}>
            {/* input is somewhere between tags */}
            {focusedTagIndex === i && elements.input}
            {tag}
          </Fragment>
        );
      })}

      {/* input is last element */}
      {elements.tags.length !== 0 &&
        elements.tags.length === focusedTagIndex &&
        elements.input}
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
