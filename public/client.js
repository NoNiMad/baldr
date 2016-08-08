var socket = io();
//localStorage.debug = '*';

// Click sur un descriptor

$('#descriptorsList').on('click', 'li', function(e) {
    if($(this).hasClass('active')) return;

    $('#descriptorsList li.active').removeClass('active');
    $(this).addClass('active');
    dataManager.active.setDescriptor($(this).attr('data-name'));

    socket.emit('descriptor get content', dataManager.active.descriptor);
    socket.emit('descriptor get form', dataManager.active.descriptor);
});

socket.on('descriptor get content', function(data) {
    var contentList = $('#descriptorContent');
    contentList.empty();

    createNewContentButton();

    for(i in data.content) {
        var li = $('<li>');
        li.html(data.content[i]);
        li.attr('data-name', data.content[i]);
        contentList.append(li);
    }

    var resourcesList = $('#descriptorResources');
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

// RESTE : ARRAY

socket.on('descriptor get form', function(data) {
    dataManager.active.pattern = data;
    cleanUpEditingArea('Creating a new ' + dataManager.active.descriptor);
    var editDiv = $('#contentEdition');

    if(data.groupCore) {
        var coreForm = $('<form>');
        coreForm.attr('id', 'coreForm');
        generateForm(data.groupCore.properties, coreForm);
        editDiv.append(coreForm);

        var saveBtn = $('<button>');
        saveBtn.html('Save');
        saveBtn.on('click', function(e) {
            // Saving stuff u know
            let data = { descriptor: dataManager.active.descriptor, content: dataManager.active.content, data: {} };
            $('#coreForm [name]').each(function(k, v) {
                let val = $(this).val();
                if($(this).prop('tagName') === "INPUT" && $(this).attr('type') === "checkbox")
                    val = $(this).prop('checked');
                data.data[$(this).attr('name')] = val;
            });
            socket.emit('content set data', data);

            return false;
        });
        var delBtn = $('<button>');
        delBtn.html('Delete');
        delBtn.on('click', function(e) {
            if(dataManager.active.content === null) return false;
            // Deleting stuff u know
            let data = { descriptor: dataManager.active.descriptor, content: dataManager.active.content };
            socket.emit('delete content', data);
            onNewContentButtonClick();
            return false;
        });
        $('#coreForm').append(saveBtn).append(delBtn);

        fillDefault(dataManager.active.pattern.groupCore, '#coreForm');
    }
    if(data.groupContent) {
        var contentForm = $('<form>');
        contentForm.attr('id', 'contentForm');
        generateForm(data.groupContent.properties, contentForm);
        editDiv.append(contentForm);

        var saveBtn = $('<button>');
        saveBtn.html('Save');
        saveBtn.on('click', function(e) {
            // Saving stuff u know
            let data = { descriptor: dataManager.active.descriptor, content: dataManager.active.content, id: dataManager.active.subcontent, data: {} };
            $('#contentForm [name]').each(function(k, v) {
                let val = $(this).val();
                if($(this).prop('tagName') === "INPUT" && $(this).attr('type') === "checkbox")
                    val = $(this).prop('checked');
                data.data[$(this).attr('name')] = val;
            });
            socket.emit('content set subcontent', data);

            return false;
        });
        var delBtn = $('<button>');
        delBtn.html('Delete');
        delBtn.on('click', function(e) {
            if(dataManager.active.subcontent === null) return false;
            // Deleting stuff u know
            let data = { descriptor: dataManager.active.descriptor, content: dataManager.active.content, id: dataManager.active.subcontent };
            socket.emit('delete subcontent', data);
            dataManager.active.reset("subcontent");
            return false;
        });
        $('#contentForm').append(saveBtn).append(delBtn);
        fillDefault(dataManager.active.pattern.groupContent, '#contentForm');

        var descList = $('<div>');
        descList.attr('id', 'descList');
        descList.append($('<h3>Sub-Descriptors</h3>'));
        var ul = $('<ul>');
        descList.append(ul);
        editDiv.append(descList);
    }
});

// Clic sur un élément du descriptor

$('#descriptorContent').on('click', 'li:not(.button):not(.active)', function(e) {
    $('#descriptorContent li.active').removeClass('active');
    $(this).addClass('active');
    dataManager.active.setContent($(this).attr('data-name'));
    socket.emit('content get data', {
        descriptorName: dataManager.active.descriptor,
        contentName: dataManager.active.content
    });
});

socket.on('select content', function(content) {
    $('#descriptorContent li.active').removeClass('active');
    $('#descriptorContent li[data-name="' + content + '"]').addClass('active');
    dataManager.active.setContent(content);
    socket.emit('content get data', {
        descriptorName: dataManager.active.descriptor,
        contentName: dataManager.active.content
    });
});

socket.on('content get data', function(data) {
    $('#contentEdition > h3').html('Editing ' + data.name);

    dataManager.active.setContentData(data);
    fillForm(data, '#coreForm');
    emptyForm('#contentForm');

    if(data.descriptors) {
        var ul = $('#descList ul');
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

// Clic sur un sub-descriptor

function subcontentClick(e) {
    if($(this).hasClass('active')) return;

    $('#descList li.active').removeClass('active');
    $(this).addClass('active');
    let id = $(this).attr('data-id');
    dataManager.active.setSubcontent(id);
    fillForm(dataManager.active.data.descriptors[id], '#contentForm');
};

socket.on('select subcontent', function(id) {
    dataManager.active.setSubcontent(id);
});

// -- Utils functions -- //

function cleanUpEditingArea(newTitle) {
    var div = $('#contentEdition');
    div.empty();
    div.append($('<h3>' + newTitle + '</h3>'));
}

function createNewContentButton() {
    var newContent = $('<li>');
    newContent.addClass('button');
    var newContentBtn = $('<button>');
    newContentBtn.html('New Content');
    newContentBtn.on('click', onNewContentButtonClick);
    $('#descriptorContent').append(newContent.append(newContentBtn));
}

function onNewContentButtonClick() {
    dataManager.active.reset("content");

    if(dataManager.active.pattern.groupCore) {
        $('#contentEdition > h3').html('Creating a new ' + dataManager.active.descriptor);
        emptyForm('#coreForm');
    } else {
        $('#contentEdition > h3').html('No form to create a new ' + dataManager.active.descriptor);
    }

    if(dataManager.active.pattern.groupContent)
        emptyForm('#contentForm');

    $('#descList ul li').remove();
    $('#descriptorContent .active').removeClass('active');

    if(dataManager.active.pattern.groupCore)
        fillDefault(dataManager.active.pattern.groupCore, '#coreForm');
}

function createNewSubcontentButton() {
    var newContent = $('<li>');
    newContent.addClass('button');
    var newContentBtn = $('<button>');
    newContentBtn.html('New Sub-Content');
    newContentBtn.on('click', function(e) {
        dataManager.active.reset("subcontent");
        $('#descList .active').removeClass('active');
        fillDefault(dataManager.active.pattern.groupContent, '#contentForm');
    });
    $('#descList ul').append(newContent.append(newContentBtn));
}


