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
    var ideaReason1 = document.getElementById('reason1').value;
    var ideaReason2 = document.getElementById('reason2').value;
    var ideaReason3 = document.getElementById('reason3').value;

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
        newIdeaObj[ideaName]["reasons"] = [];
        newIdeaObj[ideaName]["icon"] = iconFile;
        newIdeaObj[ideaName]["likes"] = "0";

        if (ideaReason1 != "") newIdeaObj[ideaName]["reasons"].push(ideaReason1);
        if (ideaReason2 != "") newIdeaObj[ideaName]["reasons"].push(ideaReason2);
        if (ideaReason3 != "") newIdeaObj[ideaName]["reasons"].push(ideaReason3);

        result.push(newIdeaObj);

        $.ajax({
            url: '../php/save_data.php',
            type: 'POST',
            data: {"file_path": "../data/data.json", "data": JSON.stringify(result)},
            success: function(data) {}
        });
    });
}

var categories = {
    1: "Eggs",
    2: "Fish",
    3: "Burgers",
    4: "Burgers",
    5: "Donuts",
    6: "Ice Cream",
    7: "Apples"
};

generateIdeas.onclick = function() {
    var ideasCount = parseInt(document.getElementById('how_many_random_ideas').value);

    var ideas = [];
    for (var i = 0; i < ideasCount; i++) {
        var idea = {};
        var name = randWord();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        var desc = "";

        var counter = 0;
        while (desc.length < 450) {
            var word = randWord();
            if (counter++ == 0) word = word.charAt(0).toUpperCase() + word.slice(1);
            desc += word + " ";
        }

        var reasons = [];
        for (var k = 0; k < 5; k++) {
            var reason = "";

            var counter = 0;
            while (reason.length < 100) {
                var word = randWord();
                if (counter++ == 0) word = word.charAt(0).toUpperCase() + word.slice(1);
                reason += word + " ";
            }
            
            reasons.push(reason);
        }

        var secondaryCategories = [];
        var usedCategories = [];

        for (var j = 0; j < Math.random() * 2; j++) {
            var num = Math.floor(Math.random() * 7 + 1);
            var newCategory = categories[num];
            if (secondaryCategories.indexOf(newCategory) != -1) {
                j--;
                continue;
            }

            usedCategories.push(num);
            secondaryCategories.push(newCategory);
        }

        var iconNr = null;
        while (iconNr == null) {
            var nr = Math.floor(Math.random() * 7 + 1);
            if (usedCategories.indexOf(nr) == -1) {
                iconNr = nr;
            }
        }

        idea[name] = {};
        idea[name].description = desc;
        idea[name].reasons = reasons;
        idea[name].likes = String(Math.floor(Math.random() * 200));
        idea[name].icon = "icon" + String(iconNr) + ".png";
        idea[name].primaryCategory = categories[iconNr];
        idea[name].secondaryCategories = secondaryCategories;

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