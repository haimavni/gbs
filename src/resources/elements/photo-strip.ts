import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';

@inject(DOM.Element)
export class PhotoStripCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) slides = [];
    @bindable ({ defaultBindingMode: bindingMode.twoWay }) displayed_slides = [];
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

    next_slide() { //we are right to left...
        this.first_slide += 1;
        this.slides = this.slides.slice(0);
        let slides = this.slides;
        let slide = slides.shift();
        slides.push(slide);
        this.slides = slides; 
    }

    attached() {
        console.log('attached. element: ', this.element, ' width ', this.element.innerWidth);
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        this.width = elementRect.Width;
        console.log("elementRect: ", elementRect)
        this.displayed_slides = this.slides.slice(0, 8);
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
    }

}

