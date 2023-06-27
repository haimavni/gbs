export class FiltervisibilityValueConverter {
  toView(array, min_visibility) {
    return array.filter(member => member.visibility > min_visibility);
  }
}