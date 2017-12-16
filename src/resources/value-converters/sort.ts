export class SortValueConverter {
  toView(array, property, direction='asc') {
    if (!array || !property)
      return array;
    let pname = property;
    let factor = direction.match(/^desc*/i) ? 1 : -1;
    var retvalue = array.sort((a, b) => {
      var textA = a.toUpperCase ? a[property].toUpperCase() : a[property];
      var textB = b.toUpperCase ? b[property].toUpperCase() : b[property];
      return (textA < textB) ? factor : (textA > textB) ? -factor : 0;
    });
    return retvalue;
  }
}