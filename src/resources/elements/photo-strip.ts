import { bindable, inject, DOM, bindingMode, BindingEngine } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

const WAIT = 50;
@inject(DOM.Element, EventAggregator, BindingEngine)
export class PhotoStripCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) slides = [];
    @bindable source;
    @bindable height = 300;
    @bindable action_key = null;
    @bindable settings = { height: 300, arrows: false, slide_show: 0 };
    @bindable id = 0;
    prev_id;
    element;
    width;
    modified_slide = null;
    eventAggregator;
    vertical = false;
    bindingEngine: BindingEngine;
    subscription;
    slideShow;

    constructor(element, eventAggregator: EventAggregator, bindingEngine) {
        console.log("in photo-strip. construction");
        this.element = element;
        this.eventAggregator = eventAggregator;
        this.bindingEngine = bindingEngine;
    }

    ready() {
        if (!this) {
            return;
        }
        if (this.id != this.prev_id) {
            this.source.then(result => {
                this.slides = result.photo_list;
                if (this.calculate_widths()) {
                    this.prev_id = this.id;
                }
                this.next_slide(null);
            });

        }
        if (!this.slideShow) {
            let n = this.settings.slide_show;
            if (n) {
                this.slideShow = setInterval(() => this.next_slide(null), n * 1000);
            }
        }
    }

    attached() {
        console.log('photo strip attached. element: ', this.element, ' width ', this.element.innerWidth);
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        this.width = elementRect.width;
        console.log("elementRect: ", elementRect);
        this.subscription = this.bindingEngine.propertyObserver(this, 'id')
            .subscribe(this.ready);
        setInterval(() => this.ready(), 100);
        this.ready();
        //this.subscription = this.bindingEngine.collectionObserver(this.slides).subscribe(this.ready);
    }

    detached() {
        //this.subscription.dispose();
    }

    shift_photos(customEvent: CustomEvent) {
        let event = customEvent.detail;
        customEvent.stopPropagation();
        let stop_slide_show = true;
        this.vertical = false;
        if (event.dy * event.dy > event.dx * event.dx) {
            this.vertical = true;
            this.height += event.dy;
            this.calculate_widths();
            console.log("vertical in shift photos");
            stop_slide_show = false;
        } else if (event.dx < 0) {
            this.prev_slide(Event);
        } else {
            this.next_slide(event);
        }
        if (stop_slide_show) {
            clearInterval(this.slideShow);
        }
        return false;
    }

    next_slide(event) { //we are right to left...
        console.log("next slide");
        if (event) {
            clearInterval(this.slideShow);
        }
        window.setTimeout(() => this.restore_modified_slide(), WAIT);
        this.slides = this.slides.slice(0);
        let slides = this.slides;
        let slide = slides.shift();
        slides.push(slide);
        this.slides = slides;
        window.setTimeout(() => this.adjust_side_photos(), WAIT);
    }

    prev_slide(event) {
        console.log("prev slide");
        if (event) {
            clearInterval(this.slideShow);
        }
        window.setTimeout(() => this.restore_modified_slide(), WAIT);
        let slides = this.slides;
        let slide = slides.pop();
        slides.splice(0, 0, slide);
        this.slides = slides;
        //this.calculate_widths();
        window.setTimeout(() => this.adjust_side_photos(), WAIT);
        //this.adjust_side_photos();
    }

    adjust_side_photos() {
        let total_width = 0;
        for (let slide of this.slides) {
            if (!slide) {
                console.log("null slide detected!");
                continue;
            }
            let img = document.getElementById('img-' + slide.photo_id);
            let r = this.height / slide.height;
            let gap = this.width - total_width;
            let w = Math.round(r * slide.width);
            img.style.width = w + "px";

            total_width += w;
            if (total_width > this.width) {
                //document.getElementById('img-' + slide.photo_id).style.width = gap + "px";
                console.log("gap: ", gap);
                window.setTimeout(() => document.getElementById('img-' + slide.photo_id).style.width = gap + "px", WAIT);
                this.modified_slide = slide;
                return;
            } else {
                console.log("calculated photo width: ", w, " total_width: ", total_width);
                document.getElementById('img-' + slide.photo_id).style.width = "${w}px";
            }
        }
    }

    calculate_widths() {
        for (let slide of this.slides) {
            if (!slide) {
                return false;
            }
            let r = this.height / slide.height;
            let w = Math.round(r * slide.width);
            let img = document.getElementById('img-' + slide.photo_id);
            if (img) {
                img.style.width = w + "px";
            } else {
                return false;
            }
        }
        return true;
    }

    restore_modified_slide() {
        let slide = this.modified_slide;

        if (slide) {
            let r = this.height / slide.height;
            let w = Math.round(r * slide.width);
            let img = document.getElementById('img-' + this.modified_slide.photo_id);
            if (img) {
                img.style.width = "${w}px";
            }
            this.modified_slide = null;
        }
    }

    on_click(slide, event) {
        event.stopPropagation();
        console.log("photo was clicked");
        if (this.vertical) {
            return;
        }
        if (this.action_key) {
            this.eventAggregator.publish(this.action_key, { slide: slide, event: event });
        }
    }

}

