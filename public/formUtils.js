// -- Form Generation Utils -- //

let formTranslationTable = {
    "STRING": 'string',
    "BOOLEAN": 'checkbox',
    "DECIMAL": 'number',
    "NUMBER": 'number',
    "IMAGE": 'string',
    "MODEL": 'string'
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