export function getOffset(el) {
    if (!el) {
        return { left: 0, top: 0 };
    }
    let r = el.getBoundingClientRect();
    return {
        left: r.left + window.scrollX,
        top: r.top + window.scrollY
    }
}

export function highlight(html: String, keywords: Array<String>, whole_words) {
    if (!keywords) {
        return html;
    }
    //keywords = keywords.filter(kw=>kw.length>0);
    let kws = [];
    for (let kw of keywords) {
        if (kw && kw.length > 0) {
            kws.push(kw)
        }
    }
    if (kws.length == 0) return html;
    keywords = kws;
    if (whole_words) {
        //let pat_str = '([\\s,.;()\'-]+|^)(' + keywords.join('|') + ')([\\s,;.()\'-]+|$)';
        let pat_str = '([^א-תa-zA-Z0-9]+|^)(' + keywords.join('|') + ')([^א-תa-zA-Z0-9\']+|$)';
        let pat = new RegExp(pat_str, 'gi');
        html = html.replace(pat, "$1<span class='highlighted'>$2</span>$3");  //do it twice for consecutive highlighted words
        return html.replace(pat, "$1<span class='highlighted'>$2</span>$3");
    } else {
        let pat_str = '(' + keywords.join('|') + ')';
        let pat = new RegExp(pat_str, 'gi');
        return html.replace(pat, "<span class='highlighted'>$1</span>");
    }
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

function getLines(ctx, text, maxWidth) {
    //this is only an excersize for the truncated text custom elment
    let words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}



