export class FilterBySetValueConverter {
    toView(array, value, exc_inc) {
        let bool = (exc_inc == 'include');
        if (!array) {
            return [];
        }
        if (! value) {
            return array;
        }
        let arr = array.filter(option => value.has(option.name) == bool);
        return arr;
    }
}
