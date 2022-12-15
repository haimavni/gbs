import { IMemberGateway } from '../services/gateway';
import { ITheme } from '../services/theme';
import * as download from 'downloadjs';

export class ShowLogs {
    log_files = [];
    displayed_log_file = '';
    log_html = '';
    pageSize = 15;
    filters = [{ value: '', keys: ['fn'] }];

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @ITheme readonly theme: ITheme
    ) {}

    attached() {
        this.theme.hide_menu = true;
        this.get_file_list();
    }

    get_file_list() {
        this.api.call_server('developer/log_file_list').then((data) => {
            this.log_files = data.log_files;
        });
    }

    show_log_file(file_name) {
        this.displayed_log_file = file_name;
        this.api
            .call_server_post('developer/log_file_data', {
                file_name: file_name,
            })
            .then((data) => {
                this.log_html = data.log_html;
            });
    }

    delete_log_file(file_name) {
        this.api
            .call_server_post('developer/delete_log_file', {
                file_name: file_name,
            })
            .then((data) => {
                const idx = this.log_files.findIndex(
                    (lf) => lf.fn == file_name
                );
                this.log_files.splice(idx, 1);
            });
    }

    download_log_file(file_name) {
        this.api
            .call_server('developer/download_log_file', {
                file_name: file_name,
            })
            .then((data) => {
                const url = data.file_path;
                download(url);
            });
    }
}
