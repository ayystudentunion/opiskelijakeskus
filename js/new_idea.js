const randWord = require('random-words');

var generateIdeas = document.getElementById('generate_ideas');

var form = document.getElementById('form');
var generateIdeasBtn = document.getElementById('generate-ideas-btn');
var iconsContainer = document.getElementById('icons');
var imagesFolderName = "images/";
var selectedIcon = null;

var categoryIcons = {
    "Harrastuket": "harrastukset",
    "Hygieniatilat": "wc ja suihku",
    "Juhlat": "Juhlat",
    "Kahvila": "kahvila ja baari",
    "Kokoukset": "ryhmatyo",
    "Muut": "muut_abstrakti",
    "Palvelut": "asiakaspalvelu",
    "Pop up-tapahtumat": "Nayttelyt",
    "Rentoutuminen": "Hyvinvointi",
    "Ruoka": "ravintola",
    "Säilytys": "tavaran sailytys",
    "Sauna": "sauna",
    "Seminaarit": "Muut tapahtumat",
    "Sosiaalisuus": "sosiaalinen",
    "Tapahtumat": "muut",
    "Tietopalvelut": "palvelu",
    "Työskentely": "opiskelu ja tyot",
    "Ulkotilat": "ulkotilat",
    "Urheilu": "urheilu",
    "Vapaa-aika": "hengailu ja vapaa-aika",
    "Villit ideat": "villit ideat"
}

window.onload = function() {
    $('input#idea-name-field, textarea#idea-desc-field, input#idea-argument-field-1, input#idea-argument-field-2, input#idea-argument-field-3, input#idea-argument-field-4, input#idea-argument-field-5').characterCounter();
    
    setCopyrightText();

    /*
    <select class="icons" required>
        <option value="" disabled selected>Valitse pääkategoria</option>
        <option value="" data-icon="../images/harrastukset_musta.png">Harrastukset</option>
    </select>
    */

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
/*
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
    }*/
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

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

    $.getJSON("../data/data.json", function(result) {
        var newIdeaObj = {};
        newIdeaObj[ideaName] = {};
        newIdeaObj[ideaName]["description"] = ideaDesc;
        newIdeaObj[ideaName]["arguments"] = [];
        newIdeaObj[ideaName]["likes"] = "0";
        newIdeaObj[ideaName]["secondary_categories"] = [];

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
            data: {"file_path": "../data/data.json", "data": JSON.stringify(result)},
            success: function(data) {}
        });
    });
}, false);

/*

var categories = {
    1: "Eggs",
    2: "Fish",
    3: "Burgers",
    4: "Burgers",
    5: "Donuts",
    6: "Ice Cream",
    7: "Apples"
};
*/

// Generates some ideas randomly and overwrites all old ideas
generateIdeasBtn.onclick = function() {
    var ideasCount = 115;

    var ideas = [];
    for (var i = 0; i < ideasCount; i++) {
        var idea = {};
        var name = randWord();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        var desc = "";

        var counter = 0;
        while (desc.length < 350) {
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
        var categories = [];
        for (var key in categoryIcons) {
            categories.push(key);
        }

        for (var j = 0; j < Math.random() * 2; j++) {
            var num = Math.floor(Math.random() * 20 + 1);
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
            var nr = Math.floor(Math.random() * 20 + 1);
            if (usedCategories.indexOf(nr) == -1) {
                iconNr = nr;
            }
        }

        idea[name] = {};
        idea[name].description = desc;
        idea[name].arguments = reasons;
        idea[name].likes = String(Math.floor(Math.random() * 200));
        idea[name].main_category = categories[iconNr];
        idea[name].secondary_categories = secondaryCategories;

        ideas.push(idea);
    }

    $.ajax({
        url: '../php/save_data.php',
        type: 'POST',
        data: {"file_path": "../data/data.json", "data": JSON.stringify(ideas)},
        success: function(data) {}
    });
}

function setCopyrightText() {
    var copyrightTextEl = document.getElementById('copyright_text');
    var createdYear = 2018;
    var currentYear = new Date().getFullYear();

    // Update copyright text year span according to the current year
    var yearText = String(createdYear) + ((currentYear != createdYear) ? ("-" + String(currentYear)) : "");

    copyrightTextEl.innerHTML = "Copyright © " + yearText + " <a href='https://ayy.fi' target='_blank'>Aalto University Student Union</a>";
}