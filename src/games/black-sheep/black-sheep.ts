import { MemberGateway } from '../../services/gateway';
import { autoinject } from 'aurelia-framework';
import { Theme } from '../../services/theme';

@autoinject
export class BlackSheep {
    api;
    theme;
    black_loc = 12;
    white_locs = new Set([0, 1, 2, 100, 101, 11, 110, 111, 12, 21, 22]);
    mode = 'placing'; // solving-display
    solution_steps = [];
    curr_step_idx = 0;
    failed = false;
    
    constructor(api: MemberGateway, theme: Theme) {
        this.api = api;
        this.theme = theme;
    }

    attached() {
        this.theme.hide_menu = true;
    }

    status(r, c, m) {
        let n = 100 * m + 10 * r + c;
        if (this.black_loc == n) return 'black';
        if (this.white_locs.has(n)) return 'white';
        return 'lightgray';
    }

    has_border(r, c) {
        if (r < 2 && c < 2) return 'bordered crossed';
        return 'unbordered';
    }

    new_game() {
        this.black_loc = -1;
        this.white_locs = new Set([]);
        this.curr_step_idx = 0;
        this.solution_steps = [];
        this.refresh();
        this.failed = false;
    }

    mutate(r, c, m, event) {
        let n = 100 * m + 10 * r + c;
        if (this.black_loc == n) {
            this.black_loc = -1
        }
        else if (this.white_locs.has(n)) {
            this.white_locs.delete(n);
            this.black_loc = n;
        } else {
            this.white_locs.add(n);
        }
        this.refresh();
    }

    refresh() {
        for (let loc of [0, 1, 2, 3, 10, 11, 12, 20, 21, 22, 100, 101, 110, 111]) {
            let locs = '' + loc;
            let el = document.getElementById(locs)
            let c = loc % 10;
            let r = (loc - c) / 10;
            let m = (loc - c - r * 10) / 100;
            if (el) {
                el.style.backgroundColor = this.status(r, c, m);
            }
        }
    }

    id_of_loc(r, c, m) {
        return 100 * m + 10 * r + c;
    }

    solve() {
        let arr = Array.from(this.white_locs);
        this.api.call_server_post('games/solve_black_sheep', { black_loc: this.black_loc, white_locs: arr })
            .then(response => {
                this.solution_steps = response.solution_steps;
                this.failed = this.solution_steps.length == 0;
            })
    }

    get has_solution() {
        return this.solution_steps.length > 0;
    }

    next() {
        let step = this.solution_steps[this.curr_step_idx];
        this.curr_step_idx += 1;
        this.white_locs.delete(step[1]);
        let black = step[0];
        if (black) {
            this.black_loc = step[3]
        } else {
            this.white_locs.delete(step[2]);
            this.white_locs.add(step[3]);
        }
        this.refresh();
    }

    prev() {
        this.curr_step_idx -= 1;
        let step = this.solution_steps[this.curr_step_idx];
        this.white_locs.add(step[1]);
        let black = step[0];
        if (black) {
            this.black_loc = step[2]
        } else {
            this.white_locs.delete(step[3]);
            this.white_locs.add(step[2]);
        }
        this.refresh();
    }
}
