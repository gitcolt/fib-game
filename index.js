var express = require('express');

var mongodb = require('mongodb');
var uri = process.env.MONGODB_URI;

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.get('/', function(request, response) {
  response.render('pages/index.pug');
});

app.get('/question', function(request, response) {
  mongodb.MongoClient.connect(uri, function(err, db) {
    if (err) {return console.dir(err);}
    var questions = db.collection('questions');
    // Get a random record
    questions.aggregate({$sample: {size: 1}}, function(err, doc) {
      response.send(doc[0]);
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


