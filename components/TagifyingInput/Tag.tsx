import { useIsTouchScreenDevice } from "@/hooks/useIsTouchScreenDevice";
import { cn } from "@/lib/utils";
import { LucideX } from "lucide-react";
import { useCallback, useState } from "react";

interface TagProps {
  text: string;
  onRemoved?: () => void;
}

export function Tag({ text, onRemoved }: TagProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRemoveUiShown, setIsRemoveUiShown] = useState(false);

  const isTouchScreen = useIsTouchScreenDevice();

  const showRemoveUi = useCallback(() => {
    if (isRemoveUiShown) return;

    setIsRemoveUiShown(true);
  }, [setIsRemoveUiShown]);

  const hideRemoveUi = useCallback(() => {
    if (!isRemoveUiShown) return;

    setIsRemoveUiShown(false);
  }, [setIsRemoveUiShown, isRemoveUiShown]);

  const handleOnClick = useCallback(() => {
    {
      if (!isTouchScreen) onRemoved?.();

      if (isTouchScreen) {
        if (isRemoveUiShown) onRemoved?.();
        else showRemoveUi();
      }
    }
  }, [isTouchScreen, isRemoveUiShown, onRemoved, showRemoveUi]);

  return (
    <>
      {isFocused ? (
        <input value={text} />
      ) : (
        <div
          className={cn(
            "flex group relative px-3 transition-all duration-75 py-0.5 bg-zinc-200 rounded-md text-zinc-800 cursor-pointer whitespace-nowrap",

            !isTouchScreen && "hover:pl-1 hover:pr-5 hover:bg-zinc-300",

            isTouchScreen && isRemoveUiShown && "pl-1 pr-5 bg-zinc-300",
          )}
          onClick={handleOnClick}
          // required for onBlur to work
          tabIndex={0}
          onBlur={hideRemoveUi}
        >
          <span>{text}</span>

          <span
            className={cn(
              "opacity-0 absolute right-1 top-[50%] translate-y-[-50%] text-zinc-500 bg-zinc-300 rounded-md transition-all duration-75",

              !isTouchScreen && "group-hover:opacity-100",

              isTouchScreen && isRemoveUiShown && "opacity-100",
            )}
          >
            <LucideX size={16} />
          </span>
        </div>
      )}
    </>
  );
}
