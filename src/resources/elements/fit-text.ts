import { INode, bindable } from "aurelia";
import { watch } from "@aurelia/runtime-html";
import { IMisc } from "../../services/misc";
import { ITheme } from "../../services/theme";

export class fitTextCustomElement {
    @bindable txt = "";
    @bindable width;
    @bindable height;
    truncated_text = "";
    canvas: HTMLCanvasElement;
    font_size;

    constructor(
        @INode private readonly element: HTMLElement,
        @IMisc private readonly misc: IMisc,
        @ITheme private readonly theme: ITheme
    ) {
        console.log("theme is ", this.theme);
    }

    async attached() {
        let style = window.getComputedStyle(this.element, null);
        console.log("style is ", style);
        console.log(
            "style font/family/size: ",
            style.font,
            style.fontFamily,
            style.fontSize
        );
        console.log("style line height ", style.lineHeight);
        this.font_size = style.fontSize;
        let parent = this.element.parentElement;
        parent = parent.parentElement;
        let bc = parent.getBoundingClientRect();
        console.log("offset height: ", parent.offsetHeight);
        console.log("offset width: ", parent.offsetWidth);
        console.log("bc is ", bc);
        for (let i = 0; i < 10; i += 1) {
            if (this.theme) {
                await this.misc.sleep(20);
            }
        }
    }

    getLineHeight() {
        let lineHeight = window.getComputedStyle(this.element)["line-height"];
        if (lineHeight === "normal") {
            // sucky chrome
            return (
                1.16 *
                parseFloat(window.getComputedStyle(this.element)["font-size"])
            );
        } else {
            return parseFloat(lineHeight);
        }
    }

    getLineWidth() {
        let lineWidth = window.getComputedStyle(this.element)["line-width"];
        return parseFloat(lineWidth);
    }

    fit() {
        //this.element.innerHTML = this.txt;
        let element_height = this.height;

        let lineHeight = this.getLineHeight();
        let lineWidth = this.width;
        var lines = [];
        let line = "";
        let line0 = "";
        if (!this.txt) return;
        let parts = this.txt.split(" ");
        let finito = false;
        for (let wrd of parts) {
            line0 = line;
            if (line) line += " ";
            line += wrd;
            if (this.text_width(line) > lineWidth) {
                console.log(line0, " width=", this.text_width(line0));
                //console.log("line break ", lines.length*lineHeight);
                finito = lines.length * lineHeight >= element_height;
                if (finito) {
                    while (line0 && line0[line.length - 1] == ".")
                        line0 = line0.substr(0, line0.length - 1);
                    line0 += "...";
                }
                lines.push(line0);
                if (finito) {
                    break;
                }
                line = wrd;
            }
        }
        if (!finito) {
            while (line && line[line.length - 1] == ".")
                line = line.substr(0, line.length - 1);
            line += "...";
            lines.push(line);
        }
        this.truncated_text = lines.join(" ");
        console.log("truncated_text: ", lines);
        //this.element.innerHTML = truncated_text;
    }

    text_width(txt) {
        //const canvas = <HTMLCanvasElement> document.getElementById('myC');
        let ctx = this.canvas.getContext("2d");
        //console.log("ctx: ", ctx);
        //this.font_size = "36px"; //temp..
        ctx.font = this.font_size + " Alef Hebrew";
        return ctx.measureText(txt).width * this.factor;
    }

    @watch("txt")
    get dummy() {
        if (this.txt) this.fit();
        return;
    }

    @watch("theme.font_size")
    get factor() {
        switch (this.theme.font_size) {
            case "font-size-100":
                return 0.9;
            case "font-size-150":
                return 1.3;
        }
        return 1.0;
    }
}
