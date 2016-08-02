var socket = io();
//localStorage.debug = '*';

var activeDescriptor = null;
var activeDescriptorPattern = null;
var activeContent = null;
var activeContentData = null;
var activeSubContent = null;

// Click sur un descriptor

$('#descriptorsList').on('click', 'li', function(e) {
    if($(this).hasClass('active')) return;

    $('#descriptorsList li.active').removeClass('active');
    $(this).addClass('active');
    activeDescriptor = $(this).attr('data-name');

    socket.emit('descriptor get content', activeDescriptor);
    socket.emit('descriptor get form', activeDescriptor);
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
            img.attr('src', '/res/' + activeDescriptor + '/' + res);
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

var formTranslationTable = {
    "STRING": 'string',
    "BOOLEAN": 'checkbox',
    "DECIMAL": 'number',
    "NUMBER": 'number',
    "IMAGE": 'string',
    "MODEL": 'string'
}

// RESTE : ARRAY

socket.on('descriptor get form', function(data) {
    activeDescriptorPattern = data;
    cleanUpEditingArea('Creating a new ' + activeDescriptor);
    var editDiv = $('#contentEdition');

    if(data.groupCore) {
        var coreForm = $('<form>');
        coreForm.attr('id', 'coreForm');
        generateForm(data.groupCore.properties, coreForm);
        editDiv.append(coreForm);

        var saveBtn = $('<button>');
        saveBtn.html('Save');
        saveBtn.on('click', function(e) {
            if(activeContent === null) return false;
            // Saving stuff u know

            let data = { descriptor: activeDescriptor, content: activeContent, data: {} };
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
            if(activeSubContent === null) return false;
            // Deleting stuff u know
            return false;
        });
        $('#coreForm').append(saveBtn).append(delBtn);

        fillDefault(activeDescriptorPattern.groupCore, '#coreForm');
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
            return false;
        });
        var delBtn = $('<button>');
        delBtn.html('Delete');
        delBtn.on('click', function(e) {
            // Deleting stuff u know
            return false;
        });
        $('#contentForm').append(saveBtn).append(delBtn);
        fillDefault(activeDescriptorPattern.groupContent, '#contentForm');

        var descList = $('<div>');
        descList.attr('id', 'descList');
        descList.append($('<h3>Sub-Descriptors</h3>'));
        var ul = $('<ul>');
        descList.append(ul);
        editDiv.append(descList);

        createNewSubContentButton();
    }
});

// Clic sur un élément du descriptor

$('#descriptorContent').on('click', 'li:not(.button):not(.active)', function(e) {
    $('#descriptorContent li.active').removeClass('active');
    $(this).addClass('active');
    activeContent = $(this).attr('data-name');
    socket.emit('content get data', {
        descriptorName: activeDescriptor,
        contentName: activeContent
    });
});

socket.on('content get data', function(data) {
    $('#contentEdition > h3').html('Editing ' + data.name);

    activeContentData = data;
    fillForm(data, '#coreForm');
    emptyForm('#contentForm');

    if(data.descriptors) {
        var ul = $('#descList ul');
        ul.empty();

        createNewSubContentButton();

        for(i in data.descriptors) {
            var desc = data.descriptors[i];
            var li = $('<li>');
            li.html(desc.name);
            li.attr('data-id', i);
            li.on('click', subContentClick);
            ul.append(li);
        }
    }
});

// Clic sur un sub-descriptor

function subContentClick(e) {
    if($(this).hasClass('active')) return;

    $('#descList li.active').removeClass('active');
    $(this).addClass('active');
    var subid = $(this).attr('data-id');
    var activeSubContent = subid;
    fillForm(activeContentData.descriptors[subid], '#contentForm');
};

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
    newContentBtn.on('click', function(e) {
        $('#contentEdition > h3').html('Creating a new ' + activeDescriptor);
        emptyForm('#coreForm');
        emptyForm('#contentForm');
        $('#descList ul li').slice(1).remove();
        $('#descriptorContent .active').removeClass('active');
        fillDefault(activeDescriptorPattern.groupCore, '#coreForm');
    });
    $('#descriptorContent').append(newContent.append(newContentBtn));
}

function createNewSubContentButton() {
    var newContent = $('<li>');
    newContent.addClass('button');
    var newContentBtn = $('<button>');
    newContentBtn.html('New Sub-Content');
    newContentBtn.on('click', function(e) {
        $('#descList .active').removeClass('active');
        fillDefault(activeDescriptorPattern.groupContent, '#contentForm');
    });
    $('#descList ul').append(newContent.append(newContentBtn));
}

// -- Form Generation Utils -- //

function fillForm(data, form) {
    for(prop of Object.keys(data)) {
        var input = $(form + ' [name=' + prop + ']');
        switch(input.prop('tagName')) {
            case "SELECT":
                input.val(data[prop]);
                break;
            case "INPUT":
                switch (input.attr('type')) {
                    case "string":
                    case "number":
                        input.val(data[prop]);
                        break;
                    case "checkbox":
                        input.prop('checked', data[prop]);
                        break;
                }
                break;
        }
    }
}

function fillDefault(data, form) {
    data = data.properties;
    for(prop of Object.keys(data)) {
        var input = $(form + ' [name=' + data[prop].propertyName + ']');
        switch(input.prop('tagName')) {
            case "SELECT":
                input.val(data[prop].defaultValue);
                break;
            case "INPUT":
                switch (input.attr('type')) {
                    case "string":
                    case "number":
                        input.val(data[prop].defaultValue);
                        break;
                    case "checkbox":
                        input.prop('checked', data[prop].defaultValue);
                        break;
                }
                break;
        }
    }
}

function emptyForm(form) {
    $(form)[0].reset();
}

function generateForm(data, destDiv) {
    for(i in data) {
        var prop = data[i];
        var label = $('<label>');
        label.attr('for', prop.propertyName);
        label.html(prop.propertyName);
        destDiv.append(label);

        var autoTrans = formTranslationTable[prop.propertyType];
        if(autoTrans) {
            var input = $('<input>');
            input.attr('name', prop.propertyName);
            input.attr('type', autoTrans);

            switch(prop.propertyType) {
                case "DECIMAL":
                    input.attr('step', 'any');
                    break;
                case "IMAGE":
                    input.attr('list', 'resourcesImg');
                    break;
                case "MODEL":
                    input.attr('list', 'resourcesModel');
                    break;
            }

            destDiv.append(input);
        } else {
            switch (prop.propertyType) {
                case "ENUM":
                    var select = $('<select>');
                    select.attr('name', prop.propertyName);
                    for(j in prop.additionnalData) {
                        var value = prop.additionnalData[j];
                        var option = $('<option>');
                        option.html(value);
                        option.val(value);
                        select.append(option);
                    }
                    destDiv.append(select);
                    break;
            }
        }

        destDiv.append($('<br/>'));
    }
}
