import { autoinject } from "aurelia-framework";
import { User } from '../services/user';
import { Login } from '../user/login';
import { DialogService } from 'aurelia-dialog';
import { UploadPhotos } from '../photos/upload-photos';

@autoinject()
export class UserMode {

    user;
    dialog;
    loginData = { email: '', password: '' };

    constructor(user: User, dialog: DialogService) {
        this.user = user;
        this.dialog = dialog;
    }

    toggle_edit_mode() {
        this.user.toggle_edit_mode();
    }

    private loginDialog() {
        this.dialog.open({ viewModel: Login, model: this.loginData, lock: false }).whenClosed(response => {
            if (!response.wasCancelled) {
                console.log('successful login - ', response.output);
            } else {
                console.log('login cancelled');
            }
            console.log(response.output);
        });
    }

    login() {
        this.user.checkIfLoggedIn()
            .then((result) => {
                if (!result) {
                    this.loginDialog();
                }
            });
    }

    logout() {
        this.user.logout();
    }

    upload_files() {
        this.dialog.open({ viewModel: UploadPhotos, lock: false });

    }
}
