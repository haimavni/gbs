import { bindable, inject, DOM, bindingMode, BindingEngine, computedFrom } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Theme } from '../../services/theme';

const WAIT = 50;
@inject(DOM.Element, EventAggregator, BindingEngine, Theme)
export class PhotoStripCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) slides = [];
    @bindable source;
    @bindable ({ defaultBindingMode: bindingMode.twoWay }) height = 300;
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
    ready_interval;
    slideShow;
    theme;
    dragging = false;
    slideShowStopped = false;

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
                    if (this.theme.rtltr == "rtl" && slide.title && slide.title[0] != '<') {
                        slide.title = '<span dir="rtl">' + slide.title + '</span>';
                    }
                }
                if (this.calculate_widths()) {
                    this.prev_id = this.id;
                }
                this.shift_photos(0);
            });

            let n = this.settings.slide_show;
            if (n && !this.slideShow) {
                this.slideShow = setInterval(() => this.auto_next_slide(), n * 10);
                this.shift_photos(0);  //for the case of half empty carousel
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
        this.ready_interval = setInterval(() => this.ready(), 100);
        this.ready();
        if (! this.theme.is_desktop)
            this.height = Math.round(this.theme.height / 3);
        else this.height = 220;
        this.dispatch_height_change();
        //this.subscription = this.bindingEngine.collectionObserver(this.slides).subscribe(this.ready);
    }

    detached() {
        clearInterval(this.ready_interval);
        clearInterval(this.slideShow);
        this.ready_interval = 0;
        this.slideShow = 0;
        //this.subscription.dispose();
    }

    change_heights(new_height) {
        this.height = new_height;
        this.dispatch_height_change();
        this.calculate_widths();
    }

    drag_photos(event) {
        event.preventDefault();
        let { dx, dy, target } = event.detail;
        if (Math.abs(dy) > 7 * Math.abs(dx)) { // must be significantly larger, to prevent inadvertant height change
            let h = this.height;
            this.height += dy;
            if (this.height < 10) {
                this.height = 10;
            }
            // keep current photo on screen
            let x = (parseFloat(target.getAttribute('data-x')) || 0) + dx;
            let r = this.height / h;
            let parent = target.parentElement;
            let m = parent.clientWidth / 2;
            x = Math.round((x - m) * r + m);
            target.setAttribute('data-x', x);
            target.style.left = `${x}px`;

            this.dispatch_height_change();
            this.calculate_widths();
            return false;
        }
        if (Math.abs(dx) > 7 * Math.abs(dy)) {
            this.slideShowStopped = true;
        }
        if (event.detail.ctrlKey) {
            this.slideShowStopped = false;
        }
        if (Math.abs(dx) > 2) {
            this.dragging = true;
            this.shift_photos(dx);
        }
    }

    shift_photos(dx) {
        let target = this.slideList;
        if (!target) return;
        let parent = target.parentElement;
        // keep the dragged position in the data-x/data-y attributes
        let x = (parseFloat(target.getAttribute('data-x')) || 0) + dx;

        let min, max;

        // in left to right, you want to negative
        if (getComputedStyle(target).direction === 'ltr') {
            min = parent.clientWidth - target.clientWidth;
            max = 0;
            if (min > 0) {
                target.style.left = `${min}px`;
                return;
            }

            // in right to left, you want to go positive
        } else {
            min = 0;
            max = target.clientWidth - parent.clientWidth;
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
            this.shift_photos(250)
        }
        this.slideShowStopped = true;
    }

    prev_slide() {
        if (!this.dragging) {
            this.shift_photos(-250);
        }
        this.slideShowStopped = true;
    }

    auto_next_slide() {
        let target = this.slideList;
        let dir = getComputedStyle(target).direction === 'ltr' ? -1 : +1;
        if (!this.slideShowStopped) {
            this.shift_photos(dir);
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

    on_drag_start(event) {
        let el = document.getElementById("slide-list");
        el.classList.add("dragging");
        this.dragging = true;
    }

    on_drag_end(event) {
        let el = document.getElementById("slide-list");
        el.classList.remove("dragging");
    }

    goto_photo_table() {
        let photo_ids = this.slides.map(slide => slide.photo_id);
        this.eventAggregator.publish('GOTO-PHOTO-PAGE', {photo_ids: photo_ids});
    }

    @computedFrom('theme.height')
    get dummy () {
        if (! this.theme.is_desktop) {
            let height = Math.round(this.theme.height / 3);
            this.change_heights(height)
        }
        return "";
    }
}
