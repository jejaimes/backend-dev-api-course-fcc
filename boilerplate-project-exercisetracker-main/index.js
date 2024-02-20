const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const cors = require('cors');

require('dotenv').config()
const parse = bodyParser.urlencoded({ extended: false });

let x = 0;

app.use(cors())
app.use(express.static('public'))
app.use(function (req, res, next) {
    x += 1;
    console.log(x + " - " + req.method + " - " + req.url);
    next();
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// There is no need for a log schema beacuse exercise has a reference to the user so you can make the log querying the exercise with the userid
const exerciseSchema = new mongoose.Schema({
    user: mongoose.Types.ObjectId,
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: String,
    realDate: Date
});

const userSchema = new mongoose.Schema({
  username: String
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

const createAndSaveUser = (username, done) => {//creates a new user using the username provided, the _id is added by default by mongodb
    let user = new User({
        username: username
    });
    user.save(function (err, data) {
        if (err) return console.error(err);
        done(null, data);
    });
};

const findUsers = (done) => {//basically select *, the projection can be removed but it's there because user used to have more attributes
    User.find({}, '_id username', function (err, data) {
        if (err) return console.error(err);
        done(null, data);
    });
};

const findUserById = (userId) => {//finds a user by its id returns a promise that's why i used await when calling the function
    return User.findById(userId).exec();
};

const findLogByUserId = (userId, from = null, to = null, limit = null) => {//you get the list of exercises (the log attribute basically) according to the filters provided, when using remember to call it with await
    let q = Exercise.find({ user: userId }, 'description duration date');
    if (from) q.where('realDate').gte(new Date(from));
    if (to) q.where('realDate').lte(new Date(to));
    if (limit) q.limit(parseInt(limit));
    return q.exec();
};

const createAndSaveExercise = async (userId, description, duration, date, done) => {//creates a new user depending on if there is a date provided or not it returns the exercise info + the user info
    let u = await findUserById(userId);
    console.log(date);
    if (u) {
        let exercise;
        if (date === null || date === '' || date === undefined) {
            let m = (new Date().toUTCString()).replace(',', '').split(' ');//new Date().toDateString(); have to do this because of the way the test are made because new Date('1990-01-01').toString() >> "Sun Dec 31 1989 19:00:00 GMT-0500 (Colombia Standard Time)"
            exercise = new Exercise({
                user: userId,
                description: description,
                duration: duration,
                date: m[0] + ' ' + m[2] + ' ' + m[1] + ' ' + m[3],//m,
                realDate: new Date()
            });
        } else {
            let m = (new Date(date).toUTCString()).replace(',', '').split(' ');//new Date(date).toDateString();
            exercise = new Exercise({
                user: userId,
                description: description,
                duration: duration,
                date: m[0] + ' ' + m[2] + ' ' + m[1] + ' ' + m[3],//m,
                realDate: new Date(date)
            });
        }
        exercise.save(function (err, data) {
            if (err) return console.error(err);
            let ex = { username: u['username'], description: data['description'], duration: data['duration'], _id: u['_id'], date: data['date'] };
            console.log(ex);
            done(null, ex);
        });
    };
};

app.route('/api/users').get((req, res, next) => findUsers(function (err, data) {
    if (err) return next(err);
    if (!data) {
        console.log("Missing `done()` argument");
        return next({ message: "Missing callback argument" });
    }
    res.json(data);
})).post(parse, (req, res, next) => {
    createAndSaveUser(req.body.username, function (err, data) {
        if (err) return next(err);
        if (!data) {
            console.log("Missing `done()` argument");
            return next({ message: "Missing callback argument" });
        }
        res.json({ _id: data['_id'], username: data['username'] });
    });
});

app.post('/api/users/:_id/exercises', parse, (req, res, next) => createAndSaveExercise(req.params._id, req.body.description, req.body.duration, req.body.date, function (err, data) {
    if (err) return next(err, data);
    if (!data) {
        console.log("Missing `done()` argument");
        return next(err, { message: "Missing callback argument" });
    }
    res.json(data);
    next(err, data);
}));

app.get('/api/users/:_id/logs', async (req, res, next) => {
    let u = await findUserById(req.params._id);
    if (u) {
        let log;
        if (!req.query) {
            log = await findLogByUserId(u['_id'], null, null, null);
        } else {
            log = await findLogByUserId(req.params._id, req.query.from, req.query.to, req.query.limit);
        }
        let logs = { _id: u['_id'], username: u['username'], count: log.length, log: log };
        console.log(logs);
        res.json(logs);
    }
    else {
        console.log('There is no user with id: ' + req.params._id);
        res.status(404).json('Invalid user id');
    }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});