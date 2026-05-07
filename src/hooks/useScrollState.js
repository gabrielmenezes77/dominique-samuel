import { useState, useCallback } from "react";

/**
 * useScrollState
 *
 * Manages scroll-driven UI state that is set by ScrollTrigger callbacks
 * inside useCanvasAnimation. Returns state values and stable setter callbacks.
 *
 * Returns:
 *   hintVisible      {boolean} — whether the scroll hint is visible
 *   headerScrolled   {boolean} — whether the header has the scrolled state
 *   setHintVisible   {function} — setter for hintVisible
 *   setHeaderScrolled {function} — setter for headerScrolled
 */
export default function useScrollState() {
  const [hintVisible, setHintVisibleState] = useState(false);
  const [headerScrolled, setHeaderScrolledState] = useState(false);

  const setHintVisible = useCallback((value) => {
    setHintVisibleState(value);
  }, []);

  const setHeaderScrolled = useCallback((value) => {
    setHeaderScrolledState(value);
  }, []);

  return { hintVisible, headerScrolled, setHintVisible, setHeaderScrolled };
}
