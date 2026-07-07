/**
 * DOM side of the shape anchors: sections register the element each voxel
 * shape should occupy. Deliberately dependency-free — section components
 * import this from the main bundle, so it must never pull in three.js.
 * The WebGL chunk reads the registry through resolveAnchor (anchors.ts).
 */

const els = new Map<string, HTMLElement>();

export function registerAnchor(id: string, el: HTMLElement | null) {
  if (el) els.set(id, el);
  else els.delete(id);
}

/** React callback-ref helper: <div ref={anchorRef('craft-0')} /> */
export function anchorRef(id: string) {
  return (el: HTMLElement | null) => registerAnchor(id, el);
}

export function getAnchorEl(id: string): HTMLElement | undefined {
  return els.get(id);
}
