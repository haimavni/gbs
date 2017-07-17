import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';

@inject(DOM.Element)
export class PhotoStripCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) slides = [];
    @bindable ({ defaultBindingMode: bindingMode.twoWay }) displayed_slides = [];
    @bindable height = 600;
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
        let slides = this.slides;
        let slide = slides.shift();
        slides.push(slide);
        this.slides = slides;
    }

    created() {
        console.log("created photo strip");
      /*  window.setTimeout(
            () => {
                this.displayed_slides = this.slides.slice(0, 8);
            }, 5000);*/
        console.log("lst ", this.displayed_slides);
    }

    attached() {
        console.log('attached. element: ', this.element, ' width ', this.element.innerWidth);
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        console.log("elementRect: ", elementRect)
        this.displayed_slides = this.slides.slice(0, 8);
    }

    prev_slide() {
        let slides = this.slides;
        slides.reverse();
        let slide = slides.shift();
        slides.push(slide);
        slides.reverse();
        this.slides = slides;
    }

}

export class PhotoChunksValueConverter {
  toView(array, base=0, max=4, ...properties) {
    if (!array) {
      return [];
    }
    let arr = array.slice(base, base + max);
    return arr;
  }
}