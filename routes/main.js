let path = require('path');
let fs = require('fs');
let multer  = require('multer');
let upload = multer({ dest: 'temp' }).array('file');
let logger = require('winston').loggers.get('global');
let dataManager = require('../dataManager');

module.exports = function(app) {
    app.get('/', function(req, res, next) {
        /*
        if(!req.session.logged) {
            res.redirect('/login');
            return;
        }
        */

        res.render('app', { descriptorsList: dataManager.descriptorsList });
    });

    app.get('/res/:descriptor/:res', function(req, res, next) {
        res.sendFile(path.join(__dirname, '../data/' + req.params.descriptor + '/resources/' + req.params.res));
    });

    app.post('/upload/resource', upload, function (req, res, next) {
        for(let i in req.files) {
            dataManager.newResource(req.body.descriptor, req.files[i].filename, req.files[i].originalname);
        }

        res.send('ok');
    });
}
