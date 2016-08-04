let async = require('async');
let fs = require('fs');
let hash = require('murmurhash-native').LE.murmurHash128x64;

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
                console.log(descriptorName + ' has no groupcore.json associated file.');
            }

            try {
                fs.accessSync(dirPath + '/pattern/groupcontent.json');
                this.patterns[descriptorName]['groupContent'] = JSON.parse(fs.readFileSync(dirPath + '/pattern/groupcontent.json'));
            } catch(err) {
                console.log(descriptorName + ' has no groupcontent.json associated file.');
            }

            // Chargement des contenus
            this.contents[descriptorName] = {};
            for(content of Object.keys(this.contentDescriptors[descriptorName].contentFiles)) {
                this.contents[descriptorName][content] = JSON.parse(fs.readFileSync(dirPath + '/content/' + content + '.json'));
            }
        }

        console.log('Data Loading Complete');
    },
    checkHashes: function() {
        if(this.contentDescriptors.length === 0) {
            console.log("Nothing to check. Is the content unavailable or just fresh install ?");
            return;
        }

        for(descriptorName of this.descriptorsList) {
            let desc = this.contentDescriptors[descriptorName];
            for(content of Object.keys(desc.contentFiles)) {
                console.assert(desc.contentFiles[content] === this.hashFile(descriptorName + '/content/' + content + '.json'),
                    "Error in comparison between hashes for content : " + content,
                    this.hashFile(descriptorName + '/content/' + content + '.json'));
            }
            for(resource of Object.keys(desc.resourceFiles)) {
                console.assert(desc.resourceFiles[resource] === this.hashFile(descriptorName + '/resources/' + resource),
                    "Error in comparison between hashes for resource : " + resource);
            }
        }

        console.log('Hashes Checks Complete');
    },
    hashFile: function(path) {
        return hash(fs.readFileSync(this.dataDir + path));
    },
    saveContent: function(descriptor, content, data) {
        if(content === null) { // It's a new element
            content = data.name;
            if(this.patterns[descriptor].groupContent)
                data.descriptors = [];
            this.contents[descriptor][content] = data;
        } else if(content !== data.name) { // It's an existing element, but the name was changed
            this.contents[descriptor][data.name] = JSON.parse(JSON.stringify(this.contents[descriptor][content]));
            delete this.contents[descriptor][content];
            delete this.contentDescriptors[descriptor].contentFiles[content];
            fs.unlinkSync(this.dataDir + descriptor + '/content/' + content + '.json');
            content = data.name;

            for(key of Object.keys(data)) {
                this.contents[descriptor][content][key] = data[key];
            }
        } else { // It's an existing element
            for(key of Object.keys(data)) {
                this.contents[descriptor][content][key] = data[key];
            }
        }

        let toWrite = JSON.stringify(this.contents[descriptor][content], null, '  ');
        fs.writeFileSync(this.dataDir + descriptor + '/content/' + content + '.json', toWrite);

        this.contentDescriptors[descriptor].contentFiles[content] = hash(toWrite);
        fs.writeFileSync(this.dataDir + descriptor + '.json', JSON.stringify(this.contentDescriptors[descriptor], null, '  '));

        return content;
    },
    saveSubContent: function(descriptor, content, id, data) {
        let contentObj = this.contents[descriptor][content];
        if(id === null) { // It's a new element
            id = contentObj.descriptors.length;
            contentObj.descriptors.push(data);
        } else {
            contentObj.descriptors[id] = data;
        }

        let toWrite = JSON.stringify(contentObj, null, '  ');
        fs.writeFileSync(this.dataDir + descriptor + '/content/' + content + '.json', toWrite);

        this.contentDescriptors[descriptor].contentFiles[content] = hash(toWrite);
        fs.writeFileSync(this.dataDir + descriptor + '.json', JSON.stringify(this.contentDescriptors[descriptor], null, '  '));

        return id;
    },
    deleteContent: function(descriptor, content) {
        delete this.contents[descriptor][content];
        delete this.contentDescriptors[descriptor].contentFiles[content];
        fs.unlinkSync(this.dataDir + descriptor + '/content/' + content + '.json');
        fs.writeFileSync(this.dataDir + descriptor + '.json', JSON.stringify(this.contentDescriptors[descriptor], null, '  '));
    },
    deleteSubContent: function(descriptor, content, id) {
        let contentObj = this.contents[descriptor][content];
        contentObj.descriptors.splice(id, 1);

        let toWrite = JSON.stringify(contentObj, null, '  ');
        fs.writeFileSync(this.dataDir + descriptor + '/content/' + content + '.json', toWrite);

        this.contentDescriptors[descriptor].contentFiles[content] = hash(toWrite);
        fs.writeFileSync(this.dataDir + descriptor + '.json', JSON.stringify(this.contentDescriptors[descriptor], null, '  '));
    }
}
