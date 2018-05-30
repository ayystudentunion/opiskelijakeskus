const uuid = require('uuid/v1');

var form = document.getElementById('form');
var iconsContainer = document.getElementById('icons');
var imagesFolderName = "images/";
var selectedIcon = null;
var dataFilePath = "../data/data_under_review.json";

// Reset scroll on page reload becuase if the page is scrolled half way it looks stupid
window.onbeforeunload = function() {
    window.scrollTo(0, 0);
}

window.onload = function() {
    $('input#idea-name-field, textarea#idea-desc-field, input#idea-argument-field-1, input#idea-argument-field-2, input#idea-argument-field-3, input#idea-argument-field-4, input#idea-argument-field-5').characterCounter();
    
    setCopyrightText();

    var selectElements = document.getElementsByTagName('select');
    
    for (var i = 0; i < selectElements.length; i++) {
        for (var key in categoryIcons) {
            var option = document.createElement('option');
            option.setAttribute('data-icon', "../images/" + categoryIcons[key] + "_musta.png");
            option.innerHTML = key;
            selectElements[i].appendChild(option);
        }
    }

    $('select').formSelect();
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    document.getElementById('submit-btn').disabled = true;

    // Get values from input fields
    var ideaName = document.getElementById('idea-name-field').value;
    var ideaDesc = document.getElementById('idea-desc-field').value;
    var ideaArgument1 = document.getElementById('idea-argument-field-1').value;
    var ideaArgument2 = document.getElementById('idea-argument-field-2').value;
    var ideaArgument3 = document.getElementById('idea-argument-field-3').value;
    var ideaArgument4 = document.getElementById('idea-argument-field-4').value;
    var ideaArgument5 = document.getElementById('idea-argument-field-5').value;
    var mainCategory = document.getElementById('idea-main-category').value;
    var secondaryCategory1 = document.getElementById('idea-secondary-category-1').value;
    var secondaryCategory2 = document.getElementById('idea-secondary-category-2').value;
    var secondaryCategory3 = document.getElementById('idea-secondary-category-3').value;

    // Add new idea to reviewed ideas
    $.getJSON(dataFilePath, function(result) {
        var newIdeaObj = {};
        newIdeaObj[ideaName] = {};
        newIdeaObj[ideaName]["description"] = ideaDesc;
        newIdeaObj[ideaName]["arguments"] = [];
        newIdeaObj[ideaName]["likes"] = "0";
        newIdeaObj[ideaName]["secondary_categories"] = [];
        newIdeaObj[ideaName]["id"] = uuid();

        if (ideaArgument1 != "") newIdeaObj[ideaName]["arguments"].push(ideaArgument1);
        if (ideaArgument2 != "") newIdeaObj[ideaName]["arguments"].push(ideaArgument2);
        if (ideaArgument3 != "") newIdeaObj[ideaName]["arguments"].push(ideaArgument3);
        if (ideaArgument4 != "") newIdeaObj[ideaName]["arguments"].push(ideaArgument4);
        if (ideaArgument5 != "") newIdeaObj[ideaName]["arguments"].push(ideaArgument5);

        if (mainCategory != "") newIdeaObj[ideaName]["main_category"] = mainCategory;

        if (secondaryCategory1 != "") newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory1);
        if (secondaryCategory2 != "") newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory2);
        if (secondaryCategory3 != "") newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory3);

        result.push(newIdeaObj);

        $.ajax({
            url: '../php/save_data.php',
            type: 'POST',
            data: {"file_path": dataFilePath, "data": JSON.stringify(result)},
            success: function(data) {}
        });

        // Show load bar and refresh page after it finishes
        document.getElementById('top-load-bar').style.width = "100vw";
        setTimeout(() => {
            location.reload();
        }, 2500);
    });
}, false);