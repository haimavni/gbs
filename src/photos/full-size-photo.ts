import { DialogDeactivationStatuses } from '@aurelia/dialog';
/* eslint-disable @typescript-eslint/no-this-alias */
import { IMemberGateway } from '../services/gateway';
import { IUser } from "../services/user";
import { ITheme } from "../services/theme";
import { MemberPicker } from "../members/member-picker";
import { ArticlePicker } from "../articles/article-picker";
import { copy_to_clipboard } from "../services/dom_utils";
import { FaceInfo } from './face-info';
import { QrPhoto } from './qr-photo';
import * as toastr from 'toastr';
import { IPopup } from '../services/popups';
import { ICustomElementViewModel, IEventAggregator } from 'aurelia';import { IRouter } from '@aurelia/router';
import { IDialogController, IDialogService } from '@aurelia/dialog';
import { I18N } from '@aurelia/i18n';

let THIS;

export class FullSizePhoto implements ICustomElementViewModel {
    baseURL;
    faces = [];
    articles = [];
    current_face;
    candidates = [];
    faces_already_identified = new Set();
    articles_already_identified = new Set();
    api;
    model;
    slide;
    curr_photo_id;
    slide_list = [];
    slide_index = 0;
    photo_info = { name: "", photo_date_str: "", photo_date_datespan: 0, photographer: "", photographer_known: true };
    highlighting = false;
    marking_face_active = false;
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
    mark_articles_text;
    mark_people_text;
    nobody_there;
    crop_sides;
    rotate;
    photo_detail;
    create_qr_photo_txt;
    share_on_facebook_txt;
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
    marking_articles = false;
    hint_position = 'right';
    photo_date_valid = "";
    image_height = 0;
    image_width = 0;
    keypress_handler;
    hide_details_icon = false;

    constructor(
        @IDialogController readonly dialogController: IDialogController,
        @IDialogService readonly dialogService: IDialogService,
        @IMemberGateway api: IMemberGateway,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @IRouter readonly router: IRouter,
        @IEventAggregator readonly eventAggregator: IEventAggregator,
        @I18N readonly i18n: I18N,
        @IPopup readonly popup: IPopup) {
        this.highlight_all = this.i18n.tr('photos.highlight-all');
        this.crop = this.i18n.tr('photos.crop');
        this.rotate = this.i18n.tr('photos.rotate-photo');
        this.photo_detail = this.i18n.tr('photos.photo-detail');
        this.create_qr_photo_txt = this.i18n.tr('photos.create-qr-photo')
        this.save_crop = this.i18n.tr('photos.save-crop');
        this.cancel_crop = this.i18n.tr('photos.cancel-crop');
        this.share_on_facebook_txt = this.i18n.tr('user.sharing.share-on-facebook');
        this.nobody_there = this.i18n.tr('photos.nobody-there');
        this.next_slide_txt = this.i18n.tr('photos.next-slide')
        this.prev_slide_txt = this.i18n.tr('photos.prev-slide')
        this.jump_to_story_page = this.i18n.tr('photos.jump-to-story-page');
        this.fullscreen = this.i18n.tr('photos.fullscreen');
        this.copy_photo_url_text = this.i18n.tr('photos.copy-photo-url');
        this.flip_text = this.i18n.tr('photos.flip');
        this.mark_people_text = this.i18n.tr('photos.mark-people');
        this.mark_articles_text = this.i18n.tr('photos.mark-articles');

        THIS = this;
        
        this.keypress_handler = function (event) {
            THIS.navigate(event);
        };
    }

    activate(model) {
        this.model = model;
        model.final_rotation = 0;
        this.slide = model.slide;
        this.slide_list = model.slide_list || [];
        this.settings = model.settings || {};
        this.list_of_ids = model.list_of_ids;
        this.baseURL = process.env.baseURL;
        document.addEventListener('keyup', this.keypress_handler);
        this.hide_details_icon = this.theme.is_desktop && ! this.slide.has_story_text && ! this.user.editing;
    }

    deactivate() {
        this.theme.hide_title = false;
        document.removeEventListener('keyup', this.keypress_handler);
    }

    navigate(event) {
        const el = document.getElementById('photo-image');
        if (el)
            el.style.transform = null;
        event.stopPropagation();
        const key = event.key
        if (key == 'ArrowRight') {
            this.next_slide(event);
        } else if (key == 'ArrowLeft') {
            this.prev_slide(event);
        }
    }

    attached() {
        const idx = this.slide_idx();
        this.can_go_forward = idx + 1 < this.slide_list.length;
        this.can_go_backward = idx > 0;
        let pid = this.slide[this.slide.side].photo_id;
        if (!pid) {
            pid = this.slide.photo_id;
            console.log("no photo id in ", this.slide.side, " photo id: ", pid);
        }
        this.get_faces(pid);
        this.get_articles(pid);
        this.get_photo_info(pid);
        this.api.hit('PHOTO', pid);
        if (this.user.editing && !this.highlighting)
            this.toggle_highlighting(null);
    }

    get_faces(photo_id) {
        this.faces = [];
        this.faces_already_identified = new Set();
        this.api.call_server('photos/get_faces', { photo_id: photo_id })
            .then((data) => {
                this.faces = data.faces;
                for (const face of this.faces) {
                    face.name = '<span dir="rtl">' + face.name + '</span>';
                    this.faces_already_identified.add(face.member_id);
                }
                this.candidates = data.candidates;
            });
    }

    get_articles(photo_id) {
        this.articles = [];
        this.api.call_server('photos/get_articles', { photo_id: photo_id })
            .then((data) => {
                this.articles = data.articles;
                for (const article of this.articles) {
                    article.name = '<span dir="rtl">' + article.name + '</span>';
                    this.articles_already_identified.add(article.article_id);
                }
            });
    }

    get_photo_info(photo_id) {
        this.api.call_server('photos/get_photo_info', { photo_id: photo_id })
            .then((data) => {
                this.photo_info.name = data.name;
                this.photo_info.photographer = data.photographer;
                this.photo_info.photographer_known = Boolean(this.photo_info.photographer);
                if (!this.photo_info.photographer_known) {
                    this.photo_info.photographer = this.i18n.tr('photos.unknown-photographer');
                }
                this.photo_info.photo_date_datespan = data.photo_date_datespan;
                this.photo_info.photo_date_str = data.photo_date_str;
            });

    }

    save_photo_info(event) {
        event.stopPropagation();
        if (this.photo_date_valid != 'valid') return;
        const pi = event.detail;
        this.photo_info.photo_date_str = pi.date_str;
        this.photo_info.photo_date_datespan = pi.date_span;
        this.api.call_server_post('photos/save_photo_info', {
            user_id: this.user.id,
            photo_id: this.slide.photo_id,
            photo_info: this.photo_info
        });
        return false;
    }

    save_photo_caption(event) {
        this.api.call_server_post('photos/save_photo_info', {
            user_id: this.user.id,
            photo_id: this.slide.photo_id,
            photo_info: this.photo_info
        });
    }

    face_location(face) {
        const d = face.r * 2;
        return {
            left: (face.x - face.r) + 'px',
            top: (face.y - face.r) + 'px',
            width: d + 'px',
            height: d + 'px',
            'background-color': face.action ? "rgba(100, 100,0, 0.2)" : "rgba(0, 0, 0, 0)",
            cursor: face.moving ? "move" : "hand",
            position: 'absolute'
        };
    }

    copy_photo_url(event) {
        event.stopPropagation();
        const src = this.slide[this.slide.side].src;
        const photo_id = this.slide[this.slide.side].photo_id;
        copy_to_clipboard(src);
        this.user.set_photo_link(src, photo_id);
        const msg = this.i18n.tr('user.sharing.photo-link-copied');
        toastr.success(msg)
        return false;
    }

    flip_photo(event) {
        event.stopPropagation();
        this.slide.side = (this.slide.side == 'front') ? 'back' : 'front';
        return false;
    }

    handle_article(article, event, index) {
        event.stopPropagation();
        if (!this.user.editing) {
            this.jump_to_article(article.article_id);
            return;
        }
        if (event.altKey && event.shiftKey) {
            this.remove_article(article);
            return;
        }
        this.assign_article(article);
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

    assign_face_or_member(face) {
        if (face.article_id)
            this.assign_article(face)
        else
            this.assign_member(face)
    }

    assign_article(article) {
        this.dialogService.open({
            component: () => ArticlePicker,
            model: {
                face_identifier: true,
                article_id: article.article_id,
                excluded: this.articles_already_identified,
                slide: this.slide,
                current_face: this.current_face
            }, lock: false
        })
            .whenClosed(response => {
                this.marking_face_active = false;
                if (response.wasCancelled) {
                    if (!article.article_id) {
                        this.hide_face(article);
                    }
                    //this.remove_face(article); !!! no!
                    return;
                }
                const old_article_id = article.article_id;
                const mi = (response.value && response.value.new_article) ? response.value.new_article.article_info : null;
                if (mi) {
                    article.name = article.article_id ? mi.name : mi.first_name + ' ' + mi.last_name;
                    article.article_id = response.value.new_article.article_info.id;
                    return;
                }
                article.article_id = response.value.article_id;
                const make_profile_photo = response.value.make_profile_photo;
                this.api.call_server_post('photos/save_article', {
                    face: article,
                    make_profile_photo: make_profile_photo,
                    old_article_id: old_article_id
                })
                    .then(response => {
                        article.name = response.article_name;
                        this.eventAggregator.publish('ArticleGotProfilePhoto', {
                            article_id: article.article_id,
                            face_photo_url: response.face_photo_url
                        });
                    });
            });

    }

    assign_member(face) {
        this.dialogService.open({
            component: () => MemberPicker,
            model: {
                face_identifier: true,
                member_id: face.member_id,
                candidates: this.candidates,
                excluded: this.faces_already_identified,
                current_face: this.current_face,
                help_topic: "pick-member"
            }, lock: false
        })
            .whenClosed(response => {
                this.marking_face_active = false;
                if (response.status == DialogDeactivationStatuses.Cancel) {
                    if (!face.member_id) {
                        this.hide_face(face);
                    }
                    //this.remove_face(face); !!! no!
                    return;
                }
                const old_member_id = face.member_id;
                const mi = (response.value && response.value.new_member) ? response.output.new_member.member_info : null;
                if (mi) {
                    face.name = mi.first_name + ' ' + mi.last_name;
                    face.member_id = response.value.new_member.member_info.id;
                    return;
                }
                face.member_id = response.value.member_id;
                const make_profile_photo = response.value.make_profile_photo;
                this.api.call_server_post('photos/save_face', {
                    face: face,
                    make_profile_photo: make_profile_photo,
                    old_member_id: old_member_id
                })
                    .then(response => {
                        const idx = this.candidates.findIndex(m => m.member_id == face.member_id);
                        this.candidates.splice(idx, 1);
                        this.faces_already_identified.add(face.member_id)
                        face.name = response.member_name;
                        this.eventAggregator.publish('MemberGotProfilePhoto', {
                            member_id: face.member_id,
                            face_photo_url: response.face_photo_url
                        });
                    });
            });

    }

    get instruction() {
        if (this.marking_face_active) {
            return this.i18n.tr('photos.edit-face-location')
        } else {
            let s = 'photos.click-to-identify';
            if (this.marking_articles)
                s += '-article';
            return this.i18n.tr(s)
        }
    }

    hide_face(face) {
        const i = this.faces.indexOf(face);
        this.faces.splice(i, 1);
    }

    hide_article(article) {
        const i = this.articles.indexOf(article);
        this.articles.splice(i, 1);
    }

    remove_face(face) {
        if (face.article_id) {
            return this.remove_article(face)
        }
        this.api.call_server_post('photos/detach_photo_from_member', {
            member_id: face.member_id,
            photo_id: this.slide.photo_id
        })
            .then(() => {
                this.hide_face(face);
            });
    }

    remove_article(article) {
        this.api.call_server_post('photos/detach_photo_from_article', {
            article_id: article.article_id,
            photo_id: this.slide.photo_id
        })
            .then(() => {
                this.hide_article(article);
            });
    }

    private jump_to_member(member_id) {
        this.dialogController.ok();
        this.router.load(`/member-details`, {
            parameters: {
                id: member_id,
                keywords: ''
            }
        });
    }

    private jump_to_article(article_id) {
        this.dialogController.ok();

        this.router.load(`/article-details`, {
            parameters: {
                id: article_id,
                keywords: ''
            }
        });
    }

    mark_face(event) {
        if (this.fullscreen_mode) {
            const width = this.theme.width;
            if (event.offsetX < width / 4) {
                this.prev_slide(event)
            } else if (event.offsetX > width * 3 / 4) {
                this.next_slide(event)
            }
            return;
        }
        if (this.no_new_faces) return;
        if (this.cropping) return;
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
        const face = {
            photo_id: photo_id,
            x: event.offsetX, y: event.offsetY, r: 30,
            name: this.i18n.tr("photos.unknown"),
            member_id: this.marking_articles ? 0 : -1,
            article_id: this.marking_articles ? -1 : 0,
            action: null
        };
        this.current_face = face;
        if (this.marking_articles)
            this.articles.push(face)
        else
            this.faces.push(face);
        this.marking_face_active = true;
        return false;
    }

    public dragstart(face, customEvent: CustomEvent, what) {
        if (!this.user.editing) {
            return true;
        }
        customEvent.stopPropagation();
        const face_id = (what == 'face-') ? what + face.member_id : what + face.article_id
        const el = document.getElementById(face_id);
        const rect = el.getBoundingClientRect();
        const face_center = { x: rect.left + rect.width / 2, y: rect.top + rect.width / 2 };
        const event = customEvent.detail;
        const x = event.pageX - face_center.x;
        const y = event.pageY - face_center.y;
        let r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
        r = this.distance(event, face_id)
        face.action = (r < face.r - 10) ? "moving" : "resizing";
        face.dist = r;
        this.current_face = { x: face.x, y: face.y, r: face.r, dist: face.dist, photo_id: face.photo_id };
    }

    distance(event, face_id) {
        const el = document.getElementById(face_id);
        const rect = el.getBoundingClientRect();
        const face_center = { x: rect.left + rect.width / 2, y: rect.top + rect.width / 2 };
        const x = event.pageX - face_center.x;
        const y = event.pageY - face_center.y;
        return Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)))
    }

    public dragmove(face, customEvent: CustomEvent) {
        if (!this.user.editing) {
            return;
        }
        customEvent.stopPropagation();
        const event = customEvent.detail;
        const id = face.article_id ? 'article-' + face.article_id : 'face-' + face.member_id;
        const el = document.getElementById(id);
        const current_face = this.current_face;
        if (face.action === "moving") {
            current_face.x += event.dx;
            current_face.y += event.dy;
        } else {
            const dist = this.distance(event, id);
            current_face.r += dist - current_face.dist;
            current_face.dist = dist;
        }
        const face_location = this.face_location(current_face);
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

    public dragend(face, customEvent: CustomEvent) {
        if (!this.user.editing) {
            return;
        }
        customEvent.stopPropagation();
        const event = customEvent.detail;
        if (face.action === "moving") {
            face.x += event.dx;
            face.y += event.dy;
        } else {
            const id = face.article_id ? 'article-' + face.article_id : 'face-' + face.member_id;
            const el = document.getElementById(id);
            const dist = this.distance(event, id)
            face.r += dist - face.dist;
            if (face.r < 18) {
                this.remove_face(face);
            }
        }
        if (face.article_id) {
            this.articles = this.articles.splice(0);
        } else {
            this.faces = this.faces.splice(0);
        }
        this.save_face_location(face);
        face.action = null;
    }

    public drag_move_photo(customEvent: CustomEvent) {
        if (!this.theme.is_desktop) {
            const event = customEvent.detail;
            const el = document.getElementById("full-size-photo");
            const mls = el.style.marginLeft.replace('px', '');
            const ml = Math.min(0, parseInt(mls) + event.dx);
            el.style.marginLeft = `${ml}px`;
        }
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

    public crop_photo(event) {
        event.stopPropagation();
        this.crop_height = this.slide[this.slide.side].height;
        this.crop_width = this.slide[this.slide.side].width;
        this.crop_top = 0;
        this.crop_left = 0;
        this.cropping = true;
        return false;
    }

    public save_photo_crop(event) {
        //call server to crop and refresh
        event.stopPropagation();
        const photo_data = this.slide[this.slide.side];
        const photo_id = this.slide[this.slide.side].photo_id || this.slide.photo_id; //temporary bug hider
        this.api.call_server_post('photos/crop_photo', {
            photo_id: photo_id,
            crop_left: this.crop_left,
            crop_top: this.crop_top,
            crop_width: this.crop_width,
            crop_height: this.crop_height
        })
            .then((data) => {
                photo_data.src = data.photo_src;   //to ensure refresh
                photo_data.width = this.crop_width;
                photo_data.height = this.crop_height;
                for (const face of this.faces) {
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
        const event = customEvent.detail;
        const height = this.slide[this.slide.side].height;
        const width = this.slide[this.slide.side].width;
        if (this.crop_sides == 'nw' || this.crop_sides == 'sw') {
            const crop_left = Math.max(this.crop_left + event.dx, 0)
            const dx = crop_left - this.crop_left;
            this.crop_width -= dx;
            this.crop_left = crop_left;
        }
        if (this.crop_sides == 'nw' || this.crop_sides == 'ne') {
            const crop_top = Math.max(this.crop_top + event.dy, 0)
            const dy = crop_top - this.crop_top;
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
        customEvent.stopPropagation();
        const event = customEvent.detail;
        const el: HTMLElement = document.getElementById('cropper');
        const rect = el.getBoundingClientRect();
        const we = event.pageX - rect.left < rect.width / 2 ? 'w' : 'e';
        const ns = event.pageY - rect.top < rect.height / 2 ? 'n' : 's';
        this.crop_sides = ns + we;
    }

    rotate_photo(event) {
        event.stopPropagation();
        const rotate_clockwise: boolean = event.ctrlKey;
        const photo_id = this.slide[this.slide.side].photo_id || this.slide.photo_id; //temporary bug hider
        this.api.call_server('photos/rotate_selected_photos', { selected_photo_list: [photo_id], rotate_clockwise: rotate_clockwise })
            .then(result => {
                const angle = rotate_clockwise ? 270 : 90;
                this.model.final_rotation += angle;
                const el = document.getElementById('photo-image');
                el.style.transform = `rotate(-${this.model.final_rotation}deg)`;
            })
        return false;
    }

    async share_on_facebook(event) {
        event.stopPropagation();
        let card_url;
        let img_src = this.slide[this.slide.side].src;
        const photo_id = this.slide[this.slide.side].photo_id;
        await this.api.call_server_post('photos/get_padded_photo_url', { photo_url: img_src, photo_id: photo_id }) //photo_url is deprecated
            .then(response => img_src = response.padded_photo_url);
        const title = this.i18n.tr('app-title');
        const description = this.photo_info.name;
        const url = `${location.pathname}${location.hash}`;
        let current_url;
        await this.api.call_server_post('default/get_shortcut', { url: url })
            .then(response => {
                let base_url = `${location.host}`;
                if (base_url == "localhost:9000") {
                    base_url = process.env.baseURL;  //for the development system
                }
                current_url = base_url + response.shortcut;
            });
        await this.api.call_server_post('default/make_fb_card',
            { img_src: img_src, url: current_url, title: title, description: description })
            .then(response => {
                card_url = response.card_url;
                copy_to_clipboard(card_url);
            });
        const href = `https://facebook.com/sharer/sharer.php?u=${card_url}&t=${title}`;
        const width = this.theme.width;
        const left = width - 526 - 200;
        this.popup.popup('SHARER', href, `height=600,width=526,left=${left},top=100`);
    }


    toggle_people_articles(event) {
        event.stopPropagation();
        this.marking_articles = !this.marking_articles;
    }

    nobody(event) {
        event.stopPropagation();
        const unrecognize = event.ctrlKey;
        this.api.call_server('photos/mark_as_recogized', { photo_id: this.slide[this.slide.side].photo_id, unrecognize: unrecognize });
    }

    async create_qr_photo(event) {
        const photo_id = this.slide[this.slide.side].photo_id;
        const url = `${location.pathname}${location.hash}`;
        let current_url;
        await this.api.call_server_post('default/get_shortcut', { url: url })
            .then(response => {
                let base_url = `${location.host}`;
                if (base_url == "localhost:9000") {
                    base_url = process.env.baseURL;  //for the development system
                }
                current_url = base_url + response.shortcut;
            });
        this.dialogService.open({
            component: () => QrPhoto,
            model: {
                photo_id: photo_id,
                shortcut: current_url
            }, lock: false
        })   

    }

    slide_idx() {
        if (this.list_of_ids) {
            const photo_id = this.slide[this.slide.side].photo_id;
            return this.slide_list.findIndex(pid => pid == photo_id);
        }
        return this.slide_list.findIndex(slide => slide.photo_id == this.slide.photo_id);
    }

    public has_next(step) {
        const idx = this.slide_idx();
        return 0 <= (idx + step) && (idx + step) < this.slide_list.length;
    }

    get_slide_by_idx(idx) {
        if (this.list_of_ids) {
            return this.get_slide_by_idx_list_ids(idx);
        }
        this.slide = this.slide_list[idx];
        const pid = this.slide.photo_id;
        this.get_faces(pid);
        this.get_articles(pid);
        this.get_photo_info(pid);
    }

    get_slide_by_idx_list_ids(idx) {
        const pid = this.slide_list[idx];
        this.curr_photo_id = pid;
        this.api.call_server('photos/get_photo_detail', { photo_id: pid })
            .then(response => {
                const p = this.slide[this.slide.side];
                p.src = response.photo_src;
                p.photo_id = pid;
                p.width = response.width;
                p.height = response.height;
                this.calc_percents();
            })
    }

    public next_slide(event) {
        event.stopPropagation();
        const idx = this.slide_idx();
        if (idx + 1 < this.slide_list.length) {
            this.get_slide_by_idx(idx + 1);
            this.can_go_forward = idx + 2 < this.slide_list.length;
            this.can_go_backward = true;
            if (this.list_of_ids) {
                this.get_faces(this.curr_photo_id);
                this.get_articles(this.curr_photo_id)
                this.get_photo_info(this.curr_photo_id);
            }
        }
    }

    public prev_slide(event) {
        event.stopPropagation();
        const idx = this.slide_idx();
        if (idx > 0) {
            this.get_slide_by_idx(idx - 1)
            this.can_go_forward = true;
            this.can_go_backward = idx > 1;
            if (this.list_of_ids) {
                this.get_faces(this.curr_photo_id);
                this.get_articles(this.curr_photo_id);
                this.get_photo_info(this.curr_photo_id);
            }
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
        const el = document.getElementById('full-size-photo');
        const rect = el.getBoundingClientRect(); // as DOMRect;
        this.no_new_faces = true;
        this.current_face = face;
        document.body.classList.add('semi-black-overlay');
        this.dialogService.open({
            component: () => FaceInfo,
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
            if (response.status === 'ok') {
                const command = response.value.command;
                if (command == 'cancel-identification') {
                    this.marking_face_active = false;
                    this.remove_face(face)
                } else if (command == 'save-face-location') {
                    this.marking_face_active = false;
                    if (face.article_id) {
                        if (face.article_id > 0)
                            this.api.call_server_post('photos/save_article', { face: face });
                        else
                            this.assign_article(face);
                    } else {
                        if (face.member_id > 0)
                            this.api.call_server_post('photos/save_face', { face: face });
                        else
                            this.assign_member(face);
                    }
                }
            }
        })

    }

    save_face_location(face) {
        if (face.article_id > 0)
            this.api.call_server_post('photos/save_article', { face: face });
        else if (face.member_id > 0)
            this.api.call_server_post('photos/save_face', { face: face });
        }

    get face_moved() {
        if (!this.user.editing) return;
        const current_face = this.current_face;
        if (!current_face) return;
        const id = current_face.article_id ? 'article-' + current_face.article_id : 'face-' + current_face.member_id;
        const el = document.getElementById(id);
        if (!el) return;
        const face_location = this.face_location(current_face);
        el.style.left = face_location.left;
        el.style.top = face_location.top;
        el.style.width = face_location.width;
        el.style.height = face_location.height;
        return 'bla';
    }

    async makeFullScreen() {
        this.curr_photo_id = this.slide.photo_id;
        this.fullscreen_mode = false;
        const el = document.getElementById("photo-image");
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
        if (!this.fullscreen_mode) {
            this.get_faces(this.curr_photo_id);
            this.get_articles(this.curr_photo_id);
            this.get_photo_info(this.curr_photo_id);
        }
    }

    close(event) {
        this.dialogController.ok();
    }

    get force_calc_percents() {
        this.calc_percents();
        return "";
    }

    calc_percents() {
        const ph = this.slide[this.slide.side].height;
        const pw = this.slide[this.slide.side].width;
        const sh = this.theme.height;
        const sw = this.theme.width;
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

    get incomplete() {
        if (this.photo_date_valid != 'valid')
            return "disabled"
        return ''
    }

    image_loaded() {
        this.image_height = this.slide[this.slide.side].height;
        this.image_width = this.slide[this.slide.side].width;
        this.calc_percents();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
