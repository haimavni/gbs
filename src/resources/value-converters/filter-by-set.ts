export class FilterBySetValueConverter {
    toView(array, value, exc_inc='include', property='name') {
        const bool = (exc_inc != 'exclude');
        if (!array) {
            return [];
        }
        if (! value ) {
            return array;
        }
        const arr = array.filter(option => value.has(option[property]) == bool);
        return arr;
    }
}
