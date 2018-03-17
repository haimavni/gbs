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
                    if (this.theme.rtltr=="rtl" && slide.title && slide.title[0] != '<') {
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

    drag_photos(event) {
        event.preventDefault();
        let { dx, dy } = event.detail;
        if (Math.abs(dy) > Math.abs(dx)) {
            this.height += dy;
            if (this.height < 10) {
                this.height = 10;
            }
            this.dispatch_height_change();
            this.calculate_widths();
            return;
        }

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
            
        let min, max;

        // in left to right, you want to negative
        if (getComputedStyle(target).direction === 'ltr') {
            min = parent.clientWidth - target.clientWidth;
            max = 0;
        
        // in right to left, you want to go positive
        } else {
            min = 0; 
            max = target.clientWidth - parent.clientWidth);
        }

        // we keep sliding between the left and right side of the strip
        x = Math.min(Math.max(x, min), max);

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

    get show_arrows() {
        return this.element.clientWidth < this.slideList.clientWidth;
    }

    on_click(event, slide) {
        if (this.dragging) {
            this.dragging = false;
            return;
        }
        event.stopPropagation();
        if (this.action_key) {
            this.eventAggregator.publish(this.action_key, { slide: slide, event: event, slide_list: this.slides });
        }
    }
}
