import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';

@inject(DOM.Element)
export class PhotoStripCustomElement {
    @bindable source;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) slides = [];
    @bindable height = 300;
    first_slide = 0;
    element;
    width;
    modified_slide = null;

    constructor(element) {
        console.log("in photo-strip. construction");
        this.element = element;
    }

    attached() {
        console.log('attached. element: ', this.element, ' width ', this.element.innerWidth);
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        this.width = elementRect.width;
        console.log("elementRect: ", elementRect);
        this.source.then(result => {
            this.slides = result.photo_list;
            this.next_slide();
        });
    }

    shift_photos(slide, customEvent: CustomEvent) {
        let event = customEvent.detail;
        customEvent.stopPropagation();
        if (event.dy * event.dy > event.dx * event.dx) {
            this.height += event.dy;
        } else if (event.dx < 0) {
            this.prev_slide();
        } else {
            this.next_slide();
        }
    }

    next_slide() { //we are right to left...
        window.setTimeout(() => this.restore_modified_slide(), 50);
        this.first_slide += 1;
        this.slides = this.slides.slice(0);
        let slides = this.slides;
        let slide = slides.shift();
        slides.push(slide);
        this.slides = slides;
        window.setTimeout(() => this.adjust_side_photos(), 50);
    }

    prev_slide() {
        window.setTimeout(
            this.restore_modified_slide(), 50);
        if (this.first_slide > 0) {
            this.first_slide -= 1;
        }
        let slides = this.slides;
        slides.reverse();
        let slide = slides.shift();
        slides.push(slide);
        slides.reverse();
        this.slides = slides;
        window.setTimeout(this.adjust_side_photos(), 50);
    }

    adjust_side_photos() {
        let total_width = 0;
        for (let slide of this.slides) {
            if (!slide) {
                continue;
            }
            let img = document.getElementById('img-' + slide.photo_id);
            let r = this.height / slide.height;
            let gap = this.width - total_width;
            let w = Math.round(r * slide.width);
            let w0 = img.style.width;
            img.style.width = w + "px";

            total_width += w;
            if (total_width > this.width) {
                //document.getElementById('img-' + slide.photo_id).style.width = gap + "px";
                console.log("gap: ", gap);
                window.setTimeout(() => document.getElementById('img-' + slide.photo_id).style.width = gap + "px", 50);
                this.modified_slide = slide;
                return;
            } else {
                console.log("calculated photo width: ", w, " total_width: ", total_width);
                document.getElementById('img-' + slide.photo_id).style.width = "${w}px";
            }
        }
    }

    restore_modified_slide() {
        let slide = this.modified_slide;

        if (slide) {
            let r = this.height / slide.height;
            let w = Math.round(r * slide.width);
            document.getElementById('img-' + this.modified_slide.photo_id).style.width = "${w}px";
            this.modified_slide = null;
        }
    }

}

