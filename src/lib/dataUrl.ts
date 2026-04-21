/**
 * Synchronously convert a data: URL into a Blob without hitting the fetch API.
 *
 * Why: on production we ship a strict CSP whose connect-src intentionally
 * does NOT include `data:`. Some browsers honour that restriction for
 * `fetch('data:...')` and throw `TypeError: Failed to fetch`, killing any
 * code path that assumed the conversion would always work. This helper
 * parses the data URL with built-in primitives (atob + Uint8Array), so
 * it never issues a network request and CSP has nothing to veto.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  if (!header || b64 === undefined) {
    throw new Error("Invalid data URL");
  }
  const mimeMatch = header.match(/^data:([^;]+)/i);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
