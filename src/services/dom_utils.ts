
export function getOffset(el) {
  if (!el) {
    return { left: 0, right: 0 };
  }
  let r = el.getBoundingClientRect();
  return {
    left: r.left + window.scrollX,
    top: r.top + window.scrollY
  }
}

export function this_page_url() {
  let url = document.URL;
  let parse = new URL(url);
  let path = parse.pathname + parse.hash;
  return path;
}

