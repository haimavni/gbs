import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';

@inject(DOM.Element)
export class PhotoStripCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) slides = [];
    @bindable height = 300;
    first_slide = 0;
    element;
    width;

    constructor(element) {
        console.log("in photo-strip. construction");
        this.element = element;
    }

    shift_photos(slide, customEvent: CustomEvent) {
        let event = customEvent.detail;
        customEvent.stopPropagation();
        if (event.dx < 0) {
            this.prev_slide();
        } else {
            this.next_slide();
        }
    }

    attached() {
        console.log('attached. element: ', this.element, ' width ', this.element.innerWidth);
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        this.width = elementRect.width;
        console.log("elementRect: ", elementRect);
        //this.adjust_side_photos();
    }

    next_slide() { //we are right to left...
        this.first_slide += 1;
        this.slides = this.slides.slice(0);
        let slides = this.slides;
        let slide = slides.shift();
        slides.push(slide);
        this.slides = slides;
        this.adjust_side_photos()
    }

    prev_slide() {
        if (this.first_slide > 0) {
            this.first_slide -= 1;
        }
        let slides = this.slides;
        slides.reverse();
        let slide = slides.shift();
        slides.push(slide);
        slides.reverse();
        this.slides = slides;
        this.adjust_side_photos();
    }

    adjust_side_photos() {
        let i = 0;
        let total_width = 0;
        for (let slide of this.slides) {
            let w = slide.width;
            let h = slide.height;
            let r = this.height / h;
            let w1 = Math.round(w * r);
            slide.wid = w1;
            console.log("w, h, r, w1, total_width, this.width: ", w, h, r, w1, total_width, this.width);
            let gap = this.width - total_width;
            total_width += w1;
            if (total_width > this.width) {
                slide.wid = gap;
                break;
            }
            if (i > 10) {
                break;
            }
            i += 1;
        }
    }

}

