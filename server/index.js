const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

var path = require('path');

// Middleware

app.use(bodyParser.json());
app.use(cors());

const channel = require('./routes/api/channel');

app.use('/api/channel', channel);



if(process.env.NODE_ENV === 'production') {
  app.use(express.static(__dirname + "/../public/"));

  app.get(/.*/, (req, res) => res.sendFile(path.resolve(__dirname + '/../public/index.html')));
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log('Server started on port ' + port));
