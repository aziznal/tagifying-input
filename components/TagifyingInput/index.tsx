"use client";

import { clamp, cn } from "@/lib/utils";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Tag } from "./Tag";

// TODO: move between tags with arrow keys (how to handle this on mobile?)
// TODO: add different tag removal flow for mobile (maybe a double tap where the first tap triggers shows the X)
// TODO: add drag-n-drop re-ordering for tags.
// TODO: allow editable tags
// TODO: add flags for toggling ability for movement between tags, re-ordering tags, etc.

// BUG: on mobile, focusing / unfocusing the input causes keyboards
// to go and come back. This is particularly present after:
//
//  - writing the first tag
//
//  - after deleting the last remaining tag.

// Optimizations / Improvements / Ambitions that'll never actually happen probably:
//
//  - use strategy pattern for tag separation method?
//
//  - making component controllable (problematic part is the side-effects
//    generated at/after manipulationg tags.)

// BUG: deleting a whole word also deletes the previous tag.
//      Can be reproduced by typing something, pressing ctrl-a, then backspace.

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
 * - Focusing between tags with mouse / clicks
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

      setTags((tags) => {
        const updatedTags = tags.toSpliced(focusedTagIndex, 0, newTagText);

        onValueChange?.(updatedTags);

        return updatedTags;
      });

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

  const removeTagAtIndex = useCallback(
    (tagIndex: number) => {
      setTags((tags) => {
        const updatedTags = tags.toSpliced(tagIndex, 1);

        onValueChange?.(updatedTags);

        return updatedTags;
      });
    },
    [onValueChange],
  );

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
  }, [
    focusedTagIndex,
    moveToNextTag,
    moveToPrevTag,
    rawInputValue.length,
    removeTagAtIndex,
  ]);

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
        border
        p-2
        pr-32
        rounded-md
        overflow-x-auto

        gap-1

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
        // set focus after last tag if tag-input body is clicked randomly
        setFocusedTagIndex(tags.length);
        setTimeout(() => {
          inputRef.current?.focus();
        });
      }}
    >
      {/* input is only element */}
      {elements.tags.length === 0 && elements.input}

      {elements.tags.map((tag, i) => {
        return (
          <Fragment key={i}>
            {focusedTagIndex === i &&
              // input is somewhere between tags
              elements.input}

            {/* this is a div to make sure contained elements wrap to next lines together */}
            <div className="flex relative">
              {/* element for allowing focusing on a tag by clicking in front of it. */}
              {focusedTagIndex !== i && (
                <div
                  className="self-stretch absolute -left-[10%] h-full top-0 w-[8px]"
                  onClick={(event) => {
                    // to prevent from triggering parent and hence setting focus after last tag
                    event.stopPropagation();

                    setFocusedTagIndex(i);
                    setTimeout(() => {
                      inputRef.current?.focus();
                    });
                  }}
                />
              )}

              {/* The tag - here so your eyes don't gloss over it. */}
              {tag}
            </div>
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
