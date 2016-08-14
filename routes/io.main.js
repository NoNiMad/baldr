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
            let content = dataManager.saveContent(data.descriptor, data.content, data.data);
            socket.emit('descriptor get content', {
                content: Object.keys(dataManager.contentDescriptors[data.descriptor].contentFiles).sort(),
                resources: Object.keys(dataManager.contentDescriptors[data.descriptor].resourceFiles).sort()
            });
            socket.emit('select content', content);
        });

        socket.on('content set subcontent', function(data) {
            let id = dataManager.saveSubContent(data.descriptor, data.content, data.id, data.data);
            socket.emit('select content', data.content);
            socket.emit('select subcontent', id);
        });

        socket.on('delete content', function(data) {
            dataManager.deleteContent(data.descriptor, data.content);
            socket.emit('descriptor get content', {
                content: Object.keys(dataManager.contentDescriptors[data.descriptor].contentFiles).sort(),
                resources: Object.keys(dataManager.contentDescriptors[data.descriptor].resourceFiles).sort()
            });
        });

        socket.on('delete subcontent', function(data) {
            dataManager.deleteSubContent(data.descriptor, data.content, data.id);
            socket.emit('select content', data.content);
        });

        socket.on('delete resource', function(data) {
            dataManager.deleteResource(data.descriptor, data.resource);
            socket.emit('descriptor get content', {
                content: Object.keys(dataManager.contentDescriptors[data.descriptor].contentFiles).sort(),
                resources: Object.keys(dataManager.contentDescriptors[data.descriptor].resourceFiles).sort()
            });
        });

        socket.on('disconnect', function() {  });
    });
}
