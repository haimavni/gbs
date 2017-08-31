export class FilterGenderValueConverter {
  toView(array, gender) {
    return array.filter(member => member.gender == gender);
  }
}