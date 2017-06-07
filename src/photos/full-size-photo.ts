import { MemberGateway } from '../services/gateway';
import { Router } from 'aurelia-router';
import { DialogController } from 'aurelia-dialog';
import { DialogService } from 'aurelia-dialog';
import { autoinject } from 'aurelia-framework';
import { User } from "../services/user";
import {MemberPicker} from "../members/member-picker";
import environment from "../environment";

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

    constructor(dialogController: DialogController, dialogService: DialogService, api: MemberGateway, user: User, router: Router) {
        this.dialogController = dialogController;
        this.dialogService = dialogService;
        this.api = api;
        this.user = user;
        this.router = router;
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
        this.api.call_server('stories/get_faces', { photo_id: photo_id })
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
            }
        }
        else {
            resizing = false;
        }
        if (resizing) {
            this.faces = this.faces.splice(0);
            this.api.call_server_post('stories/resize_face', { face: face, resizing: true });
            return;
        }
        this.dialogService.open({ viewModel: MemberPicker, model: {face_identifier: true}, lock: false }).whenClosed(response => {
            face.member_id = response.output.member_id;
            console.log("member id: " + face.member_id);
            this.api.call_server_post('stories/resize_face', { face: face, resizing: false })
            .then(response => face.name = response.member_name);
        });
    }

    remove_face(face) {
        this.api.call_server_post('stories/remove_face', {face: face})
        let i = this.faces.indexOf(face);
        this.faces.splice(i, 1);
    }


    private jump_to_member(member_id) {
        this.dialogController.ok();
        this.router.navigateToRoute('member-details', {id: member_id});
    }

    mark_face(event) {
        if (!this.user.editing) {
            return;
        }
        let photo_id = this.slide.photo_id;
        let face = { photo_id: photo_id, x: event.offsetX, y: event.offsetY, r: 20, name: "unknown" };
        this.faces.push(face);
        this.api.call_server_post('stories/add_face', { face: face });
    }

}
