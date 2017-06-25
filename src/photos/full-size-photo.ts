import { MemberGateway } from '../services/gateway';
import { Router } from 'aurelia-router';
import { DialogController } from 'aurelia-dialog';
import { DialogService } from 'aurelia-dialog';
import { autoinject } from 'aurelia-framework';
import { User } from "../services/user";
import { MemberPicker } from "../members/member-picker";
import environment from "../environment";
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
export class FullSizePhoto {
    dialogController;
    dialogService;
    baseURL;
    faces = [];
    candidates = [];
    api;
    user;
    slide;
    router;
    eventAggregator;

    constructor(dialogController: DialogController,
        dialogService: DialogService,
        api: MemberGateway,
        user: User,
        router: Router,
        eventAggregator: EventAggregator) {
        this.dialogController = dialogController;
        this.dialogService = dialogService;
        this.api = api;
        this.user = user;
        this.router = router;
        this.eventAggregator = eventAggregator;
        console.debug("constructing dialog");
    }

    activate(model) {
        console.debug("enter activate");
        this.slide = model.slide;
        this.baseURL = environment.baseURL;
        this.get_faces(this.slide.photo_id);

    }

    get_faces(photo_id) {
        this.faces = [];
        this.api.call_server('members/get_faces', { photo_id: photo_id })
            .then((data) => {
                this.faces = data.faces;
                this.candidates = data.candidates;
            });
    }

    face_location(face) {
        console.debug("face location");
        let d = face.r * 2;
        return {
            left: (face.x - face.r) + 'px',
            top: (face.y - face.r) + 'px',
            width: d + 'px',
            height: d + 'px',
            'background-color': face.action ? "rgba(100, 100,0, 0.8)" : "rgba(0, 0, 0, 0)",
            cursor: face.moving ? "move" : "hand",
            position: 'absolute'
        };
    }

    handle_face(face, event, index) {
        event.stopPropagation();
        if (!this.user.editing) {
            this.jump_to_member(face.member_id);
            return;
        }

        let resizing = true;
        if (event.ctrlKey) {
            face.r += 5;
        }
        else if (event.shiftKey) {
            if (face.r > 15) {
                face.r -= 5;
            }
            else {
                face.r = 0;
                this.remove_face(face);
                return;
            }
        }
        else {
            resizing = false;
        }
        if (resizing) {
            this.faces = this.faces.splice(0);
            return;
        }
        this.dialogService.open({ viewModel: MemberPicker, model: { face_identifier: true, member_id: face.member_id }, lock: false }).whenClosed(response => {
            if (response.wasCancelled) {
                this.remove_face(face);
                return;
            }
            face.member_id = response.output.member_id;
            let make_profile_photo = response.output.make_profile_photo;
            console.log("member id: " + face.member_id);
            this.api.call_server_post('members/save_face', { face: face, resizing: false, make_profile_photo: make_profile_photo })
                .then(response => {
                    face.name = response.member_name;
                    this.eventAggregator.publish('MemberGotProfilePhoto', { member_id: face.member_id });
                });
        });
    }

    remove_face(face) {
        this.api.call_server_post('members/remove_face', { face: face })
        let i = this.faces.indexOf(face);
        this.faces.splice(i, 1);
    }

    private jump_to_member(member_id) {
        this.dialogController.ok();
        this.router.navigateToRoute('member-details', { id: member_id });
    }

    mark_face(event) {
        if (!this.user.editing) {
            return;
        }
        let photo_id = this.slide.photo_id;
        //todo: left and top below should be found directly. Unlike the click event, drag events do not give coords relative to the img, so we need to know the NW coords of the img.
        let face = { photo_id: photo_id, x: event.offsetX, y: event.offsetY, r: 20, name: "unknown", left: event.pageX - event.offsetX, top: event.pageY - event.offsetY, action: null };
        this.faces.push(face);
    }

    private distance(face, event) {
        let point = { x: event.pageX - face.left, y: event.pageY - face.top };
        let dist = Math.sqrt(Math.pow(point.x - face.x, 2) + Math.pow(point.y - face.y, 2));
        return Math.round(dist);
    }

    public dragstart(face, customEvent: CustomEvent) {
        face.x0 = face.x;
        face.y0 = face.y;
        face.r0 = face.r;
        let event = customEvent.detail;
        face.distance = this.distance(face, event);
        let point = { x: event.pageX - face.left, y: event.pageY - face.top };
        let dist = Math.sqrt(Math.pow(point.x - face.x, 2) + Math.pow(point.y - face.y, 2));
        face.action = (dist < face.r - 10) ? "moving" : "resizing";
    }

    public dragmove(face, customEvent: CustomEvent) {
        //todo: how to show while moving?
    }

    public dragend(face, customEvent: CustomEvent) {
        customEvent.stopPropagation();
        let event = customEvent.detail;
        if (face.action === "moving") {
            face.x += event.dx;
            face.y += event.dy;
        } else {
            let distance = this.distance(face, event);
            face.r += distance - face.distance;
            if (face.r < 15) {
                this.remove_face(face);
            }
        }
        this.faces = this.faces.splice(0);

        face.action = null;
    }

}
