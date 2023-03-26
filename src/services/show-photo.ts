import { IRouter } from '@aurelia/router';
import { IDialogService } from '@aurelia/dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { IUser } from '../services/user';
import { IMisc } from '../services/misc';
import { DI } from 'aurelia';

export const IShowPhoto = DI.createInterface<IShowPhoto>('IShowPhoto', x => x.singleton(ShowPhoto));
export type IShowPhoto = ShowPhoto;

export class ShowPhoto {
    constructor(@IRouter readonly router: IRouter, @IUser readonly user: IUser, @IMisc readonly misc: IMisc, @IDialogService readonly dialog: IDialogService) {

    }

    public show(photo, event, photo_ids) {
        if (photo.has_story_text || this.user.editing) {
            this.router.load('/photo-detail', {
                parameters : {
                    id: photo.photo_id, keywords: "", photo_ids: photo_ids,
                    pop_full_photo: true, has_story_text: photo.has_story_text
                }
            });
        } else {
            this.openDialog(photo, event, photo_ids)
        }
    }

    private async openDialog(slide, event, photo_ids) {
        if (event)
            event.stopPropagation();
        const width = 60;  // section width
        const idx = photo_ids.findIndex(pid => slide.photo_id==pid);
        let start = 0;
        const len = photo_ids.length;
        if (idx < width) {
            start = 0
        } else if (len - idx < width) {
            start = len - width
        } else if (len > width) {
            start = Math.round(idx - width / 2);
        } 

        photo_ids = photo_ids.slice(start, width)
        let addr = window.location.origin + window.location.pathname;
        addr += `#/photos/${slide.photo_id}/*?`
        const pids = photo_ids.map(pid => `photo_ids%5B%5D=${pid}`);
        const s = pids.join('&') + '&pop_full_photo=true'
        addr += s
        //let shortcut = null;
        this.misc.url_shortcut = addr;
        document.body.classList.add('black-overlay');
        this.dialog.open({
            component: () => FullSizePhoto,
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
