import { Router } from 'aurelia-router';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { User } from '../services/user';
import { Misc } from '../services/misc';
import { autoinject, computedFrom } from 'aurelia-framework';

@autoinject
export class ShowPhoto {
    dialog: DialogService;
    user: User;
    misc: Misc;
    router: Router;

    constructor(router: Router, user: User, misc: Misc, dialog: DialogService) {
        this.user = user;
        this.misc = misc;
        this.dialog = dialog;
        this.router = router;
    }

    public show(photo, event, photo_ids) {
        if (photo.has_story_text || this.user.editing) {
            this.router.navigateToRoute('photo-detail', {
                id: photo.photo_id, keywords: "", photo_ids: photo_ids,
                pop_full_photo: true, has_story_text: photo.has_story_text
            });
        } else {
            this.openDialog(photo, event, photo_ids)
        }
    }

    private async openDialog(slide, event, photo_ids) {
        if (event)
            event.stopPropagation();
        let addr = window.location.origin + window.location.pathname;
        photo_ids = photo_ids.slice(0, 50)
        addr += `#/photos/${slide.photo_id}/*?`
        let pids = photo_ids.map(pid => `photo_ids%5B%5D=${pid}`);
        let s = pids.join('&') + '&pop_full_photo=true'
        addr += s
        //let shortcut = null;
        this.misc.url_shortcut = addr;
        document.body.classList.add('black-overlay');
        this.dialog.open({
            viewModel: FullSizePhoto,
            model: {
                slide: slide, slide_list: photo_ids,
                hide_details_icon: !(this.user.editing || slide.has_story_text),
                list_of_ids: true
            }, lock: false
        }).whenClosed(response => {
            document.body.classList.remove('black-overlay');
            this.misc.url_shortcut = null;  //delete it
        });
    }


}
