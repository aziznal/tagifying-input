"use client";

import { clamp, cn } from "@/lib/utils";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Tag } from "./Tag";

// TODO: make component optionally controllable (value, onValueChange)
// TODO: move between tags with arrow keys (how to handle this on mobile?)
// TODO: add different tag removal flow for mobile (maybe a double tap where the first tap triggers shows the X)
// TODO: add drag-n-drop re-ordering for tags.
// TODO: allow focusing between tags with the mouse
// TODO: allow editable tags

// BUG: on mobile, focusing / unfocusing the input causes keyboards
// to go and come back. This is particularly present after:
//  - writing the first tag
//  - after deleting the last remaining tag.

// Optimizations / Improvements:
// use strategy pattern for tag separation method?

interface TagifyingInputProps {
  initialValue?: string[];
  onValueChange?: (newValue: string[]) => void;

  /** The character at which a new tag is created using the current text inputted */
  tagSeparator?: string;

  className?: string;
}

const DEFAULT_TAG_SEPARATOR = ",";

/**
 * An advanced tag-input.
 *
 * Features:
 * - Creating tags
 * - Navigation with the arrow keys
 * - Deleting specific tags with cursor or by clicking on tag
 * - Wrappable container
 * - Controllable input (`value`, `onValueChange`)
 *
 * Remove the `flex-wrap` tailwind class from the main wrapping div to prevent wrapping
 */
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
        `flex
        flex-wrap
        items-center
        gap-1
        border
        p-2
        pr-32
        rounded-md
        overflow-x-auto

        hover:outline
        hover:outline-1
        hover:outline-zinc-400
        focus-within:outline
        focus-within:outline-1
        focus-within:outline-zinc-400

        cursor-text`,
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
