import { ITheme } from "../../services/theme";
import { IMisc } from "../../services/misc";
import { BindingMode, IEventAggregator, INode, IObserverLocator, bindable } from "aurelia";
import { watch } from "@aurelia/runtime-html";

const WAIT = 50;

export class PhotoStripCustomElement {
    @bindable({ mode: BindingMode.twoWay }) slides = [];
    @bindable source;
    @bindable({ mode: BindingMode.twoWay }) height = 300;
    @bindable action_key = null;
    @bindable settings = { height: 300, arrows: false, slide_show: 0 };
    @bindable id = 0;
    @bindable fullscreen = false;
    @bindable({ mode: BindingMode.twoWay }) move_to;
    @bindable({ mode: BindingMode.twoWay }) restart;
    prev_id;
    width;
    modified_slide = null;
    subscription;
    ready_interval;
    slideShow;
    dragging = false;
    slideShowStopped = false;

    // refs
    slideList; // defined by element.ref in the html

    constructor(
        @INode private readonly element: HTMLElement,
        @IEventAggregator private readonly eventAggregator: IEventAggregator,
        @ITheme private readonly theme: ITheme,
        @IMisc private readonly misc: IMisc,
        @IObserverLocator private readonly observerLocator: IObserverLocator,
    ) {
        this.element = element;
        this.eventAggregator = eventAggregator;
        this.theme = theme;
        this.misc = misc;
    }

    async ready(what) {
        if (!this) {
            return;
        }
        if (this.id != this.prev_id || this.restart) {
            if (this.restart) {
                this.restart = 0;
                let target = this.slideList;
                if (target && what == "attached") {
                    target.style.left = "0px";
                    target.setAttribute("data-x", 0);
                }
            }
            this.source.then((result) => {
                let slides = result.photo_list;
                for (let slide of slides) {
                    if (
                        this.theme.rtltr == "rtl" &&
                        slide.title &&
                        slide.title[0] != "<"
                    ) {
                        slide.title =
                            '<span dir="rtl">' + slide.title + "</span>";
                    }
                }
                this.start_slide_show(slides);
                //this.misc.cache_images(slides);
                if (this.calculate_widths()) {
                    this.prev_id = this.id;
                }
                //this.shift_photos(0);
            });

            //await this.misc.sleep(2000);
            let n = this.settings.slide_show;
            if (n && !this.slideShow) {
                this.slideShow = setInterval(
                    () => this.auto_next_slide(),
                    n * 10
                );
                this.shift_photos(0); //for the case of half empty carousel
            }
        }
    }

    async start_slide_show(slides) {
        let n = this.calculate_covering_count(slides);
        this.slides = slides.slice(0, n);
        await this.misc.sleep(500);
        this.slides = slides;
        this.shift_photos(0);
    }

    attached() {
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        this.width = elementRect.width;
        
        this.subscription = this.observerLocator
            .getObserver(this, "id")
            .subscribe({
                handleChange: (newValue, oldValue) => {
                    this.ready('attached');
                }
            });

        this.ready_interval = setInterval(() => this.ready("timer"), 100);
        this.ready("attached");
        if (!this.theme.is_desktop)
            this.height = Math.round(this.theme.height / 3);
        else this.height = 220;
        this.dispatch_height_change();
    }

    detached() {
        clearInterval(this.ready_interval);
        if (this.slideShow) clearInterval(this.slideShow);
        this.ready_interval = 0;
        this.slideShow = 0;
    }

    change_heights(new_height) {
        this.height = new_height;
        this.dispatch_height_change();
        this.calculate_widths();
    }

    drag_photos(event) {
        event.preventDefault();
        let { dx, dy, target } = event.detail;
        if (Math.abs(dy) > 10 * Math.abs(dx)) {
            // must be significantly larger, to prevent inadvertant height change
            let h = this.height;
            this.height += dy;
            if (this.height < 10) {
                this.height = 10;
            }
            // keep current photo on screen
            let x = (parseFloat(target.getAttribute("data-x")) || 0) + dx;
            let r = this.height / h;
            let parent = target.parentElement;
            let m = parent.clientWidth / 2;
            x = Math.round((x - m) * r + m);
            target.setAttribute("data-x", x);
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
        let x = (parseFloat(target.getAttribute("data-x")) || 0) + dx;

        let min, max;

        // in left to right, you want to negative
        if (getComputedStyle(target).direction === "ltr") {
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
        if (target && target.style) {
            target.style.left = `${x}px`;
        }

        // update the position attributes
        target.setAttribute("data-x", x);
        return x;
    }

    async place_photos(x) {
        let target = this.slideList;
        for (let i = 0; i < 100; i++) {
            if (target) break;
            await this.misc.sleep(10);
            target = this.slideList;
        }
        if (!target) return;
        if (target && target.style) {
            target.style.left = `${x}px`;
            target.setAttribute("data-x", x);
            await this.misc.sleep(100);
            target.style.left = `${x}px`;
            target.setAttribute("data-x", x);
        }
    }

    dispatch_height_change() {
        let changeEvent = new CustomEvent("height_change", {
            detail: {
                new_height: this.height,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }

    next_slide() {
        //we are right to left...
        if (!this.dragging) {
            this.shift_photos(250);
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
        let dir = getComputedStyle(target).direction === "ltr" ? -1 : +1;
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
            let img = document.getElementById("img-" + slide.photo_id);
            if (img) {
                img.style.width = w + "px";
            }
        }
        return true;
    }

    calculate_covering_count(slides) {
        let container_width = this.theme.width;
        let width = 0;
        let n = 0;
        for (let slide of slides) {
            n += 1;
            if (!slide) {
                continue;
            }

            let r = this.height / slide.height;
            let w = Math.round(r * slide.width);
            width += w;
            if (width > container_width) return n;
        }
        return n;
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
            let offset = this.shift_photos(0);
            this.eventAggregator.publish(this.action_key, {
                slide: slide,
                event: event,
                slide_list: this.slides,
                offset: offset,
            });
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
        let photo_ids = this.slides.map((slide) => slide.photo_id);
        this.eventAggregator.publish("GOTO-PHOTO-PAGE", {
            photo_ids: photo_ids,
        });
    }

    @watch("theme.height")
    get dummy() {
        if (!this.theme.is_desktop) {
            let height = Math.round(this.theme.height / 3);
            this.change_heights(height);
        }
        return "";
    }

    @watch("move_to")
    get move_to_triggered() {
        if (!this.move_to) return;
        this.place_photos(this.move_to);
        this.move_to = null;
        return false;
    }

    @watch("restart")
    get restart_triggered() {
        if (!this.restart) return;
        this.ready("restart");
        return "";
    }
}
