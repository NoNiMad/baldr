let path = require('path');
let session = require('express-session');
let FileStore = require('session-file-store')(session);
let bodyParser = require('body-parser');

let options = {
    store: new FileStore,
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
};
let app = require("sockpress").init(options);

app.set('trust proxy', true);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(app.express.static(path.join(__dirname, 'public')));

require('./routes/main')(app);
require('./routes/io.main')(app);

module.exports = app;
