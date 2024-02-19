require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const list = [];

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.route('/api/shorturl').post(bodyParser.urlencoded({ extended: false }), function (req, res) {
  try {
    const url = new URL(req.body.url);
    console.log(url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Incorrect protocol');
    list[list.length] = url;
    res.json({ original_url: url, short_url: list.length - 1 });
  } catch (err) {
    console.log(err)
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:id', function (req, res) {
  if (!isNaN(req.params.id) && 0 <= parseInt(req.params.id) && parseInt(req.params.id) < list.length) {
    res.redirect(list[req.params.id]);
  } else {
    res.json({ error: 'invalid url' });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
