require('dotenv').config();
let bodyParser = require('body-parser');
let express = require('express');
let app = express();

app.use(function(req, res, next) {
    console.log(req.method + " " + req.path + " - " + req.ip);
    next();
}, bodyParser.urlencoded({extended: false}))
app.get('/:word/echo', (req, res) => res.json({'echo': req.params.word}))
app.get("/", (req, res) => res.sendFile(__dirname + '/views/index.html'))
app.use('/public', express.static(__dirname + '/public'))
app.get('/json', (req, res) => res.json(process.env.MESSAGE_STYLE === 'uppercase'?{"message": "HELLO JSON"}:{"message": "Hello json"}))
app.get('/now', function (req, res, next) {
    req.time = new Date().toString();
    next();
}, (req, res) => res.json({ 'time': req.time }))
app.route('/name').get((req, res) => res.json({ 'name': req.query.first + " " + req.query.last })).post(function(req, res) {
    res.json({ 'name': req.body.first + " " + req.body.last });
})

module.exports = app;