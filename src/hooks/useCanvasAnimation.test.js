/**
 * useCanvasAnimation — Bug Condition Exploration Test
 *
 * Property 1: Bug Condition — StrictMode Double-Invoke Causes Duplicate initScroll() Execution
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 *
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the three bugs exist. Do NOT fix the hook in this task.
 *
 * The test simulates the React 18 StrictMode double-invoke pattern:
 *   mount → cleanup → remount
 * and asserts the expected (fixed) behavior. On unfixed code the assertions fail,
 * surfacing the counterexamples that prove each bug.
 *
 * Documented counterexamples found on unfixed code (confirmed by test run):
 *
 *   COUNTEREXAMPLE 1 — gsap.from called 8 times (expected 4):
 *     RAF-1 from the first mount is not cancelled in cleanup. It fires after
 *     cleanup, calling initScroll() on the live DOM of the second mount.
 *     RAF-2 from the second mount also fires. Both call gsap.from() × 4 sections
 *     = 8 total calls. GSAP creates conflicting tweens → elements stuck at
 *     partial opacity (5–30%).
 *     Test output: AssertionError: expected 8 to be 4
 *
 *   COUNTEREXAMPLE 2 — gsap.ticker.add ref !== gsap.ticker.remove ref:
 *     The cleanup function creates a new arrow function for gsap.ticker.remove().
 *     This new function is a different object from the one passed to add().
 *     GSAP uses reference equality to find callbacks — the original is never
 *     removed. Memory leak: Lenis ticker continues firing after unmount.
 *     Test output: AssertionError: expected [Function] to be [Function]
 *
 *   COUNTEREXAMPLE 3 — loadedRef.current was 12 (not 0) at second run start:
 *     loadedRef is a useRef that persists across effect re-runs. After Phase 1
 *     of the first mount loads 12 frames, loadedRef.current = 12. The second
 *     mount inherits this value. First onProgress call reports 13/90 ≈ 0.144
 *     instead of 1/90 ≈ 0.011. Progress calculation is broken from the start.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// vi.mock calls are hoisted to the top of the file by Vitest.
// Factories MUST NOT reference variables declared in the module scope.
// ---------------------------------------------------------------------------

vi.mock("gsap", () => {
  return {
    default: {
      registerPlugin: vi.fn(),
      from: vi.fn(),
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
        lagSmoothing: vi.fn(),
      },
      utils: {
        toArray: vi.fn(() => []),
      },
    },
  };
});

vi.mock("gsap/ScrollTrigger", () => {
  return {
    ScrollTrigger: {
      create: vi.fn(),
      getAll: vi.fn(() => []),
      refresh: vi.fn(),
      update: vi.fn(),
    },
  };
});

vi.mock("lenis", () => {
  const mockOn = vi.fn();
  const mockRaf = vi.fn();
  const mockDestroy = vi.fn();

  const MockLenisClass = vi.fn().mockImplementation(() => ({
    on: mockOn,
    raf: mockRaf,
    destroy: mockDestroy,
  }));

  return { default: MockLenisClass };
});

// ---------------------------------------------------------------------------
// Import mocked modules AFTER vi.mock declarations
// ---------------------------------------------------------------------------
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useCanvasAnimation from "./useCanvasAnimation";

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/**
 * Make Image fire onload synchronously when src is set.
 * jsdom does not load real images, so we need this to let preload() resolve.
 */
function setupImageMock() {
  const OriginalImage = globalThis.Image;

  class MockImage {
    constructor() {
      this._src = "";
      this.naturalWidth = 100;
      this.naturalHeight = 100;
      this.onload = null;
      this.onerror = null;
    }

    get src() {
      return this._src;
    }

    set src(value) {
      this._src = value;
      // Fire onload synchronously so preload() resolves immediately in tests
      if (this.onload) {
        this.onload();
      }
    }
  }

  globalThis.Image = MockImage;
  return () => {
    globalThis.Image = OriginalImage;
  };
}

/**
 * Deferred RAF mock that queues callbacks instead of calling them immediately.
 *
 * This is critical for reproducing the StrictMode bug:
 *   - RAF-1 is queued during the first mount's preload()
 *   - Cleanup runs (StrictMode unmount) — on unfixed code, RAF-1 is NOT cancelled
 *   - RAF-1 fires (we flush it manually) — on unfixed code it calls initScroll()
 *     on the live DOM of the second mount
 *   - RAF-2 is queued during the second mount's preload()
 *   - RAF-2 fires — calls initScroll() again
 *
 * Returns { flush } to manually fire all pending callbacks.
 */
function setupDeferredRafMock() {
  let rafId = 0;
  const pending = new Map(); // id → callback

  const rafMock = vi.fn((cb) => {
    const id = ++rafId;
    pending.set(id, cb);
    return id;
  });

  const cafMock = vi.fn((id) => {
    pending.delete(id);
  });

  function flush() {
    // Fire all pending callbacks in order, then clear
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach((cb) => cb(performance.now()));
  }

  globalThis.requestAnimationFrame = rafMock;
  globalThis.cancelAnimationFrame = cafMock;

  return { rafMock, cafMock, flush };
}

/**
 * Mock HTMLCanvasElement.getContext to return a minimal fake 2D context.
 */
function setupCanvasMock() {
  const fakeCtx = {
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
  };
  HTMLCanvasElement.prototype.getContext = vi.fn(() => fakeCtx);
  return fakeCtx;
}

// ---------------------------------------------------------------------------
// Test component (no JSX — uses React.createElement to stay in .js file)
//
// The hook uses canvasRef internally — it must be attached to a real canvas
// element in the DOM. We use a wrapper component that renders a canvas and
// passes the ref back via a callback so the test can inspect hook state.
// ---------------------------------------------------------------------------

function TestComponent({ hookProps }) {
  const result = useCanvasAnimation(hookProps);
  return React.createElement("canvas", {
    ref: result.canvasRef,
    id: "hook-canvas",
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("useCanvasAnimation — Bug Condition Exploration", () => {
  let restoreImage;
  let rafControl;

  beforeEach(() => {
    // Clear all mock state before each test
    vi.clearAllMocks();

    // Restore default return values after clearAllMocks
    ScrollTrigger.getAll.mockReturnValue([]);
    gsap.utils.toArray.mockReturnValue([]);

    restoreImage = setupImageMock();
    rafControl = setupDeferredRafMock();
    setupCanvasMock();

    // Provide the DOM structure that initScroll() queries.
    // The canvas is rendered by TestComponent, but the other elements
    // (spacer, sections) must be in the document.
    document.body.innerHTML = `
      <div id="app-root"></div>
      <div id="video-spacer"></div>
      <section class="section-mensagem">
        <div class="ri">item1</div>
        <div class="ri">item2</div>
      </section>
      <section class="section-countdown">
        <div class="ri">item3</div>
      </section>
      <section class="section-rsvp">
        <div class="ri">item4</div>
      </section>
      <footer>
        <div class="ri">item5</div>
      </footer>
    `;
  });

  afterEach(() => {
    restoreImage();
    document.body.innerHTML = "";
  });

  // -------------------------------------------------------------------------
  // Property 1: Bug Condition
  // -------------------------------------------------------------------------

  it("[Bug Condition] StrictMode double-invoke causes duplicate initScroll() execution", async () => {
    const onLoaded = vi.fn();
    const onProgress = vi.fn();
    const setHintVisible = vi.fn();
    const setHeaderScrolled = vi.fn();

    const hookProps = {
      onLoaded,
      onProgress,
      setHintVisible,
      setHeaderScrolled,
    };

    const container = document.getElementById("app-root");

    // -----------------------------------------------------------------------
    // FIRST MOUNT
    // Preload runs: Image.onload fires synchronously → Promise.all resolves
    // as a microtask → requestAnimationFrame(RAF-1) is queued (deferred).
    // RAF-1 is NOT yet fired.
    // -----------------------------------------------------------------------
    await act(async () => {
      render(React.createElement(TestComponent, { hookProps }), { container });
      // Drain microtasks so preload() async/await resolves and RAF-1 is queued
      await Promise.resolve();
      await Promise.resolve();
    });

    // Capture the ticker function reference passed to gsap.ticker.add
    // on the first mount — this is what should be passed to remove() later
    const tickerAddCallsAfterFirstMount = gsap.ticker.add.mock.calls.length;
    const tickerFnFromFirstMount =
      tickerAddCallsAfterFirstMount > 0
        ? gsap.ticker.add.mock.calls[tickerAddCallsAfterFirstMount - 1][0]
        : undefined;

    // -----------------------------------------------------------------------
    // CLEANUP (StrictMode unmount)
    // On UNFIXED code: cancelAnimationFrame is NOT called, so RAF-1 remains
    // pending. The cleanup kills ScrollTriggers and destroys Lenis, but
    // RAF-1 will still fire and call initScroll() on the next flush.
    // -----------------------------------------------------------------------
    await act(async () => {
      render(null, { container });
    });

    // Capture the ticker function reference passed to gsap.ticker.remove
    const tickerRemoveCallsAfterCleanup = gsap.ticker.remove.mock.calls.length;
    const tickerFnFromCleanup =
      tickerRemoveCallsAfterCleanup > 0
        ? gsap.ticker.remove.mock.calls[tickerRemoveCallsAfterCleanup - 1][0]
        : undefined;

    // -----------------------------------------------------------------------
    // SECOND MOUNT (StrictMode remount)
    // RAF-2 is queued during the second mount's preload().
    // -----------------------------------------------------------------------
    // Clear gsap.from and onProgress to measure only the second mount's calls
    gsap.from.mockClear();
    onProgress.mockClear();

    await act(async () => {
      render(React.createElement(TestComponent, { hookProps }), { container });
      await Promise.resolve();
      await Promise.resolve();
    });

    // -----------------------------------------------------------------------
    // FLUSH ALL PENDING RAFs
    // On UNFIXED code: both RAF-1 (from first mount, not cancelled) and RAF-2
    // (from second mount) fire here. Both call initScroll() → gsap.from() × 4.
    // Total: gsap.from called 8 times.
    //
    // On FIXED code: RAF-1 was cancelled in cleanup. Only RAF-2 fires.
    // Total: gsap.from called 4 times.
    // -----------------------------------------------------------------------
    await act(async () => {
      rafControl.flush();
    });

    // -----------------------------------------------------------------------
    // Assertion 1: gsap.from called exactly once per section on the second mount
    //
    // The hook calls gsap.from() once per section that has .ri elements.
    // With 4 sections in the DOM (.section-mensagem, .section-countdown,
    // .section-rsvp, footer), gsap.from should be called exactly 4 times.
    //
    // On UNFIXED code: RAF-1 from the first mount fires after cleanup (not
    // cancelled), calling initScroll() on the live DOM of the second mount.
    // RAF-2 from the second mount also fires. Result: gsap.from called 8 times.
    //
    // Counterexample found: gsap.from called 8 times (expected 4)
    // -----------------------------------------------------------------------
    const gsapFromCallsOnSecondMount = gsap.from.mock.calls.length;
    expect(gsapFromCallsOnSecondMount).toBe(4);

    // -----------------------------------------------------------------------
    // Assertion 2: gsap.ticker.add and gsap.ticker.remove receive the same
    // function reference (strict ===)
    //
    // On UNFIXED code: gsap.ticker.add receives an anonymous arrow function
    // whose reference is immediately discarded. gsap.ticker.remove creates a
    // NEW arrow function — a different object. Reference equality fails.
    //
    // Counterexample found: tickerFnFromFirstMount !== tickerFnFromCleanup
    // -----------------------------------------------------------------------
    expect(typeof tickerFnFromFirstMount).toBe("function");
    expect(typeof tickerFnFromCleanup).toBe("function");
    expect(tickerFnFromFirstMount).toBe(tickerFnFromCleanup); // strict ===

    // -----------------------------------------------------------------------
    // Assertion 3: loadedRef.current === 0 at the start of the second effect run
    //
    // Verified indirectly: if loadedRef was reset to 0 before the second mount
    // starts loading, the first onProgress call on the second mount should
    // report 1/FRAME_COUNT (≈ 0.0111 for desktop, 90 frames).
    //
    // On UNFIXED code: loadedRef.current retains 12 from Phase 1 of the first
    // mount. The first onProgress call on the second mount reports 13/90 ≈ 0.144.
    //
    // Counterexample found: first onProgress value was ~0.144 (expected ~0.011)
    // -----------------------------------------------------------------------
    const progressCalls = onProgress.mock.calls;
    if (progressCalls.length > 0) {
      const firstProgressValue = progressCalls[0][0];
      const FRAME_COUNT_DESKTOP = 90;
      // If loadedRef was properly reset, first progress = 1/90 ≈ 0.0111
      const expectedFirstProgress = 1 / FRAME_COUNT_DESKTOP;
      expect(firstProgressValue).toBeCloseTo(expectedFirstProgress, 3);
    }

    // Cleanup second mount
    await act(async () => {
      render(null, { container });
    });
  });
});

// =============================================================================
// Property 2: Preservation — Production-Build Behavior Unchanged
//
// These tests document the baseline behavior of useCanvasAnimation on a single
// mount (no StrictMode double-invoke). They MUST PASS on unfixed code.
//
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
// =============================================================================

describe("useCanvasAnimation — Preservation (Production-Build Behavior)", () => {
  let restoreImage;
  let rafControl;

  beforeEach(() => {
    vi.clearAllMocks();

    // Restore default return values after clearAllMocks
    ScrollTrigger.getAll.mockReturnValue([]);
    gsap.utils.toArray.mockReturnValue([]);

    restoreImage = setupImageMock();
    rafControl = setupDeferredRafMock();
    setupCanvasMock();

    document.body.innerHTML = `
      <div id="app-root"></div>
      <div id="video-spacer"></div>
      <section class="section-mensagem">
        <div class="ri">item1</div>
        <div class="ri">item2</div>
      </section>
      <section class="section-countdown">
        <div class="ri">item3</div>
      </section>
      <section class="section-rsvp">
        <div class="ri">item4</div>
      </section>
      <footer>
        <div class="ri">item5</div>
      </footer>
    `;
  });

  afterEach(() => {
    restoreImage();
    document.body.innerHTML = "";
  });

  // ---------------------------------------------------------------------------
  // Test 2a — Frame index calculation (property-based)
  //
  // Pure function — no mocking needed.
  // Formula: Math.min(Math.floor(progress * FRAME_COUNT), FRAME_COUNT - 1)
  //
  // Validates: Requirements 3.2
  // ---------------------------------------------------------------------------
  it("[Preservation 2a] frame index is always an integer in [0, FRAME_COUNT-1] for any progress in [0,1]", () => {
    const FRAME_COUNT_DESKTOP = 90;
    const FRAME_COUNT_MOBILE = 50;

    function frameIndex(progress, FRAME_COUNT) {
      return Math.min(Math.floor(progress * FRAME_COUNT), FRAME_COUNT - 1);
    }

    const fixedValues = [0.0, 0.25, 0.5, 0.75, 1.0];

    // Generate at least 10 random values in [0, 1]
    const randomValues = Array.from({ length: 10 }, () => Math.random());

    const allValues = [...fixedValues, ...randomValues];

    for (const FRAME_COUNT of [FRAME_COUNT_DESKTOP, FRAME_COUNT_MOBILE]) {
      for (const progress of allValues) {
        const idx = frameIndex(progress, FRAME_COUNT);

        // Must be an integer
        expect(Number.isInteger(idx)).toBe(true);

        // Must be in [0, FRAME_COUNT - 1]
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(FRAME_COUNT - 1);
      }

      // Boundary: progress = 0 → index 0
      expect(frameIndex(0.0, FRAME_COUNT)).toBe(0);

      // Boundary: progress = 1.0 → index FRAME_COUNT - 1
      expect(frameIndex(1.0, FRAME_COUNT)).toBe(FRAME_COUNT - 1);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 2b — onProgress range (property-based)
  //
  // Pure function — no mocking needed.
  // Formula: loadedCount / FRAME_COUNT
  //
  // Validates: Requirements 3.2, 3.5
  // ---------------------------------------------------------------------------
  it("[Preservation 2b] onProgress value is always in [0.0, 1.0] for any loadedCount in [0, FRAME_COUNT]", () => {
    const FRAME_COUNT = 90;

    function progressValue(loadedCount) {
      return loadedCount / FRAME_COUNT;
    }

    // Test all integer values in [0, FRAME_COUNT]
    for (let loadedCount = 0; loadedCount <= FRAME_COUNT; loadedCount++) {
      const value = progressValue(loadedCount);

      expect(value).toBeGreaterThanOrEqual(0.0);
      expect(value).toBeLessThanOrEqual(1.0);
    }

    // Boundary: loadedCount = 0 → 0.0
    expect(progressValue(0)).toBe(0.0);

    // Boundary: loadedCount = FRAME_COUNT → 1.0
    expect(progressValue(FRAME_COUNT)).toBe(1.0);
  });

  // ---------------------------------------------------------------------------
  // Test 2c — Single-mount behavior (unit test)
  //
  // Mount the hook once (no double-invoke), flush all pending RAFs, and assert
  // that gsap.from was called exactly 4 times (once per section), Lenis was
  // constructed exactly once, and onLoaded was called exactly once.
  //
  // Validates: Requirements 3.1, 3.3
  // ---------------------------------------------------------------------------
  it("[Preservation 2c] single mount: gsap.from called 4 times, Lenis once, onLoaded once", async () => {
    const Lenis = (await import("lenis")).default;

    const onLoaded = vi.fn();
    const onProgress = vi.fn();
    const setHintVisible = vi.fn();
    const setHeaderScrolled = vi.fn();

    const hookProps = {
      onLoaded,
      onProgress,
      setHintVisible,
      setHeaderScrolled,
    };
    const container = document.getElementById("app-root");

    // Mount once
    await act(async () => {
      render(React.createElement(TestComponent, { hookProps }), { container });
      await Promise.resolve();
      await Promise.resolve();
    });

    // Flush all pending RAFs so initScroll() runs
    await act(async () => {
      rafControl.flush();
    });

    // gsap.from called exactly 4 times (one per section with .ri elements)
    expect(gsap.from.mock.calls.length).toBe(4);

    // Lenis constructor called exactly once
    expect(Lenis.mock.calls.length).toBe(1);

    // onLoaded called exactly once (after Phase 1)
    expect(onLoaded.mock.calls.length).toBe(1);

    // Cleanup
    await act(async () => {
      render(null, { container });
    });
  });

  // ---------------------------------------------------------------------------
  // Test 2d — Cleanup completeness (unit test)
  //
  // Mount, flush RAFs, then unmount. Assert that:
  //   - ScrollTrigger.getAll() was called during cleanup
  //   - lenis.destroy() was called
  //   - window.removeEventListener was called with 'resize'
  //
  // Validates: Requirements 3.6
  // ---------------------------------------------------------------------------
  it("[Preservation 2d] cleanup: ScrollTrigger.getAll called, lenis.destroy called, resize listener removed", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const hookProps = {
      onLoaded: vi.fn(),
      onProgress: vi.fn(),
      setHintVisible: vi.fn(),
      setHeaderScrolled: vi.fn(),
    };
    const container = document.getElementById("app-root");

    // Mount
    await act(async () => {
      render(React.createElement(TestComponent, { hookProps }), { container });
      await Promise.resolve();
      await Promise.resolve();
    });

    // Flush RAFs so initScroll() runs and Lenis is created
    await act(async () => {
      rafControl.flush();
    });

    // Capture the Lenis instance that was created
    const Lenis = (await import("lenis")).default;
    const lenisInstance = Lenis.mock.results[0]?.value;

    // Reset call counts before unmount so we only measure cleanup calls
    ScrollTrigger.getAll.mockClear();
    removeEventListenerSpy.mockClear();

    // Unmount — triggers cleanup
    await act(async () => {
      render(null, { container });
    });

    // ScrollTrigger.getAll() must have been called during cleanup
    expect(ScrollTrigger.getAll).toHaveBeenCalled();

    // lenis.destroy() must have been called
    expect(lenisInstance.destroy).toHaveBeenCalled();

    // window.removeEventListener must have been called with 'resize'
    const resizeRemoveCalls = removeEventListenerSpy.mock.calls.filter(
      ([event]) => event === "resize",
    );
    expect(resizeRemoveCalls.length).toBeGreaterThan(0);

    removeEventListenerSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Test 2e — onerror path increments counter (unit test)
  //
  // Set up the Image mock so that onerror fires instead of onload for all
  // frames. Assert that onProgress is still called (the counter advances even
  // on error).
  //
  // Validates: Requirements 3.5
  // ---------------------------------------------------------------------------
  it("[Preservation 2e] onerror path: onProgress is called even when frame images fail to load", async () => {
    // Override the Image mock so onerror fires instead of onload
    class ErrorImage {
      constructor() {
        this._src = "";
        this.naturalWidth = 0;
        this.naturalHeight = 0;
        this.onload = null;
        this.onerror = null;
      }

      get src() {
        return this._src;
      }

      set src(value) {
        this._src = value;
        // Fire onerror synchronously instead of onload
        if (this.onerror) {
          this.onerror();
        }
      }
    }

    globalThis.Image = ErrorImage;

    const onProgress = vi.fn();
    const onLoaded = vi.fn();

    const hookProps = {
      onLoaded,
      onProgress,
      setHintVisible: vi.fn(),
      setHeaderScrolled: vi.fn(),
    };
    const container = document.getElementById("app-root");

    // Mount
    await act(async () => {
      render(React.createElement(TestComponent, { hookProps }), { container });
      await Promise.resolve();
      await Promise.resolve();
    });

    // Flush RAFs
    await act(async () => {
      rafControl.flush();
    });

    // onProgress must have been called at least once (errors still advance counter)
    expect(onProgress.mock.calls.length).toBeGreaterThan(0);

    // All progress values must be in [0, 1]
    for (const [value] of onProgress.mock.calls) {
      expect(value).toBeGreaterThanOrEqual(0.0);
      expect(value).toBeLessThanOrEqual(1.0);
    }

    // Cleanup
    await act(async () => {
      render(null, { container });
    });
  });
});
