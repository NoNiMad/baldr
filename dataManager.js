let async = require('async');
let fs = require('fs');
let mv = require('mv');
let hash = require('murmurhash-native').LE.murmurHash128x64;
let logger = require('winston').loggers.get('dataManager');

function logFileWritingResult(err, path) {
    if (err)
        return logger.error('Writing "' + path + '" failed', err);
    logger.debug('Successfully wrote "' + path + '"');
}

function logFileRemovingResult(err, path) {
    if (err)
        return logger.error('Removing "' + path + '" failed', err);
    logger.debug('Successfully removed "' + path + '"');
}

function logFileRenamingResult(err, origin, dest) {
    if (err)
        return logger.error('Renaming "' + origin + '" to "' + dest + '" failed', err);
    logger.debug('Successfully renamed "' + origin + '" to "' + dest + '"');
}

module.exports = {
    dataDir: 'data/',
    descriptorsList: [],
    contentDescriptors: {},
    contents: {},
    patterns: {},
    loadFromDisk: function() {
        this.descriptorsList = JSON.parse(fs.readFileSync('data/index.json')).contentDescriptors;
        for(descriptorName of this.descriptorsList) {
            let dirPath = this.dataDir + descriptorName;
            this.contentDescriptors[descriptorName] = JSON.parse(fs.readFileSync(dirPath + '.json'));
            dirPath = this.dataDir + this.contentDescriptors[descriptorName].folderName;

            // Chargement des patterns
            this.patterns[descriptorName] = {};
            try {
                fs.accessSync(dirPath + '/pattern/groupcore.json');
                this.patterns[descriptorName]['groupCore'] = JSON.parse(fs.readFileSync(dirPath + '/pattern/groupcore.json'));
            } catch(err) {
                logger.warn(descriptorName + ' has no groupcore.json associated file.');
            }

            try {
                fs.accessSync(dirPath + '/pattern/groupcontent.json');
                this.patterns[descriptorName]['groupContent'] = JSON.parse(fs.readFileSync(dirPath + '/pattern/groupcontent.json'));
            } catch(err) {
                logger.warn(descriptorName + ' has no groupcontent.json associated file.');
            }

            // Chargement des contenus
            this.contents[descriptorName] = {};
            for(content of Object.keys(this.contentDescriptors[descriptorName].contentFiles)) {
                this.contents[descriptorName][content] = JSON.parse(fs.readFileSync(dirPath + '/content/' + content + '.json'));
            }
        }

        logger.info('Data Loading Complete');
    },
    checkHashes: function() {
        if(this.contentDescriptors.length === 0) {
            logger.info('No hash to verify. Is the content unavailable or is it just a fresh install ?');
            return;
        }

        for(descriptorName of this.descriptorsList) {
            let desc = this.contentDescriptors[descriptorName];
            for(content of Object.keys(desc.contentFiles)) {
                if(desc.contentFiles[content] !== this.hashFile(descriptorName + '/content/' + content + '.json')) {
                    logger.error('Hash verification failed for content : ' + content);
                }
            }
            for(resource of Object.keys(desc.resourceFiles)) {
                if(desc.resourceFiles[resource] !== this.hashFile(descriptorName + '/resources/' + resource)) {
                    logger.error('Hash verification failed for resource : ' + resource);
                }
            }
        }

        logger.info('Hashes Checks Complete');
    },
    saveContent: function(descriptor, content, data) {
        data.name = data.name.trim();
        if(data.name === '')
            return logger.warn('Trying to add/modify content with an empty name. Aborting');

        if(content === null) { // It's a new element
            content = data.name;
            if(this.patterns[descriptor].groupContent)
                data.descriptors = [];
            this.contents[descriptor][content] = data;

            logger.info(descriptor + ': Created new content "' + content + '"');
        } else if(content !== data.name) { // It's an existing element, but the name was changed
            // If an element already exists with the new name, don't override it
            if(this.contents[descriptor][data.name])
                return logger.warn('Trying to rename an existing content ("' + content + '"), but the new name ("' + data.name + '") is already used. Aborting');

            this.contents[descriptor][data.name] = JSON.parse(JSON.stringify(this.contents[descriptor][content]));
            delete this.contents[descriptor][content];
            delete this.contentDescriptors[descriptor].contentFiles[content];
            fs.unlinkSync(this.dataDir + descriptor + '/content/' + content + '.json');

            let oldName = content;
            content = data.name;
            for(key of Object.keys(data))
                this.contents[descriptor][content][key] = data[key];

            logger.info(descriptor + ': Renamed "' + oldName + '" to "' + data.name + '"');
        } else { // It's an existing element
            for(key of Object.keys(data))
                this.contents[descriptor][content][key] = data[key];

            logger.info(descriptor + ': Edited "' + content + '"');
        }

        let toWrite = JSON.stringify(this.contents[descriptor][content], null, '  ');
        this.contentDescriptors[descriptor].contentFiles[content] = hash(toWrite);

        let contPath = this.dataDir + descriptor + '/content/' + content + '.json';
        fs.writeFile(contPath, toWrite, (err) => {
            logFileWritingResult(err, contPath);
            if(!err) {
                this.writeDescriptorFile(descriptor);
            }
        });

        return content;
    },
    saveSubContent: function(descriptor, content, id, data) {
        data.name = data.name.trim();
        if(data.name === '')
            return logger.warn('Trying to add/modify subcontent with an empty name. Aborting');

        let contentObj = this.contents[descriptor][content];
        if(id === null) { // It's a new element
            id = contentObj.descriptors.length;
            contentObj.descriptors.push(data);

            logger.info(descriptor + ': ' + content + ': Created new subcontent "' + data.name + '"');
        } else {
            if(contentObj.descriptors[id].name !== data.name) {
                for(let i in contentObj.descriptors) {
                    if(contentObj.descriptors[i].name === data.name)
                        return logger.warn('Trying to rename an existing subcontent ("' + content + '"), but the new name ("' + data.name + '") is already used. Aborting');
                }
            }
            contentObj.descriptors[id] = data;

            logger.info(descriptor + ': ' + content + ': Modified subcontent "' + data.name + '"');
        }

        let toWrite = JSON.stringify(contentObj, null, '  ');
        this.contentDescriptors[descriptor].contentFiles[content] = hash(toWrite);

        let contPath = this.dataDir + descriptor + '/content/' + content + '.json';
        fs.writeFile(contPath, toWrite, (err) => {
            logFileWritingResult(err, contPath);
            if(!err) {
                this.writeDescriptorFile(descriptor);
            }
        });

        return id;
    },
    deleteContent: function(descriptor, content) {
        delete this.contents[descriptor][content];
        delete this.contentDescriptors[descriptor].contentFiles[content];

        logger.info(descriptor + ': Removed content "' + content + '"');

        let contPath = this.dataDir + descriptor + '/content/' + content + '.json';
        fs.unlink(contPath, (err) => {
            logFileRemovingResult(err, contPath);
            if(!err) {
                this.writeDescriptorFile(descriptor);
            }
        });
    },
    deleteSubContent: function(descriptor, content, id) {
        let contentObj = this.contents[descriptor][content];
        let subcontent = contentObj.descriptors[id].name;
        contentObj.descriptors.splice(id, 1);

        logger.info(descriptor + ': ' + content + ': Removed subcontent "' + subcontent + '"');

        let toWrite = JSON.stringify(contentObj, null, '  ');
        this.contentDescriptors[descriptor].contentFiles[content] = hash(toWrite);

        let contPath = this.dataDir + descriptor + '/content/' + content + '.json';
        fs.writeFile(contPath, toWrite, (err) => {
            logFileWritingResult(err, contPath);
            if(!err) {
                this.writeDescriptorFile(descriptor);
            }
        });
    },
    newResource: function(descriptor, tempname, filename) {
            let destPath = this.dataDir + descriptor + '/resources/' + filename;
            mv('temp/' + tempname, destPath, {clobber: false}, (err) => {
                logFileRenamingResult(err, 'temp/' + tempname, destPath);
                if(!err) {
                    this.contentDescriptors[descriptor].resourceFiles[filename] = hash(fs.readFileSync(destPath));
                    this.writeDescriptorFile(descriptor);

                    logger.info(descriptor + ': New resource "' + filename + '"');
                }
            });
    },
    renameResource: function(descriptor, oldName, newName) {
        this.contentDescriptors[descriptor].resourceFiles[newName] = this.contentDescriptors[descriptor].resourceFiles[oldName];
        delete this.contentDescriptors[descriptor].resourceFiles[oldName];

        let origPath = this.dataDir + descriptor + '/resources/' + oldName;
        let destPath = this.dataDir + descriptor + '/resources/' + newName;
        mv(origPath, destPath, {clobber: false}, (err) => {
            logFileRenamingResult(err, origPath, destPath);
            if(!err) {
                this.writeDescriptorFile(descriptor);

                logger.info(descriptor + ': Renamed resource from "' + oldName + '" + to "' + newName + '"');
            }
        });
    },
    deleteResource: function(descriptor, resource) {
        delete this.contentDescriptors[descriptor].resourceFiles[resource];

        let resPath = this.dataDir + descriptor + '/resources/' + resource;
        fs.unlink(resPath, (err) => {
            logFileRemovingResult(err, resPath);
            if(!err) {
                this.writeDescriptorFile(descriptor);

                logger.info(descriptor + ': Deleted resource "' + resource + '"');
            }
        });
    },
    hashFile: function(path) {
        return hash(fs.readFileSync(this.dataDir + path));
    },
    writeDescriptorFile(descriptor) {
        let descPath = this.dataDir + descriptor + '.json';
        fs.writeFile(descPath, JSON.stringify(this.contentDescriptors[descriptor], null, '  '), (err) => {
            logFileWritingResult(err, descPath);
        });
    }
}
