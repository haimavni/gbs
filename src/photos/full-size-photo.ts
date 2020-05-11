import { MemberGateway } from '../services/gateway';
import { Router } from 'aurelia-router';
import { DialogController, DialogService } from 'aurelia-dialog';
import { autoinject, computedFrom } from 'aurelia-framework';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { MemberPicker } from "../members/member-picker";
import environment from "../environment";
import { EventAggregator } from 'aurelia-event-aggregator';
import { getOffset } from "../services/dom_utils";
import { I18N } from 'aurelia-i18n';
import { copy_to_clipboard } from '../services/dom_utils';
import { FaceInfo } from './face-info';

@autoinject()
export class FullSizePhoto {
    dialogController;
    dialogService;
    baseURL;
    faces = [];
    current_face;
    candidates = [];
    already_identified = new Set();
    api;
    user;
    theme;
    model;
    slide;
    slide_list = [];
    slide_index = 0;
    photo_info = { name: "", photo_date_str: "", photo_date_datespan: 0, photographer: "" };
    router;
    highlighting = false;
    eventAggregator;
    marking_face_active = false;
    i18n;
    highlight_all;
    fullscreen;
    jump_to_story_page;
    copy_photo_url_text;
    flip_text;
    navEvent;
    cropping = false;
    crop_height;
    crop_width;
    crop_top;
    crop_left;
    crop;
    save_crop;
    cancel_crop;
    crop_sides;
    rotate;
    next_slide_txt;
    prev_slide_txt;
    no_new_faces = false;
    settings = {};
    fullscreen_mode = false;
    fullscreen_height = 0;
    fullscreen_width = 0;
    fullscreen_margin = 0;
    fullscreen_top_margin = 0;
    can_go_forward = false;
    can_go_backward = false;
    list_of_ids = false;

    constructor(dialogController: DialogController,
        dialogService: DialogService,
        api: MemberGateway,
        user: User,
        theme: Theme,
        router: Router,
        eventAggregator: EventAggregator,
        i18n: I18N) {
        this.dialogController = dialogController;
        this.dialogService = dialogService;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.router = router;
        this.eventAggregator = eventAggregator;
        this.i18n = i18n;
        this.highlight_all = this.i18n.tr('photos.highlight-all');
        this.crop = this.i18n.tr('photos.crop');
        this.rotate = this.i18n.tr('photos.rotate');
        this.save_crop = this.i18n.tr('photos.save-crop');
        this.cancel_crop = this.i18n.tr('photos.cancel-crop');
        this.next_slide_txt = this.i18n.tr('photos.next-slide')
        this.prev_slide_txt = this.i18n.tr('photos.prev-slide')
        this.jump_to_story_page = this.i18n.tr('photos.jump-to-story-page');
        this.fullscreen = this.i18n.tr('photos.fullscreen');
        this.copy_photo_url_text = this.i18n.tr('photos.copy-photo-url');
        this.flip_text = this.i18n.tr('photos.flip');
    }

    activate(model) {
        this.model = model;
        model.final_rotation = 0;
        this.slide = model.slide;
        this.slide_list = model.slide_list || [];
        this.settings = model.settings || {};
        this.list_of_ids = model.list_of_ids;
        this.baseURL = environment.baseURL;
        this.navEvent = this.eventAggregator.subscribe('router:navigation:complete', response => {
            this.dialogController.ok();
        });
        this.theme.hide_title = true;
        window.setTimeout(() => {
            let el = document.getElementById("next-slide-button");
            if (el) {
                el.focus();
            }
        }, 300);
    }

    deactivate() {
        this.navEvent.dispose();
        this.theme.hide_title = false;
    }

    attached() {
        let idx = this.slide_idx();
        this.can_go_forward = idx + 1 < this.slide_list.length;
        this.can_go_backward = idx > 0;
        let pid = this.slide[this.slide.side].photo_id;
        if (!pid) {
            pid = this.slide.photo_id;
            console.log("no photo id in ", this.slide.side, " photo id: ", pid);
        }
        this.get_faces(pid);
        this.get_photo_info(pid);
        this.api.hit('PHOTO', pid);
        if (this.user.editing && !this.highlighting)
            this.toggle_highlighting(null);
    }

    detached() {
        
    }

    get_faces(photo_id) {
        this.faces = [];
        this.api.call_server('photos/get_faces', { photo_id: photo_id })
            .then((data) => {
                this.faces = data.faces;
                for (let face of this.faces) {
                    face.name = '<span dir="rtl">' + face.name + '</span>';
                    this.already_identified.add(face.member_id);
                }
                this.candidates = data.candidates;
            });
    }

    get_photo_info(photo_id) {
        this.api.call_server('photos/get_photo_info', { photo_id: photo_id })
            .then((data) => {
                this.photo_info.name = data.name;
                this.photo_info.photographer = data.photographer;
                if (!this.photo_info.photographer) {
                    this.photo_info.photographer = this.i18n.tr('photos.unknown-photographer');
                }
                this.photo_info.photo_date_datespan = data.photo_date_datespan;
                this.photo_info.photo_date_str = data.photo_date_str;
            });

    }

    save_photo_info(event) {
        event.stopPropagation();
        let pi = event.detail;
        this.photo_info.photo_date_str = pi.date_str;
        this.photo_info.photo_date_datespan = pi.date_span;
        this.api.call_server_post('photos/save_photo_info', { user_id: this.user.id, photo_id: this.slide.photo_id, photo_info: this.photo_info });
        return false;
    }

    save_photo_caption(event) {
        this.api.call_server_post('photos/save_photo_info', { user_id: this.user.id, photo_id: this.slide.photo_id, photo_info: this.photo_info });
    }

    face_location(face) {
        let d = face.r * 2;
        return {
            left: (face.x - face.r) + 'px',
            top: (face.y - face.r) + 'px',
            width: d + 'px',
            height: d + 'px',
            'background-color': face.action ? "rgba(100, 100,0, 0.2)" : "rgba(0, 0, 0, 0)",
            cursor: face.moving ? "move" : "hand",
            position: 'absolute',
        };
    }

    copy_photo_url(event) {
        event.stopPropagation();
        copy_to_clipboard(this.slide.src);
        return false;
    }

    flip_photo(event) {
        event.stopPropagation();
        this.slide.side = (this.slide.side == 'front') ? 'back' : 'front';
        return false;
    }

    handle_face(face, event, index) {
        event.stopPropagation();
        if (!this.user.editing) {
            this.jump_to_member(face.member_id);
            return;
        }
        if (event.altKey && event.shiftKey) {
            this.remove_face(face);
            return;
        }
        this.assign_member(face);
    }

    assign_member(face) {
        this.dialogService.open({
            viewModel: MemberPicker,
            model: {
                face_identifier: true,
                member_id: face.member_id,
                candidates: this.candidates,
                excluded: this.already_identified,
                slide: this.slide,
                current_face: this.current_face
            }, lock: false
        })
            .whenClosed(response => {
                this.marking_face_active = false;
                if (response.wasCancelled) {
                    if (!face.member_id) {
                        this.hide_face(face);
                    }
                    //this.remove_face(face); !!! no!
                    return;
                }
                let old_member_id = face.member_id;
                let mi = (response.output && response.output.new_member) ? response.output.new_member.member_info : null;
                if (mi) {
                    face.name = mi.first_name + ' ' + mi.last_name;
                    face.member_id = response.output.new_member.member_info.id;
                    return;
                }
                face.member_id = response.output.member_id;
                let make_profile_photo = response.output.make_profile_photo;
                this.api.call_server_post('photos/save_face', { face: face, make_profile_photo: make_profile_photo, old_member_id: old_member_id })
                    .then(response => {
                        let idx = this.candidates.findIndex(m => m.member_id == face.member_id);
                        this.candidates.splice(idx, 1);
                        this.already_identified.add(face.member_id)
                        face.name = response.member_name;
                        this.eventAggregator.publish('MemberGotProfilePhoto', { member_id: face.member_id, face_photo_url: response.face_photo_url });
                    });
            });

    }

    @computedFrom('marking_face_active')
    get instruction() {
        if (this.marking_face_active) {
            return this.i18n.tr('photos.edit-face-location')
        } else {
            return this.i18n.tr('photos.click-to-identify')
        }
    }

    hide_face(face) {
        let i = this.faces.indexOf(face);
        this.faces.splice(i, 1);
    }

    remove_face(face) {
        this.api.call_server_post('photos/detach_photo_from_member', { member_id: face.member_id, photo_id: this.slide.photo_id })
            .then(() => {
                this.hide_face(face);
            });
    }

    private jump_to_member(member_id) {
        this.dialogController.ok();
        this.router.navigateToRoute('member-details', { id: member_id, keywords: "" });
    }

    jump_to_photo_page(event) {
        event.stopPropagation();
        this.dialogController.ok();
        let photo_ids = this.slide_list.map(slide => slide.photo_id);
        let slide = this.slide[this.slide.side] || this.slide;
        this.router.navigateToRoute('photo-detail', { id: slide.photo_id, keywords: "", photo_ids: photo_ids });
    }

    mark_face(event) {
        if (this.fullscreen_mode) {
            let width = this.theme.width;
            if (event.offsetX < width / 4) {
                this.prev_slide(event)
            } else if (event.offsetX > width * 3 / 4) {
                this.next_slide(event)
            }
            return;
        }
        if (this.no_new_faces) return;
        event.stopPropagation();
        if (!this.user.editing) {
            return;
        }
        if (this.marking_face_active) {
            return;
        }
        if (event.offsetX < 15) {
            return;
        }
        let photo_id = this.slide[this.slide.side].photo_id;
        if (!photo_id) {
            photo_id = this.slide.photo_id; //todo: ugly
        }
        let face = { photo_id: photo_id, x: event.offsetX, y: event.offsetY, r: 30, name: this.i18n.tr("photos.unknown"), member_id: 0, action: null };
        this.current_face = face;
        this.faces.push(face);
        this.marking_face_active = true;
        return false;
    }

    private distance(face, pt) {
        let dist = Math.sqrt(Math.pow(pt.x - face.x, 2) + Math.pow(pt.y - face.y, 2));
        return Math.round(dist);
    }

    public dragstart(face, customEvent: CustomEvent) {
        customEvent.stopPropagation();
        if (!this.user.editing) {
            return;
        }
        let el = document.getElementById('full-size-photo');
        face.corner = getOffset(el);
        customEvent.stopPropagation();
        let event = customEvent.detail;
        let pt = { x: event.pageX - face.corner.left - 32, y: event.pageY - face.corner.top }; //iThe 32 is probably width of the left toolbar
        let dist = this.distance(face, pt);
        face.action = (dist < face.r - 10) ? "moving" : "resizing";
        face.dist = dist;
        this.current_face = { x: face.x, y: face.y, r: face.r, dist: face.dist };
    }

    public dragmove(face, customEvent: CustomEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        if (!this.user.editing) {
            return;
        }
        let el = document.getElementById('face-' + face.member_id);
        let current_face = this.current_face;
        if (face.action === "moving") {
            current_face.x += event.dx;
            current_face.y += event.dy;
        } else {
            let pt = { x: event.pageX - face.corner.left, y: event.pageY - face.corner.top };
            let dist = this.distance(current_face, pt);
            current_face.r += dist - current_face.dist;
            current_face.dist = dist;
        }
        let face_location = this.face_location(current_face);
        el.style.left = face_location.left;
        el.style.top = face_location.top;
        el.style.width = face_location.width;
        el.style.height = face_location.height;
        el.style.backgroundColor = 'lightblue';
        el.style.opacity = "0.6";
        if (face.action == 'moving') {
            el.style.cursor = 'all-scroll';
        } else {
            el.style.cursor = 'se-resize';
        }
    }

    public drag_move_photo(customEvent: CustomEvent) {
        if (!this.theme.is_desktop) {
            let event = customEvent.detail;
            let el = document.getElementById("full-size-photo");
            let mls = el.style.marginLeft.replace('px', '');
            let ml = Math.min(0, parseInt(mls) + event.dx);
            el.style.marginLeft = `${ml}px`;
        }
    }

    public dragend(face, customEvent: CustomEvent) {
        if (!this.user.editing) {
            return;
        }
        customEvent.stopPropagation();
        let event = customEvent.detail;
        if (face.action === "moving") {
            face.x += event.dx;
            face.y += event.dy;
        } else {
            let pt = { x: event.pageX - face.corner.left, y: event.pageY - face.corner.top };
            let dist = this.distance(face, pt);
            face.r += dist - face.dist;
            if (face.r < 18) {
                this.remove_face(face);
            }
        }
        this.faces = this.faces.splice(0);
        face.action = null;
    }

    public toggle_highlighting(event) {
        this.highlighting = !this.highlighting;
        if (event)
            event.stopPropagation();
        let el = document.getElementById("full-size-photo");
        el.classList.toggle("highlight-faces");
        el = document.getElementById("side-tool highlighter");
        el.blur();
    }

    public crop_photo() {
        this.crop_height = this.slide[this.slide.side].height;
        this.crop_width = this.slide[this.slide.side].width;
        this.crop_top = 0;
        this.crop_left = 0;
        this.cropping = true;
    }

    public save_photo_crop(event) {
        //call server to crop and refresh
        event.stopPropagation();
        let photo_data = this.slide[this.slide.side];
        let photo_id = this.slide[this.slide.side].photo_id || this.slide.photo_id; //temporary bug hider
        this.api.call_server('photos/crop_photo', { photo_id: photo_id, crop_left: this.crop_left, crop_top: this.crop_top, crop_width: this.crop_width, crop_height: this.crop_height })
            .then((data) => {
                photo_data.src = data.photo_src;   //to ensure refresh
                photo_data.width = this.crop_width;
                photo_data.height = this.crop_height;
                for (let face of this.faces) {
                    if (!face.x) continue;
                    face.x -= this.crop_left;
                    face.y -= this.crop_top;
                }
                this.faces = this.faces.splice(0);
            });
        this.cropping = false;
    }

    public cancel_photo_crop() {
        //restore crop-width etc. to their initial values
        this.cropping = false;
    }

    public do_crop(customEvent: CustomEvent) {
        let event = customEvent.detail;
        let height = this.slide[this.slide.side].height;
        let width = this.slide[this.slide.side].width;
        if (this.crop_sides == 'nw' || this.crop_sides == 'sw') {
            let crop_left = Math.max(this.crop_left + event.dx, 0)
            let dx = crop_left - this.crop_left;
            this.crop_width -= dx;
            this.crop_left = crop_left;
        }
        if (this.crop_sides == 'nw' || this.crop_sides == 'ne') {
            let crop_top = Math.max(this.crop_top + event.dy, 0)
            let dy = crop_top - this.crop_top;
            this.crop_height -= dy;
            this.crop_top = crop_top;
        }
        if (this.crop_sides == 'ne' || this.crop_sides == 'se') {
            this.crop_width += event.dx;
            this.crop_width = Math.min(this.crop_width, width - this.crop_left);
        }
        if (this.crop_sides == 'sw' || this.crop_sides == 'se') {
            this.crop_height += event.dy;
            this.crop_height = Math.min(this.crop_height, height - this.crop_top);
        }
    }

    public start_crop(customEvent: CustomEvent) {
        let el = document.getElementById('full-size-photo');
        let corner = getOffset(el);
        customEvent.stopPropagation();
        let event = customEvent.detail;
        let x = event.pageX - corner.left;
        let y = event.pageY - corner.top;
        let height = this.slide[this.slide.side].height;
        let width = this.slide[this.slide.side].width;
        if (x * 2 < width) {
            if (y * 2 < height) {
                this.crop_sides = 'nw'
            } else {
                this.crop_sides = 'sw'
            }
        } else if (y * 2 < height) {
            this.crop_sides = 'ne'
        } else {
            this.crop_sides = 'se'
        }
    }

    rotate_photo(event) {
        event.stopPropagation();
        this.api.call_server('photos/rotate_selected_photos', { selected_photo_list: [this.slide.photo_id] })
            .then(result => {
                this.model.final_rotation += 90;
                let el = document.getElementById('photo-image');
                el.style.transform = `rotate(-${this.model.final_rotation}deg)`;
            })
        return false;
    }

    slide_idx() {
        if (this.list_of_ids) {
            let photo_id = this.slide[this.slide.side].photo_id;
            return this.slide_list.findIndex(pid => pid == photo_id);
        }
        return this.slide_list.findIndex(slide => slide.photo_id == this.slide.photo_id);
    }

    public has_next(step) {
        let idx = this.slide_idx();
        return 0 <= (idx + step) && (idx + step) < this.slide_list.length;
    }

    get_slide_by_idx(idx) {
        if (this.list_of_ids) {
            return this.get_slide_by_idx_list_ids(idx);
        }
        this.slide = this.slide_list[idx];
        let pid = this.slide.photo_id;
        this.get_faces(pid);
        this.get_photo_info(pid);
        this.calc_percents();
    }

    get_slide_by_idx_list_ids(idx) {
        let pid = this.slide_list[idx];
        this.api.call_server('photos/get_photo_detail', {photo_id: pid})
        .then(response => {
            let p = this.slide[this.slide.side];
            p.src = response.photo_src;
            p.photo_id = pid;
            p.width = response.width;
            p.height = response.height;
            this.calc_percents();
        })
    }

    public next_slide(event) {
        event.stopPropagation();
        let idx = this.slide_idx();
        if (idx + 1 < this.slide_list.length) {
            this.get_slide_by_idx(idx + 1);
            this.can_go_forward = idx + 2 < this.slide_list.length;
            this.can_go_backward = true;
        }
    }

    public prev_slide(event) {
        event.stopPropagation();
        let idx = this.slide_idx();
        if (idx > 0) {
            this.get_slide_by_idx(idx - 1)
            this.can_go_forward = true;
            this.can_go_backward = idx > 1;
        }
    }

    handle_context_menu(face, event) {
        event.stopPropagation();
        if (!this.user.editing) {
            return;
        }
        if (!this.highlighting) {
            this.toggle_highlighting(event);
        }
        let el = document.getElementById('full-size-photo');
        let rect = el.getBoundingClientRect(); // as DOMRect;
        this.no_new_faces = true;
        this.current_face = face;
        document.body.classList.add('semi-black-overlay');
        this.dialogService.open({
            viewModel: FaceInfo,
            host: el,
            model: {
                face: face,
                photo_x: rect.left,
                photo_width: rect.width,
                face_x: event.clientX
            }, lock: false
        }).whenClosed(response => {
            document.body.classList.remove('semi-black-overlay');
            this.no_new_faces = false;
            if (!response.wasCancelled) {
                let command = response.output.command;
                if (command == 'cancel-identification') {
                    this.marking_face_active = false;
                    this.remove_face(face)
                } else if (command == 'save-face-location') {
                    this.marking_face_active = false;
                    if (face.member_id)
                        this.api.call_server_post('photos/save_face', { face: face });
                    else
                        this.assign_member(face);
                }
            }
        })

    }

    @computedFrom("current_face.x", "current_face.y", "current_face.r")
    get face_moved() {
        if (!this.user.editing) return;
        let current_face = this.current_face;
        if (!current_face) return;
        let el = document.getElementById('face-' + current_face.member_id);
        if (!el) return;
        let face_location = this.face_location(current_face);
        el.style.left = face_location.left;
        el.style.top = face_location.top;
        el.style.width = face_location.width;
        el.style.height = face_location.height;
        return 'bla';
    }

    async makeFullScreen() {
        this.fullscreen_mode = false;
        let el = document.getElementById("photo-image");
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else {
            console.log("Fullscreen API is not supported");
        }
        await sleep(100);
        this.calc_percents();
    }

    fullscreen_change(event) {
        this.fullscreen_mode = !this.fullscreen_mode;
    }

    calc_percents() {
        let ph = this.slide[this.slide.side].height;
        let pw = this.slide[this.slide.side].width;
        let sh = this.theme.height;
        let sw = this.theme.width;
        let w;
        let h;
        if (ph * sw > pw * sh) {
            this.fullscreen_height = 100;
            w = Math.round(pw * sh / ph);
            h = sh;
            this.fullscreen_width = Math.round(100 * pw * sh / ph / sw);
        } else {
            w = sw;
            h = Math.round(ph * sw / pw);
            this.fullscreen_width = 100;
            this.fullscreen_height = Math.round(100 * ph * sw / pw / sh);
        }
        this.fullscreen_margin = Math.round((sw - w) / 2);
        this.fullscreen_top_margin = Math.round((sh - h) / 2);
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
