// Click sur un descriptor

$('#descriptorsList').on('click', 'li', function(e) {
    if($(this).hasClass('active')) return;

    $('#descriptorsList li.active').removeClass('active');
    $(this).addClass('active');
    dataManager.active.setDescriptor($(this).attr('data-name'));

    socket.emit('descriptor get content', dataManager.active.descriptor);
    socket.emit('descriptor get form', dataManager.active.descriptor);
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

// Clic sur un sub-descriptor

function subcontentClick(e) {
    if($(this).hasClass('active')) return;

    $('#descList li.active').removeClass('active');
    $(this).addClass('active');
    let id = $(this).attr('data-id');
    dataManager.active.setSubcontent(id);
    fillForm(dataManager.active.data.descriptors[id], '#contentForm');
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
    newContentBtn.on('click', onNewSubcontentButtonClick);
    $('#descList ul').append(newContent.append(newContentBtn));
}

function onNewSubcontentButtonClick() {
    dataManager.active.reset("subcontent");
    $('#descList .active').removeClass('active');
    fillDefault(dataManager.active.pattern.groupContent, '#contentForm');
}


