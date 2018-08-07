/*<script>
https://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = ctx.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  var canvas = document.getElementById('Canvas01');
  var ctx = canvas.getContext('2d');
  var maxWidth = 400;
  var lineHeight = 24;
  var x = (canvas.width - maxWidth) / 2;
  var y = 70;
  var text = 'HTML is the language for describing the structure of Web pages. HTML stands for HyperText Markup Language. Web pages consist of markup tags and plain text. HTML is written in the form of HTML elements consisting of tags enclosed in angle brackets (like <html>). HTML tags most commonly come in pairs like <h1> and </h1>, although some tags represent empty elements and so are unpaired, for example <img>..';

  ctx.font = '15pt Calibri';
  ctx.fillStyle = '#555555';

  wrapText(ctx, text, x, y, maxWidth, lineHeight);
  </script>
</body>*/
