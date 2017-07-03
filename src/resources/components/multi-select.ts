export class MutiSelect {
    params;
    action;
    compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;

    toggle_selection(kw) {
        let i1 = this.params.selected_keywords.indexOf(kw);
        let i2 = this.params.unselected_keywords.indexOf(kw);
        let lst1, lst2;
        if (i1) {
            let x = this.params.selected_keywords.splice(i1, 1);
            this.params.unselected_keywords.push(x);
            this.params.unselected_keywords.sort(this.compare)
        } else {
            let x = this.params.unselected_keywords.splice(i2, 1);
            this.params.selected_keywords.push(x);
            this.params.selected_keywords.sort(this.compare)
        }

        this.action();
    }

    activate(model) {
        this.params=model.params;
        this.action=model.action;
    }
 
}