let winston = require('winston');
let app = require('./app');
let dataManager = require('./dataManager');

function getFileTransport(name, filename, level) {
    return new (winston.transports.File)({
        name: name,
        filename: filename,
        level: level
    });
}

function getConsoleTransport() {
    return new (winston.transports.Console)({
        level: 'info',
        colorize: true,
        timestamp: true
    });
}

let logger = winston.loggers.add('global');
logger.configure({
    transports: [
        getConsoleTransport(),
        getFileTransport('file-global-info', 'logs/global_infos.log', 'info'),
        getFileTransport('file-global-error', 'logs/global_errors.log', 'error')
    ]
});

let logger_dataManager = winston.loggers.add('dataManager');
logger_dataManager.configure({
    transports: [
        getConsoleTransport(),
        getFileTransport('file-dm-info', 'logs/data_infos.log', 'info'),
        getFileTransport('file-dm-error', 'logs/data_errors.log', 'error')
    ]
});

dataManager.loadFromDisk();
dataManager.checkHashes();

let server = app.listen(process.env.PORT || 3000, function() {
    logger.info('Sockpress server started, listening on port 3000');
});