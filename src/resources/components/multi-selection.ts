export class MultiSelection {
    params;
    compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;

    toggle_selection(topic) {
        let i1 = this.params.selected_topics.indexOf(topic);
        let i2 = this.params.unselected_topics.indexOf(topic);
        let lst1, lst2;
        if (i1) {
            let x = this.params.selected_topics.splice(i1, 1);
            this.params.unselected_topics.push(x);
            this.params.unselected_topics.sort(this.compare)
        } else {
            let x = this.params.unselected_topics.splice(i2, 1);
            this.params.selected_topics.push(x);
            this.params.selected_topics.sort(this.compare)
        }

        this.params.action();
    }

    activate(model) {
        this.params=model.params;
    }
 
}