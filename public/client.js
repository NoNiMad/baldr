// Clic sur un descriptor

$('#descriptorList').on('click', 'li:not(.active)', function(e) {
    $('#descriptorList li.active').removeClass('active');
    $(this).addClass('active');
    dataManager.active.setDescriptor($(this).attr('data-name'));

    socket.emit('descriptor get content', dataManager.active.descriptor);
    socket.emit('descriptor get form', dataManager.active.descriptor);
});

// Clic sur un élément du descriptor

$('#contentList').on('click', 'li:not(.button):not(.active)', function(e) {
    $('#contentList li.active').removeClass('active');
    $(this).addClass('active');
    dataManager.active.setContent($(this).attr('data-name'));

    socket.emit('content get data', {
        descriptorName: dataManager.active.descriptor,
        contentName: dataManager.active.content
    });
});

// Clic sur un sub-descriptor

$('#contentEdition').on('change', '#subcontentList select', function(e) {
    let id = $(this).val();
    if(id === "") {
        dataManager.active.reset('subcontent');
        emptyForm('#contentForm');
        return;
    }
    dataManager.active.setSubcontent(id);
    fillForm(dataManager.active.data.descriptors[id], '#contentForm');
});

// -- Utils functions -- //

function cleanUpEditingArea(newTitle) {
    var div = $('#contentEdition');
    div.empty();
    div.append($('<h3>' + newTitle + '</h3>'));
}

// -- Boutons "New <smthg>"

function createNewContentButton() {
    var newContent = $('<li>');
    newContent.addClass('button');
    var newContentBtn = $('<button>');
    newContentBtn.html('New Content');
    newContentBtn.on('click', onNewContentButtonClick);
    $('#contentList').append(newContent.append(newContentBtn));
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

    $('#subcontentList ul li').remove();
    $('#contentList .active').removeClass('active');

    if(dataManager.active.pattern.groupCore)
        fillDefault(dataManager.active.pattern.groupCore, '#coreForm');
}

function createNewSubcontentButton() {
    var newContentBtn = $('<button>');
    newContentBtn.html('New Sub-Content');
    newContentBtn.on('click', onNewSubcontentButtonClick);
    $('#subcontentList').append(newContentBtn);
}

function onNewSubcontentButtonClick() {
    dataManager.active.reset("subcontent");
    $('#subcontentList .active').removeClass('active');
    fillDefault(dataManager.active.pattern.groupContent, '#contentForm');
    return false;
}

// -- Formulaires -- //

// GroupCore

function onContentSaveButtonClick() {
    socket.emit('content set data', {
        descriptor: dataManager.active.descriptor,
        content: dataManager.active.content,
        data: readForm('#coreForm')
    });
    return false;
}

function onContentDeleteButtonClick() {
    if(dataManager.active.content === null) return false;

    socket.emit('delete content', {
        descriptor: dataManager.active.descriptor,
        content: dataManager.active.content
    });
    onNewContentButtonClick();

    return false;
}

// GroupContent

function onSubcontentSaveButtonClick() {
    socket.emit('content set subcontent', {
        descriptor: dataManager.active.descriptor,
        content: dataManager.active.content,
        id: dataManager.active.subcontent,
        data: readForm('#contentForm')
    });
    return false;
}

function onSubcontentDeleteButtonClick() {
    if(dataManager.active.subcontent === null) return false;

    socket.emit('delete subcontent', {
        descriptor: dataManager.active.descriptor,
        content: dataManager.active.content,
        id: dataManager.active.subcontent
    });
    onNewSubcontentButtonClick();

    return false;
}