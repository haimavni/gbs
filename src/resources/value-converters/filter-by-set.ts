export class FilterBySetValueConverter {
    toView(array, value, exc_inc='include', property='name') {
        let bool = (exc_inc != 'exclude');
        if (!array) {
            return [];
        }
        if (! value ) {
            return array;
        }
        let arr = array.filter(option => value.has(option[property]) == bool);
        return arr;
    }
}
