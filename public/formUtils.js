// -- Form Generation Utils -- //

let formTranslationTable = {
    "STRING": 'string',
    "BOOLEAN": 'checkbox',
    "DECIMAL": 'number',
    "NUMBER": 'number',
    "IMAGE": 'string',
    "MODEL": 'string'
}

function readForm(form) {
    let data = {};
    $(form + ' [name]').each(function(k, v) {
        let val = $(this).val();
        if($(this).prop('tagName') === "INPUT" && $(this).attr('type') === "checkbox")
            val = $(this).prop('checked');
        data[$(this).attr('name')] = val;
    });
    return data;
}

function createForm(options) {
    let form = $('<form>');
    form.attr('id', options.id);
    form.attr('name', options.name);
    generateForm(options.properties, form);

    if(options.onSaveClick) {
        let saveBtn = $('<button>');
        saveBtn.html('Save');
        saveBtn.on('click', options.onSaveClick);
        form.append(saveBtn);
    }

    if(options.onDeleteClick) {
        let delBtn = $('<button>');
        delBtn.html('Delete');
        delBtn.on('click', options.onDeleteClick);
        form.append(delBtn)
    }

    return form;
}

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
    if($(form)[0])
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