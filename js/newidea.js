var fs = require('browserify-fs');
const $ = require('jquery');
const randWord = require('random-words');

var sendIdeaBtn = document.getElementById('send_idea_btn');
var generateIdeas = document.getElementById('generate_ideas');

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
        newIdeaObj[ideaName]["likes"] = "0";

        result.push(newIdeaObj);

        $.ajax({
            url: '../php/save_data.php',
            type: 'POST',
            data: {"file_path": "../data/data.json", "data": JSON.stringify(result)},
            success: function(data) {}
        });
    });
}

generateIdeas.onclick = function() {
    var ideasCount = parseInt(document.getElementById('how_many_random_ideas').value);

    var ideas = [];
    for (var i = 0; i < ideasCount; i++) {
        var idea = {};
        var name = randWord();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        var desc = "";
        for (var j = 0; j < Math.random() * 500; j++) {
            var word = randWord();
            if (j == 0) word = word.charAt(0).toUpperCase() + word.slice(1);
            desc += word + " ";
        }

        desc.charAt(0)

        idea[name] = {};
        idea[name].description = desc;
        idea[name].likes = String(Math.floor(Math.random() * 200));
        idea[name].icon = "icon" + String(Math.floor(Math.random() * 6) + 1) + ".png";

        ideas.push(idea);
    }

    console.log(ideas);

    $.ajax({
        url: '../php/save_data.php',
        type: 'POST',
        data: {"file_path": "../data/data.json", "data": JSON.stringify(ideas)},
        success: function(data) {}
    });
}