import { MemberGateway } from '../services/gateway';
import { Router } from 'aurelia-router';
import { DialogController, DialogService } from 'aurelia-dialog';
import { autoinject } from 'aurelia-framework';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { MemberPicker } from "../members/member-picker";
import environment from "../environment";
import { EventAggregator } from 'aurelia-event-aggregator';
import { getOffset } from "../services/dom_utils";
import { I18N } from 'aurelia-i18n';
import { copy_to_clipboard } from '../services/dom_utils';

@autoinject()
export class FullSizePhoto {
    dialogController;
    dialogService;
    baseURL;
    faces = [];
    current_face;
    candidates = [];
    api;
    user;
    theme;
    slide;
    photo_info = { name: "", photo_date_str: "", photo_date_datespan: 0, photographer: "" };
    router;
    highlighting = false;
    eventAggregator;
    marking_face_active = false;
    i18n;
    highlight_all;
    jump_to_story_page;
    copy_photo_url_text;
    flip_text;
    navEvent;

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
        this.jump_to_story_page = this.i18n.tr('photos.jump-to-story-page');
        this.copy_photo_url_text = this.i18n.tr('photos.copy-photo-url');
        this.flip_text = this.i18n.tr('photos.flip');
    }

    activate(model) {
        this.slide = model.slide;
        this.baseURL = environment.baseURL;
        let pid =  this.slide[this.slide.side].photo_id;
        if (! pid) {
            pid = this.slide.photo_id;
            console.log("no photo id in ", this.slide.side, " photo id: ", pid);
        }
        this.get_faces(pid);
        this.get_photo_info(pid);
        this.api.hit('PHOTO', pid);
        this.navEvent = this.eventAggregator.subscribe('router:navigation:complete', response => {
            this.dialogController.ok();
        });
        this.theme.hide_title = true;
    } 

    deactivate() {
        this.navEvent.dispose();
        this.theme.hide_title = false;
    }

    attached() {
        let div = document.getElementById("full-size-photo");
    }

    get_faces(photo_id) {
        this.faces = [];
        this.api.call_server('photos/get_faces', { photo_id: photo_id })
            .then((data) => {
                this.faces = data.faces;
                for (let face of this.faces) {
                    face.name = '<span dir="rtl">' + face.name + '</span>';
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
                    this.photo_info.photographer = this.i18n.tr('photos.unknown');
                }
                this.photo_info.photo_date_datespan = data.photo_date_datespan;
                this.photo_info.photo_date_str = data.photo_date_str;
            });

    }

    save_photo_info(event) {
        let pi = event.detail;
        this.photo_info.photo_date_str = pi.date_str;
        this.photo_info.photo_date_datespan = pi.date_span;
        this.api.call_server_post('photos/save_photo_info', { user_id: this.user.id, photo_id: this.slide.photo_id, photo_info: this.photo_info });
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
            'background-color': face.action ? "rgba(100, 100,0, 0.8)" : "rgba(0, 0, 0, 0)",
            cursor: face.moving ? "move" : "hand",
            position: 'absolute',
        };
    }

    copy_photo_url() {
        copy_to_clipboard(this.slide.src);
    }

    flip_photo() {
        this.slide.side = (this.slide.side == 'front') ? 'back' : 'front';
    }

    handle_face(face, event, index) {
        event.stopPropagation();
        if (!this.user.editing) {
            this.jump_to_member(face.member_id);
            return;
        }
        this.dialogService.open({ 
            viewModel: MemberPicker, 
            model: {
                face_identifier: true, 
                member_id: face.member_id, 
                candidates: this.candidates, 
                slide: this.slide,
                current_face: this.current_face }, lock: false })
        .whenClosed(response => {
            this.marking_face_active = false;
            if (response.wasCancelled) {
                if (! face.member_id) {
                    this.hide_face(face);
                }
                //this.remove_face(face); !!! no!
                return;
            }
            let old_member_id = face.member_id;
            let mi =  (response.output && response.output.new_member) ? response.output.new_member.member_info : null;
            if (mi) {
                face.name = mi.first_name + ' ' + mi.last_name;
                return;
            }
            face.member_id = response.output.member_id;
            let make_profile_photo = response.output.make_profile_photo;
            this.api.call_server_post('photos/save_face', { face: face, make_profile_photo: make_profile_photo, old_member_id: old_member_id })
                .then(response => {
                    let idx = this.candidates.findIndex(m => m.member_id == face.member_id);
                    this.candidates.splice(idx, 1);
                    face.name = response.member_name;
                    this.eventAggregator.publish('MemberGotProfilePhoto', { member_id: face.member_id, face_photo_url: response.face_photo_url });
                });
        });
    }

    hide_face(face) {
        let i = this.faces.indexOf(face);
        this.faces.splice(i, 1);
    }

    remove_face(face) {
        console.log("remove face!!!");
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
        this.router.navigateToRoute('photo-detail', { id: this.slide[this.slide.side].photo_id, keywords: "" });
    }

    mark_face(event) {
        event.stopPropagation();
        if (!this.user.editing) {
            return;
        }
        if (this.marking_face_active) {
            return;
        }
        let photo_id = this.slide[this.slide.side].photo_id;
        if (! photo_id) {
            photo_id = this.slide.photo_id; //todo: ugly
        }
        let face = { photo_id: photo_id, x: event.offsetX, y: event.offsetY, r: 30, name: "unknown", member_id: 0, left: event.pageX - event.offsetX, top: event.pageY - event.offsetY, action: null };
        this.current_face = face;
        this.faces.push(face);
        this.marking_face_active = true;
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
        let pt = { x: event.pageX - face.corner.left, y: event.pageY - face.corner.top };
        let dist = this.distance(face, pt);
        face.action = (dist < face.r - 10) ? "moving" : "resizing";
        face.dist = dist;
        this.current_face = { x: face.x, y: face.y, r: face.r, dist: face.dist };
    }

    public dragmove(face, customEvent: CustomEvent) {
        customEvent.stopPropagation();
        if (!this.user.editing) {
            return;
        }
        let el = document.getElementById('face-' + face.member_id);
        let current_face = this.current_face;
        let event = customEvent.detail;
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
        if (face.action == 'moving') {
            el.style.cursor = 'all-scroll';
        } else {
            el.style.cursor = 'se-resize';
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
        event.stopPropagation();
        let el = document.getElementById("full-size-photo");
        el.classList.toggle("highlight-faces");
        el = document.getElementById("side-tool highlighter");
        el.blur();
    }

}

