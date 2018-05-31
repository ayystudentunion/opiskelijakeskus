var formContainer = document.getElementById('form-container');

window.onload = function() {
    setCopyrightText();

    var selectElements = document.getElementsByTagName('select');
    for (var i = 0; i < selectElements.length; i++) {
        for (var key in categoryIcons) {
            var option = document.createElement('option');
            option.setAttribute('data-icon', "../../images/" + categoryIcons[key] + "_musta.png");
            option.innerHTML = key;
            selectElements[i].appendChild(option);
        }
    }

    $('select').formSelect();

    resetReviewModal();
}

function resetReviewModal() {
    $.getJSON("../../data/data_under_review.json", function(result) {
        if (result.length == 0) {
            if (formContainer.classList.contains('no-display')) {
                alert("Ei moderoitavia ideoita.");
            } else {
                formContainer.classList.add('no-display');
            }

            initParticles();

            return;
        }

        document.getElementById('number-of-ideas').innerHTML = result.length;
        document.getElementById('form-bottom-buttons-container').classList.remove('no-display');

        // Reset argument and secondary categories to no display because next idea might have less of either
        var argumentEls = document.getElementsByClassName('idea-argument');
        for (var i = 0; i < argumentEls.length; i++) {
            argumentEls[i].classList.add('no-display');
            argumentEls[i].value = "";
        }

        var secondaryCategoryEls = document.getElementsByClassName('idea-secondary-category');
        for (var i = 0; i < secondaryCategoryEls; i++) {
            secondaryCategoryEls[i].classList.add('no-display');
            secondaryCategoryEls[i].value = "";
        }

        var idea = result[0];
        for (var key in idea) {
            var ideaObj = idea[key];
            console.log(ideaObj);

            document.getElementById('idea-name-field').value = key;
            document.getElementById('idea-desc-field').value = ideaObj.description;
            for (var i = 0; i < ideaObj.arguments.length; i++) {
                var elField = document.getElementById('idea-argument-field-' + (i + 1));
                var elContainer = document.getElementById('idea-argument-' + (i + 1));
                elField.value = ideaObj.arguments[i];
                elContainer.classList.remove('no-display');
            }
            
            document.getElementById('idea-main-category').value = ideaObj.main_category;

            for (var i = 0; i < ideaObj.secondary_categories.length; i++) {
                var elField = document.getElementById('idea-secondary-category-field-' + (i + 1));
                var elContainer = document.getElementById('idea-secondary-category-' + (i + 1));
                elField.value = ideaObj.secondary_categories[i];
                elContainer.classList.remove('no-display');
            }

            M.AutoInit();

            var secondaryCategoriesTitleEl = document.getElementById('form-secondary-categories-title');
            if (ideaObj.secondary_categories != undefined && ideaObj.secondary_categories.length > 0) {
                secondaryCategoriesTitleEl.classList.remove('no-display');
            } else {
                secondaryCategoriesTitleEl.classList.add('no-display');
            }
        }

        M.updateTextFields();

        document.getElementById('form-container').classList.remove('no-display');
        setTimeout(() => {
            document.getElementById('form-container').classList.remove('faded-out');
        }, 50);
    });
}

$("#form").submit(function(event) {
    event.preventDefault();
    var isAcceptBtn = document.activeElement.getAttribute('id') == 'accept-btn';

    // Get values from input fields
    var ideaName = document.getElementById('idea-name-field').value;
    var ideaDesc = document.getElementById('idea-desc-field').value;
    var ideaArgument1 = document.getElementById('idea-argument-field-1').value;
    var ideaArgument2 = document.getElementById('idea-argument-field-2').value;
    var ideaArgument3 = document.getElementById('idea-argument-field-3').value;
    var ideaArgument4 = document.getElementById('idea-argument-field-4').value;
    var ideaArgument5 = document.getElementById('idea-argument-field-5').value;
    var mainCategory = document.getElementById('idea-main-category').value;
    var secondaryCategory1 = document.getElementById('idea-secondary-category-field-1').value;
    var secondaryCategory2 = document.getElementById('idea-secondary-category-field-2').value;
    var secondaryCategory3 = document.getElementById('idea-secondary-category-field-3').value;

    $.getJSON("../../data/data_under_review.json", function(results) {
        var ideaID = results[0][Object.keys(results[0])[0]].id;
        
        /*
        $.ajax({
            url: '../../php/save_data.php',
            type: 'POST',
            data: {"file_path": "../data/data_under_review.json", "data": JSON.stringify(results.slice(1))},
            success: function(data) {}
        });*/
    
        // Store declined ideas so they can be revived if necessary
        var fileToSaveTo = (isAcceptBtn) ? "../data/data.json" : "../data/data_trashed.json";
    
        $.getJSON("../" + fileToSaveTo, function(result) {
            var newIdeaObj = {};
            newIdeaObj[ideaName] = {};
            newIdeaObj[ideaName]["description"] = ideaDesc;
            newIdeaObj[ideaName]["arguments"] = [];
            newIdeaObj[ideaName]["likes"] = "0";
            newIdeaObj[ideaName]["secondary_categories"] = [];
            newIdeaObj[ideaName]["id"] = ideaID;

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
    
            console.log(newIdeaObj);
            /*
            $.ajax({
                url: '../../php/save_data.php',
                type: 'POST',
                data: {"file_path": fileToSaveTo, "data": JSON.stringify(result)},
                success: function(data) {}
            });*/
        });
    })

    /*
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
    });*/

    formContainer.classList.add('faded-out');
    setTimeout(() => {
        resetReviewModal();
    }, 500);
});