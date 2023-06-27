export class FormatdateValueConverter {
  toView(date_time, show_time) {
      let date, time, d, m, y: string;
      [date, time] = date_time.split(' ');
      [y, m, d] = date.split('-');
      let s = d + '.' + m + '.' + y;
      if (show_time) {
          s += ' ' + time;
      }
    return s;
  }
}
