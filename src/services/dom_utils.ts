
export function getOffset(el) {
    if (! el) {
        return {left: 0, right: 0};
    }
  let r = el.getBoundingClientRect();
  return {
    left: r.left + window.scrollX,
    top: r.top + window.scrollY
  }
}