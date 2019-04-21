const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// body parser middleware
app.use(bodyParser.urlencoded({extended: true}));

// test route
app.get('/', function(req, res) {
    res.status(200).send('Ready to Inspire!');
});

// error handler
app.use(function(err, req, res) {
    console.error(err.stack);
    res.status(400).send(err.message);
});

app.listen(port, function() {
    console.log('InspiroBot listening on port ' + port);
});

app.post('/slash', require('./slash'));
