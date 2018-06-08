const uuid = require('uuid/v1');

var formContainer = document.getElementsByClassName('form-container')[0];
var form = document.getElementById('form');
var iconsContainer = document.getElementById('icons');
var loadBar = document.getElementById('top-load-bar');
var ideaSentWrapper = document.getElementById('idea-sent-wrapper');
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
            option.setAttribute('category-name', key);
            option.setAttribute('translation-en', categoryTranslationsEN[key]);
            option.innerHTML = key;
            selectElements[i].appendChild(option);
            translateElement(option);
        }
    }

    $('select').formSelect();
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
    var mainCategory = document.getElementById('idea-main-category');
    var secondaryCategory1 = document.getElementById('idea-secondary-category-1');
    var secondaryCategory2 = document.getElementById('idea-secondary-category-2');
    var secondaryCategory3 = document.getElementById('idea-secondary-category-3');

    var checkedCategories = [];
    var cats = [mainCategory.value, secondaryCategory1.value, secondaryCategory2.value, secondaryCategory3.value];
    for (var i = 0; i < cats.length; i++) {
        if (cats[i] != "" && checkedCategories.indexOf(cats[i]) != -1) {
            return alert("Valitse jokaiseksi kategoriaksi eri kategoria.");
        }

        checkedCategories.push(cats[i]);
    }

    document.getElementById('submit-btn').disabled = true;

    // Add new idea to reviewed ideas
    $.getJSON(dataFilePath, function(result) {
        if (result == undefined || result == null) {
            setTimeout(() => {
                afterIdeaSent(false);
            }, 1500);
            return;
        }

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

        if (mainCategory.selectedIndex != -1) newIdeaObj[ideaName]["main_category"] = mainCategory.options[mainCategory.selectedIndex].getAttribute('category-name');

        if (secondaryCategory1.selectedIndex != -1) newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory1.options[secondaryCategory1.selectedIndex].getAttribute('category-name'));
        if (secondaryCategory2.selectedIndex != -1) newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory2.options[secondaryCategory2.selectedIndex].getAttribute('category-name'));
        if (secondaryCategory3.selectedIndex != -1) newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory3.options[secondaryCategory3.selectedIndex].getAttribute('category-name'));

        result.push(newIdeaObj);
        loadBar.style.width = "100vw";

        $.ajax({
            url: '../php/save_data.php',
            type: 'POST',
            data: {"file_path": dataFilePath, "data": JSON.stringify(result)},
            success: function(data) {
                setTimeout(() => {
                    afterIdeaSent(true);
                }, 1500);
            },
            error: function(err) {
                setTimeout(() => {
                    afterIdeaSent(false);
                }, 1500);
            }
        });
    });
}, false);

function afterIdeaSent(success) {
    if (!success) {
        document.getElementById('idea-sent-container').style.borderTop = "2px solid darkred";
        document.getElementById('idea-sent-title').innerHTML = "Pahoittelut, idean lähettämisessä tapahtui virhe.";
    }

    loadBar.classList.add('no-display');
    formContainer.classList.add('faded-out');

    setTimeout(() => {
        window.scrollTo(0, 0);
        formContainer.classList.add('no-display');
        ideaSentWrapper.classList.remove('no-display');
        setTimeout(() => {
            ideaSentWrapper.classList.remove('faded-out');
        });
    }, 500);
}