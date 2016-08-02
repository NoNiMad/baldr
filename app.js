var path = require('path');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var options = {
    store: new FileStore,
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
};

var bodyParser = require('body-parser');
var multer  = require('multer');
var upload = multer({ dest: 'temp' }).single('file');

var app = require("sockpress").init(options);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(app.express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    if(req.session.flashmsg) {
        var sessflash = req.session.flashmsg;
        res.locals.flashmsg = { msg: sessflash.msg, type: sessflash.type };
        if(req.method == "GET") delete req.session.flashmsg;
    }

    req.setFlash = function(msg, type) { req.session.flashmsg = { msg: msg, type: type }; }
    req.setSuccess = function(msg) { req.session.flashmsg = { msg: msg, type: "success" }; }
    req.setInfo = function(msg) { req.session.flashmsg = { msg: msg, type: "info" }; }
    req.setWarning = function(msg) { req.session.flashmsg = { msg: msg, type: "warning" }; }
    req.setError = function(msg) { req.session.flashmsg = { msg: msg, type: "error" }; }

    next();
});

var dataManager = require('./dataManager');
dataManager.loadFromDisk();
dataManager.checkHashes();

require('./routes/main')(app, dataManager);
require('./routes/io.main')(app, dataManager);

var server = app.listen(process.env.PORT || 3000);

module.exports = app;
