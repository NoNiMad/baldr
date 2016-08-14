var socket = io();
//localStorage.debug = '*';

socket.on('descriptor get content', function(data) {
    // Gestion des contenus

    var contentList = $('#contentList');

    contentList.empty();
    createNewContentButton();

    for(i in data.content) {
        var li = $('<li>');
        li.html(data.content[i]);
        li.attr('data-name', data.content[i]);
        contentList.append(li);
    }

    // Gestion des ressources

    var resourcesList = $('#resourceList');
    resourcesList.empty();
    createNewResourceButton();
    var datalistImg = $('#resourcesImg');
    datalistImg.empty();
    var datalistModel = $('#resourcesModel');
    datalistModel.empty();

    for(i in data.resources) {
        var res = data.resources[i];
        var li = $('<li>');

        if(res.endsWith('png')) {
            var img = $('<img/>');
            img.attr('src', '/res/' + dataManager.active.descriptor + '/' + res);
            li.append(img);
        }
        li.append($('<span>').html(res));
        let btnDelete = $('<button>').html("Delete");
        btnDelete.on('click', onResourceDeleteButtonClick);
        li.append(btnDelete);
        li.attr('data-name', res);
        resourcesList.append(li);

        var option = $('<option>');
        var ext = res.substr(res.lastIndexOf('.') + 1);
        option.attr('value', res.substr(0, res.lastIndexOf('.')));
        switch (ext) {
            case "png":
                datalistImg.append(option);
                break;
            case "obj":
                datalistModel.append(option);
                break;
        }
    }
});

socket.on('descriptor get form', function(data) {
    dataManager.active.setPattern(data);
    cleanUpEditingArea('Creating a new ' + dataManager.active.descriptor);
    var editDiv = $('#contentEdition');

    if(data.groupCore) {
        editDiv.append(createForm({
            id: 'coreForm',
            name: 'Content',
            properties: data.groupCore.properties,
            onSaveClick: onContentSaveButtonClick,
            onDeleteClick: onContentDeleteButtonClick
        }));
        fillDefault(data.groupCore, '#coreForm');
    }

    if(data.groupContent) {
        editDiv.append(createForm({
            id: 'subcontentList',
            name: 'Subcontent List',
            properties: [
                {
                  "propertyName": "Select one :",
                  "propertyType": "ENUM",
                  "additionnalData": [""],
                  "defaultValue": ""
                }
              ]
        }));
        createNewSubcontentButton();

        editDiv.append(createForm({
            id: 'contentForm',
            name: 'Subcontent',
            properties: data.groupContent.properties,
            onSaveClick: onSubcontentSaveButtonClick,
            onDeleteClick: onSubcontentDeleteButtonClick
        }));
    }
});

socket.on('content get data', function(data) {
    $('#contentEdition > h3').html('Editing ' + data.name);

    dataManager.active.setContentData(data);
    fillForm(data, '#coreForm');
    emptyForm('#contentForm');

    if(data.descriptors) {
        var select = $('#subcontentList select');
        select.empty();
        select.append($('<option>'));

        for(let i in data.descriptors) {
            let desc = data.descriptors[i];
            let option = $('<option>');
            option.html(desc.name);
            option.val(i);
            select.append(option);

            if(dataManager.active.subcontent === i) {
                select.val(i);
                fillForm(dataManager.active.data.descriptors[i], '#contentForm');
            }
        }
    }
});

socket.on('select content', function(content) {
    $('#contentList li.active').removeClass('active');
    $('#contentList li[data-name="' + content + '"]').addClass('active');
    dataManager.active.setContent(content);
    socket.emit('content get data', {
        descriptorName: dataManager.active.descriptor,
        contentName: dataManager.active.content
    });
});

socket.on('select subcontent', function(id) {
    dataManager.active.setSubcontent(id);
});