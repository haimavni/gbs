
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

let popupWindows = {};
export function popup(key, url, params) {
  let hnd = popupWindows[key];
  if (hnd) {
    hnd.close();
  }
  let w = popupWindows[key] = window.open(url, '_blank', params);
  let d = w.document;
  //d.bind('onloadeddata', onload);
  return w
}


