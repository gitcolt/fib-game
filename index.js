var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.get('/', function(request, response) {
  response.render('pages/asdf');
});

app.get('/qwerty', function(request, response) {
  response.send('{"text": "The data you wanted"}');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


