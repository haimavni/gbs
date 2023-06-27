import { sort_array } from '../../services/sort_array';
export class SortValueConverter {
    toView(array, properties) {
        if (!array || !properties)
            return array;
        return sort_array(array, properties);
    }
}