let path = require('path');
let fs = require('fs');
let hash = require('murmurhash-native').LE.murmurHash128x64;
let multer  = require('multer');
let upload = multer({ dest: 'temp' }).single('file');

module.exports = function(app, dataManager) {
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
        let destPath = path.join(__dirname, '../data/' + req.body.descriptor + '/resources/' + req.file.originalname);
        fs.renameSync(path.join(__dirname, '../temp/' + req.file.filename), destPath);

        dataManager.contentDescriptors[req.body.descriptor].resourceFiles[req.file.originalname] = hash(fs.readFileSync(destPath));
        fs.writeFileSync(path.join(__dirname, '../data/' + req.body.descriptor + '.json'), JSON.stringify(dataManager.contentDescriptors[req.body.descriptor], null, '  '));

        res.send('ok');
    });
}
