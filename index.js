var express = require('express');
var mongodb = require('mongodb');

var uri = 'mongodb://heroku_znccv14k:7irm1mm7juet58bcclc9obnku2@ds151431.mlab.com:51431/heroku_znccv14k';

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
  mongodb.MongoClient.connect(uri, function(err, db) {
    if (err) {return console.dir(err);}

    var questions = db.collection('questions');
    questions.findOne({}, function(err, doc) {
      response.send('{"text": "The data you wanted"}');
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


