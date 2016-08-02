var path = require('path');

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
}
