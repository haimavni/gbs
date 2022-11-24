import { Router } from 'aurelia-router';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { User } from '../services/user';
import { autoinject, computedFrom } from 'aurelia-framework';

@autoinject
export class ShowPhoto {
    dialog: DialogService;
    user: User;
    router: Router;

    constructor(router: Router, user: User, dialog: DialogService) {
        this.user = user;
        this.dialog = dialog;
        this.router = router;
    }

    public show(photo, event, photo_ids) {
        if (photo.has_story_text || this.user.editing) {
            this.router.navigateToRoute('photo-detail', { id: photo.photo_id, keywords: "", photo_ids: photo_ids, pop_full_photo: true });
        } else {
            this.openDialog(photo, event, photo_ids)
        }
    }

    private openDialog(slide, event, slide_list) {
        if (event)
            event.stopPropagation();
        document.body.classList.add('black-overlay');
        this.dialog.open({
            viewModel: FullSizePhoto,
            model: { slide: slide, slide_list: slide_list, hide_details_icon: !this.user.editing }, lock: false
        }).whenClosed(response => {
            document.body.classList.remove('black-overlay');
        });
    }


}
