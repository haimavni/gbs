
export class TakeValueConverter {
    toView(array, count, first_index = 0) {
        return array.slice(first_index, first_index + count);
    }
}
