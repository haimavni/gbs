import { bindable, inject, DOM, computedFrom } from 'aurelia-framework';

@inject(DOM.Element)
export class fitTextCustomElement {
    element;
    @bindable text;
    canvas: HTMLCanvasElement;

    constructor(element) {
        this.element = element;
    }

    attached() {
        this.fit();
    }

    getLineHeight(element) {
        let lineHeight = window.getComputedStyle(element)['line-height'];
        if (lineHeight === 'normal') {
            // sucky chrome
            return 1.16 * parseFloat(window.getComputedStyle(element)['font-size']);
        } else {
            return parseFloat(lineHeight);
        }
    }

    getLineWidth(element) {
        let lineWidth = window.getComputedStyle(element)['line-width'];
        return parseFloat(lineWidth);
    }

    fit() {
        // this.element.innerHTML = this.text;
        let element_height = 300;  //temporary
        let parts = this.text.split(' ');
        let lineHeight = this.getLineHeight(this.element);
        let lineWidth = this.getLineWidth(this.element)
        var lines = [];
        let line = "";
        let line0 = "";
        for (let wrd of parts) {
            line0 = line;
            if (line) line += " ";
            line += wrd;
            if (this.text_width(line) > lineWidth) {
                if (lines.length * lineHeight >= element_height) break;
                line = "wrd";
                lines.push(line0)
            }
        }
        let truncated_text = lines.join(' ');
        this.canvas.innerHTML = truncated_text;
    }

    text_width(txt) {
        //const canvas = <HTMLCanvasElement> document.getElementById('myC');
        let ctx = this.canvas.getContext('2d');
        ctx.font = "36px Arial";
        return ctx.measureText(txt).width
    }
}
