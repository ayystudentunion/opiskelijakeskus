var fs = require('browserify-fs');
const $ = require('jquery');

var sendIdeaBtn = document.getElementById('send_idea_btn');
var iconsContainer = document.getElementById('icons');
var imagesFolderName = "images/";
var selectedIcon = null;

window.onload = function() {
    for (var i = 0; i < iconsContainer.childElementCount; i++) {
        (function() {
            var idx = i;

            iconsContainer.children[i].onclick = function() {
                iconsContainer.children[idx].style.border = "4px dotted purple";
                selectedIcon = idx;

                for (var j = 0; j < iconsContainer.childElementCount; j++) {
                    if (j != idx) {
                        iconsContainer.children[j].style.border = null;
                    }
                }
            }
        }());
    }
}

sendIdeaBtn.onclick = function() {
    // Require icon
    if (selectedIcon == null) {
        alert("valitse kuvake pls");
        return;
    }

    // Get values from input fields
    var ideaName = document.getElementById('idea_name').value;
    var ideaDesc = document.getElementById('idea_description').value;
    var ideaReasons = document.getElementById('idea_reasons').value;

    var iconPath = iconsContainer.children[selectedIcon].getAttribute('src');
    var iconFile = iconPath.substring(iconPath.indexOf(imagesFolderName) + imagesFolderName.length, iconPath.length);

    // Require text for all
    /*
    if (!/\S/.test(ideaName)) {
        alert("anna idealle nimi");
        return;
    }

    if (!/\S/.test(ideaDesc)) {
        alert("anna idealle kuvaus");
        return;
    }

    if (!/\S/.test(ideaReasons)) {
        alert("anna idealle syyt");
        return;
    }*/

    
    $.getJSON("../data/data.json", function(result) {
        var newIdeaObj = {};
        newIdeaObj[ideaName] = {};
        newIdeaObj[ideaName]["description"] = ideaDesc;
        newIdeaObj[ideaName]["reasons"] = ideaReasons;
        newIdeaObj[ideaName]["icon"] = iconFile;

        result.push(newIdeaObj);

        $.ajax({
            url: '../php/saveNewIdea.php',
            type: 'POST',
            data: {"file_path": "../data/data.json", "data": JSON.stringify(result)},
            success: function(data) {}
        });
    });
}