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
            var span = $('<span>');
            span.html(res);
            li.append(img);
            li.append(span);
        } else {
            li.html(res);
        }
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
            properties: data.groupCore.properties,
            onSaveClick: onContentSaveButtonClick,
            onDeleteClick: onContentDeleteButtonClick
        }));
        fillDefault(data.groupCore, '#coreForm');
    }

    if(data.groupContent) {
        editDiv.append(createForm({
            id: 'contentForm',
            properties: data.groupContent.properties,
            onSaveClick: onSubcontentSaveButtonClick,
            onDeleteClick: onSubcontentDeleteButtonClick
        }));

        var subcontentList = $('<div>');
        subcontentList.attr('id', 'subcontentList');
        subcontentList.append($('<h3>Sub-Descriptors</h3>'));

        var ul = $('<ul>');
        subcontentList.append(ul);
        editDiv.append(subcontentList);
    }
});

socket.on('content get data', function(data) {
    $('#contentEdition > h3').html('Editing ' + data.name);

    dataManager.active.setContentData(data);
    fillForm(data, '#coreForm');
    emptyForm('#contentForm');

    if(data.descriptors) {
        var ul = $('#subcontentList ul');
        ul.empty();

        createNewSubcontentButton();

        for(i in data.descriptors) {
            var desc = data.descriptors[i];
            var li = $('<li>');
            li.html(desc.name);
            li.attr('data-id', i);
            if(i === dataManager.active.subcontent) {
                li.addClass('active');
                fillForm(dataManager.active.data.descriptors[i], '#contentForm');
            }
            li.on('click', subcontentClick);
            ul.append(li);
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