var async = require('async');

module.exports = function(app, dataManager) {
    app.io.on('connection', function(socket) {
        //if(!socket.session.logged) return socket.disconnect();

        socket.on('descriptor get content', function(name) {
            socket.emit('descriptor get content', {
                content: Object.keys(dataManager.contentDescriptors[name].contentFiles).sort(),
                resources: Object.keys(dataManager.contentDescriptors[name].resourceFiles).sort()
            });
        });

        socket.on('descriptor get form', function(name) {
            socket.emit('descriptor get form', dataManager.patterns[name]);
        });

        socket.on('content get data', function(names) {
            socket.emit('content get data', dataManager.contents[names.descriptorName][names.contentName]);
        });

        socket.on('content set data', function(data) {
            dataManager.saveContent(data.descriptor, data.);
        });

        socket.on('disconnect', function() {  });
    });
}
