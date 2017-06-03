import { MemberGateway } from '../services/gateway';
import { Router } from 'aurelia-router';
import { DialogController } from 'aurelia-dialog';
import { DialogService } from 'aurelia-dialog';
import { autoinject } from 'aurelia-framework';
import { User } from "../services/user";
import {MemberPicker} from "../members/member-picker";

@autoinject()
export class FullSizePhoto {
    dialogController;
    dialogService;
    photo_url;
    faces = [];
    api;
    user;
    image;
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
        this.image = model.image;
        this.photo_url = this.image.path;
        this.get_faces(this.image.id);

    }

    get_faces(photo_id) {
        this.faces = [];
        this.api.call_server('stories/get_faces', { photo_id: photo_id })
            .then((data) => {
                this.faces = data.faces;
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
            this.api.call_server_post('stories/resize_face', { face: face });
            return;
        }
        this.dialogService.open({ viewModel: MemberPicker, model: {  }, lock: false }).whenClosed(response => {
            face.member_id = response.output.member_id;
            this.api.call_server_post('stories/resize_face', { face: face });
            console.log(response.member_id);
        });
    }

    remove_face(face) {
        let i = this.faces.indexOf(face);
        this.faces.splice(i, 1);
    }


    jump_to_member(member_id) {
        this.dialogController.ok();
        this.router.navigateToRoute('member-details', {id: member_id});
    }

    mark_face(event) {
        if (!this.user.editing) {
            return;
        }
        let photo_id = this.image.id;
        let face = { photo_id: photo_id, x: event.offsetX, y: event.offsetY, r: 20, name: "unknown" };
        this.faces.push(face);
        this.api.call_server_post('stories/add_face', { face: face });
    }

}
