import { bindable, inject, DOM, bindingMode, BindingEngine } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Theme } from '../../services/theme';

const WAIT = 50;
@inject(DOM.Element, EventAggregator, BindingEngine, Theme)
export class PhotoStripCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) slides = [];
    @bindable source;
    @bindable height = 300;
    @bindable action_key = null;
    @bindable settings = { height: 300, arrows: false, slide_show: 0 };
    @bindable id = 0;
    @bindable fullscreen = false;
    prev_id;
    element;
    width;
    modified_slide = null;
    eventAggregator;
    vertical = false;
    bindingEngine: BindingEngine;
    subscription;
    slideShow;
    theme;
    dragging = false;

    // refs 
    slideList; // defined by element.ref in the html

    constructor(element, eventAggregator: EventAggregator, bindingEngine, theme: Theme) {
        this.element = element;
        this.eventAggregator = eventAggregator;
        this.bindingEngine = bindingEngine;
        this.theme = theme;
    }

    ready() {
        if (!this) {
            return;
        }
        if (this.id != this.prev_id) {
            this.source.then(result => {
                this.slides = result.photo_list;
                for (let slide of this.slides) {
                    if (slide.title && slide.title[0] != '<') {
                        slide.title = '<span dir="rtl">' + slide.title + '</span>';
                    }
                }
                if (this.calculate_widths()) {
                    this.prev_id = this.id;
                }
                this.next_slide();
            });

        }
        let n = this.settings.slide_show;
        if (n && !this.slideShow) {
            if (n) {
                this.slideShow = setInterval(() => this.next_slide(), n * 1000);
            }
        }
    }

    attached() {
        
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        this.width = elementRect.width;
        this.subscription = this.bindingEngine.propertyObserver(this, 'id')
            .subscribe(this.ready);
        setInterval(() => this.ready(), 100);
        this.ready();
        //this.subscription = this.bindingEngine.collectionObserver(this.slides).subscribe(this.ready);
    }

    detached() {
        //this.subscription.dispose();
    }

    drag_photos(dx) {
        if (Math.abs(dx) > 0) {
            this.dragging = true;
        }
        this.shift_photos(dx);
    }

    shift_photos(dx) {
        let target = this.slideList,
            parent = target.parentElement,
            // keep the dragged position in the data-x/data-y attributes
            x = (parseFloat(target.getAttribute('data-x')) || 0) + dx;

        // we keep sliding between the left and right side of the strip
        x = Math.max(Math.min(x, 0), parent.clientWidth - target.clientWidth); 

        // translate the element
        target.style.left = `${x}px`;

        // update the posiion attributes
        target.setAttribute('data-x', x);
    }

    dispatch_height_change() {
        let changeEvent = new CustomEvent('height_change', {
            detail: {
                new_height: this.height
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    next_slide() { //we are right to left...
        if (!this.dragging) {
            this.shift_photos(-250)
        }
    }

    prev_slide() {
        if (!this.dragging) {
            this.shift_photos(250);
        }
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
            if (!img) {
                window.setTimeout(() => img = document.getElementById('img-' + slide.photo_id));
            }
            if (img)
                img.style.width = w + "px";

            total_width += w;
            if (total_width > this.width) {
                if (img) {
                    window.setTimeout(() => img.style.width = gap + "px", WAIT);
                    //the line below should replace the line above, but so far no luck
                    //window.setTimeout(() => img.style.clip = "rect(0px, ${w}px, ${this.height}px, ${gap}px)", WAIT);
                }
                this.modified_slide = slide;
                return;
            } else {
                if (img) {
                    img.style.width = "${w}px";
                }
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

    on_click(event, slide) {
        if (this.dragging) {
            this.dragging = false;
            return;
        }
        event.stopPropagation();
        if (this.vertical) {
            return;
        }
        if (this.action_key) {
            this.eventAggregator.publish(this.action_key, { slide: slide, event: event, slide_list: this.slides });
        }
    }
}
