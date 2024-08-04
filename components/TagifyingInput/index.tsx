"use client";

import { clamp, cn } from "@/lib/utils";
import { LucideX } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

// TODO: make component optionally controllable (value, onValueChange)
// TODO: move between tags with arrow keys (how to handle this on mobile?)
// TODO: add different tag removal flow for mobile (maybe a double tap where the first tap triggers shows the X)
// TODO: add drag-n-drop re-ordering for tags.

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
  const inputTextRef = useRef<HTMLSpanElement>(null);

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
        if (inputTextRef.current) inputTextRef.current.textContent = "";

        setTimeout(() => {
          inputRef.current?.focus();
        });
      }
    }
  };

  const removeTagAtIndex = (tagIndex: number) => {
    setTags((tags) => tags.toSpliced(tagIndex, 1));
  };

  // cursor moves outside right edge of input
  const moveToNextTag = useCallback(() => {
    if (focusedTagIndex >= tags.length) return;
    setFocusedTagIndex((i) => i + 1);
    setTimeout(() => {
      inputRef.current?.focus();
    });
  }, [focusedTagIndex, tags.length]);

  // cursor moves outside left edge of input
  const moveToPrevTag = useCallback(() => {
    if (focusedTagIndex <= 0) return;
    setFocusedTagIndex((i) => i - 1);
    setTimeout(() => {
      inputRef.current?.focus();
    });
  }, [focusedTagIndex]);

  /** keeping focused-index in check after every change to the tags array */
  useEffect(() => {
    setFocusedTagIndex((i) => clamp(i, 0, tags.length));

    setTimeout(() => {
      inputRef.current?.focus();
    });
  }, [tags.length]);

  // Cursor & Focus change
  useEffect(() => {
    const inputElement = inputRef.current;

    if (!inputElement) return;

    const handleCursorChange = (event: KeyboardEvent) => {
      const cursorOffset = inputElement.selectionStart;
      const cursorIsAtEnd = cursorOffset === rawInputValue.length;
      const cursorIsAtStart = cursorOffset === 0;

      if (cursorIsAtEnd && event.key === "ArrowRight") moveToNextTag();

      if (cursorIsAtStart && event.key === "ArrowLeft") moveToPrevTag();

      if (cursorIsAtStart && event.key === "Backspace") {
        removeTagAtIndex(focusedTagIndex - 1);
        setFocusedTagIndex(focusedTagIndex - 1);
      }

      setTimeout(() => {
        inputElement.focus();
      });
    };

    inputElement.addEventListener("keydown", handleCursorChange);

    return () => {
      inputElement.removeEventListener("keydown", handleCursorChange);
    };
  }, [focusedTagIndex, moveToNextTag, moveToPrevTag, rawInputValue.length]);

  const elements = {
    tags: tags.map((tag, i) => (
      <Tag key={i} text={tag} onRemoved={() => removeTagAtIndex(i)} />
    )),
    input: (
      <div>
        <input
          className={cn("bg-transparent outline-none")}
          style={{
            width: `${(inputTextRef.current?.clientWidth ?? 10) + 20}px`,
          }}
          onChange={(event) => onRawInputChange(event.target.value)}
          value={rawInputValue}
          ref={inputRef}
        />

        <span
          ref={inputTextRef}
          className="w-fit absolute pointer-events-none cursor-none opacity-0"
        >
          {rawInputValue}
        </span>
      </div>
    ),
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 border p-2 pr-32 rounded-md overflow-x-auto focus-within:border-2 cursor-text",
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
