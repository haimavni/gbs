export class BlackSheep {
    black_loc = 12;
    white_locs = [0,1,2,100,101,11,110,111,12,21,22];
    mode = 'placing'; // solving-display

    status(r, c, m) {
        let n = 100 * m + 10 * r + c;
        let kind = m ? 'middle' : 'main';
        if (this.black_loc == n) return 'black ' + kind;
        if (this.white_locs.findIndex(item => item == n) >= 0) return 'white ' + kind;
        return 'empty ' + kind;
    }

    has_border(r, c) {
        if (r < 2 && c < 2) return 'bordered crossed';
        return 'unbordered';
    }

    new_game() {
        this.black_loc = -1;
        this.white_locs = [];
    }

}
