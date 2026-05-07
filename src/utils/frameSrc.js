/**
 * Returns the public URL for a frame image.
 * Frames are stored in public/assets/frames/ and served at /assets/frames/.
 * Index is 0-based; file names are 1-based with 4-digit zero-padding.
 *
 * @param {number} i - 0-based frame index
 * @returns {string} URL path, e.g. "/assets/frames/frame_0001.webp"
 */
export function frameSrc(i) {
  return `/assets/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;
}
