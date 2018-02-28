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
                this.next_slide(null);
            });

        }
        let n = this.settings.slide_show;
        if (n && !this.slideShow) {
            if (n) {
                this.slideShow = setInterval(() => this.next_slide(null), n * 1000);
            }
        }
    }

    get interact_setting() {
        return this.theme.touchScreen ? { interactable: { preventDefault: 'never' } } : {};
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

    shift_photos(customEvent: CustomEvent) {
        let event = customEvent.detail;
        let stop_slide_show = true;
        this.vertical = false;
        /*if (Math.abs(event.dx) < 5 && Math.abs(event.dy) < 5) { //attempt to identify click on touch screens
            let img = event.target.childNodes[1];
            let slide = this.slides.find(slide => "img-" + slide.photo_id==img.id);
            return this.on_click(slide, event);
        }*/
        customEvent.stopPropagation();
        if (Math.abs(event.dy) > Math.abs(event.dx)) {
            this.vertical = true;
            this.height += event.dy;
            this.dispatch_height_change();
            this.calculate_widths();
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

    dispatch_height_change() {
        let changeEvent = new CustomEvent('height_change', {
            detail: {
                new_height: this.height
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    next_slide(event) { //we are right to left...
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

    on_click(slide, event) {
        event.stopPropagation();
        if (this.vertical) {
            return;
        }
        if (this.action_key) {
            this.eventAggregator.publish(this.action_key, { slide: slide, event: event, slide_list: this.slides });
        }
    }

}

