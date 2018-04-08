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
    // INFO [Matt] Removed, as the URL API is not available in IE11.
    // let url = document.URL;
    // let parse = new URL(url);
    // let path = parse.pathname + parse.hash;
    return `${location.pathname}${location.hash}`;
}

export function highlight_doesntwork(html: String, keywords: Array<String>) {
    if (!keywords) {
        return html;
    }
    html = toUnicode(html);
    let pat_str = '\\b(' + keywords.join('|') + '\\b';
    pat_str = toUnicode(pat_str);
    ///let pat_str = '([^א-ת]*)(' + keywords.join('|') + ')([^א-ת]*)';
    let pat = new RegExp(pat_str, 'gi');
    return html.replace(pat, "$1<span class='highlight'>$2</span>$3");
}

export function highlight(html: String, keywords: Array<String>) {
    if (!keywords) {
        return html;
    }
    let pat_str = '([\\s,-]+)(' + keywords.join('|') + ')([\\s,;.-]+|$)';
    let pat = new RegExp(pat_str, 'gi');
    html = html.replace(pat, "$1<span class='highlighted'>$2</span>$3");  //do it twice for consecutive highlighted words
    return html.replace(pat, "$1<span class='highlighted'>$2</span>$3");
}

function toUnicode(theString) {
    let unicodeString = '';
    for (let i = 0; i < theString.length; i++) {
        let theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
        while (theUnicode.length < 4) {
            theUnicode = '0' + theUnicode;
        }
        theUnicode = '\\u' + theUnicode;
        unicodeString += theUnicode;
    }
    return unicodeString;
}

export function copy_to_clipboard(text) {
    const hiddenElement: HTMLTextAreaElement = document.createElement('textarea');
    hiddenElement.style.display = 'none !important;';
    hiddenElement.innerText = text;

    document.body.appendChild(hiddenElement);
    hiddenElement.select();

    document.execCommand('SelectAll');
    document.execCommand('Copy');

    document.body.removeChild(hiddenElement);
}



