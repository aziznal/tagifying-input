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

  /** keeps track of the input where the user inputs text */
  const inputRef = useRef<HTMLInputElement>(null);

  /** keeps track of a hidden element used to manipulate the main input */
  const inputTextRef = useRef<HTMLSpanElement>(null);

  /** controls the value of the main input */
  const [rawInputValue, setRawInputValue] = useState<string>("");

  /** the index of the tag the cursor is currently at */
  const [cursorIndex, setCursorIndex] = useState<number>(
    initialValue?.length ?? 0,
  );

  const isMatchingTagSeparator = (value?: string): boolean => {
    return value === (tagSeparator ?? DEFAULT_TAG_SEPARATOR);
  };

  const onRawInputChange = (value: string) => {
    setRawInputValue(value);

    if (value.length < 2) return;

    if (!isMatchingTagSeparator(value.at(-1))) return;

    createNewTag(value);
  };

  const createNewTag = (value: string) => {
    const newTagText = value.slice(0, value.length - 1);

    setTags((tags) => {
      const updatedTags = tags.toSpliced(cursorIndex, 0, newTagText);

      onValueChange?.(updatedTags);

      return updatedTags;
    });

    // wherever the cursor is, it should focus on the next index after successfully adding a tag
    setCursorIndex((i) => i + 1);

    // clear and re-focus input (since it's pos will change after a new tag is added)
    if (inputRef.current) {
      setRawInputValue("");

      if (inputTextRef.current) inputTextRef.current.textContent = "";

      setTimeout(() => {
        inputRef.current?.focus();
      });
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
    if (cursorIndex >= tags.length) return;

    setCursorIndex((i) => i + 1);

    setTimeout(() => {
      inputRef.current?.focus();
    });
  }, [cursorIndex, tags.length]);

  // cursor moves outside left edge of input
  const moveToPrevTag = useCallback(() => {
    if (cursorIndex <= 0) return;

    setCursorIndex((i) => i - 1);

    setTimeout(() => {
      inputRef.current?.focus();
    });
  }, [cursorIndex]);

  /** keeping focused-index in check after every change to the tags array */
  useEffect(() => {
    setCursorIndex((i) => clamp(i, 0, tags.length));

    // NOTE: this constant re-focus is potentially problematic
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

      const isRangeSelected =
        (inputElement.selectionEnd ?? 0) -
          (inputElement.selectionStart ?? 0) !==
        0;

      if (cursorIsAtEnd && event.key === "ArrowRight") moveToNextTag();

      if (cursorIsAtStart && event.key === "ArrowLeft") moveToPrevTag();

      // checking for whether a range is selected because if the entire current input value
      // is selected (with ctrl/cmd + a, for example), then clicking backspace removes the
      // prev tag as well which is likely unintended behavior.
      if (cursorIsAtStart && event.key === "Backspace" && !isRangeSelected) {
        removeTagAtIndex(cursorIndex - 1);
        setCursorIndex(cursorIndex - 1);
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
    cursorIndex,
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
        setCursorIndex(tags.length);
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
            {cursorIndex === i &&
              // input is somewhere between tags
              elements.input}

            {/* this is a div to make sure contained elements wrap to next lines together */}
            <div className="flex relative">
              {/* element for allowing focusing on a tag by clicking in front of it. */}
              {cursorIndex !== i && (
                <div
                  className="self-stretch absolute -left-[10%] h-full top-0 w-[8px]"
                  onClick={(event) => {
                    // to prevent from triggering parent and hence setting focus after last tag
                    event.stopPropagation();

                    setCursorIndex(i);
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
        elements.tags.length === cursorIndex &&
        elements.input}
    </div>
  );
};
