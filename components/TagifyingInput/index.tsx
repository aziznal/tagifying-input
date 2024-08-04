"use client";

import { clamp, cn } from "@/lib/utils";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  value?: string[];
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
  value,
  onValueChange,
  tagSeparator,
  className,
}: TagifyingInputProps) => {
  const isControlled = value !== undefined;

  // internal state
  const [_tags, _setTags] = useState<string[]>(
    isControlled ? value : initialValue ?? [],
  );

  /** returns controlled external state if component is controlled, otherwise returns internal state */
  const tags = useMemo(() => {
    if (isControlled) return value;

    return _tags;
  }, [_tags, isControlled, value]);

  const setTags = useCallback(
    (newTags: string[]) => {
      if (isControlled) return onValueChange?.(newTags);

      _setTags(newTags);
    },
    [isControlled, onValueChange],
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const inputTextRef = useRef<HTMLSpanElement>(null);

  const [rawInputValue, setRawInputValue] = useState<string>("");

  const [focusedTagIndex, setFocusedTagIndex] = useState<number>(
    initialValue?.length ?? 0,
  );

  const onRawInputChange = (inputValue: string) => {
    setRawInputValue(inputValue);

    if (inputValue.length < 2) return;

    if (inputValue.at(-1) === (tagSeparator ?? DEFAULT_TAG_SEPARATOR)) {
      // text without the separator included
      const newTagText = inputValue.slice(0, inputValue.length - 1);

      const updatedTags = tags.toSpliced(focusedTagIndex, 0, newTagText);

      setTags(updatedTags);

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

  // if `value` prop is given i.e. component is *controlled*
  useEffect(() => {
    if (value === undefined) {
      return;
    }

    // internal setState must be used to avoid an infinte re-render loop
    _setTags(value);
  }, [value]);

  const removeTagAtIndex = useCallback(
    (tagIndex: number) => {
      const updatedTags = tags.toSpliced(tagIndex, 1);
      setTags(updatedTags);
    },
    [setTags, tags],
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
