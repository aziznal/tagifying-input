"use client";

import { useEffect, useState } from "react";

type UseIsTouchScreenDevice = boolean;

type Props = {};

/** Returns true if current device supports a touch screen display */
export const useIsTouchScreenDevice = (
  props?: Props,
): UseIsTouchScreenDevice => {
  const [isTouchScreenDevice, setIsTouchScreenDevice] = useState(false);

  useEffect(() => {
    setIsTouchScreenDevice(
      (window !== undefined && "ontouchstart" in window) ||
        navigator.maxTouchPoints > 0,
    );
  }, []);

  return isTouchScreenDevice;
};
