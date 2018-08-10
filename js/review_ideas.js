/**
 * @file Handles admin idea review page form handling.
 * @description Fetches submitted ideas from server and displays then in a form for the admin to
 *              either accept or reject the ideas. If they are accepted, they are saved to the file
 *              that contains all current ideas. If they are rejected, they are stored in another file
 *              for possible restoration.
 * @author Zentryn <https://github.com/Zentryn>
 */

var formContainer = document.getElementById('form-container');

window.onload = function() {
    // Update copyright text in footer
    setCopyrightText();

    // Create options for each category in select elements
    var selectElements = document.getElementsByTagName('select');
    for (var i = 0; i < selectElements.length; i++) {
        for (var key in categoryIcons) {
            var option = document.createElement('option');
            option.setAttribute('data-icon', "../../images/" + categoryIcons[key] + "_musta.png");
            option.innerHTML = key;
            selectElements[i].appendChild(option);
        }
    }

    // Initialize materiaze select elements
    $('select').formSelect();

    resetReviewModal();
}

// Resets the review form modal to display latest idea in review queue
function resetReviewModal() {
    // Fetch ideas from file
    $.getJSON("../../data/data_under_review.json", function(result) {
        // No ideas available?
        if (result.length == 0) {
            if (formContainer.classList.contains('no-display')) {
                alert("Ei moderoitavia ideoita.");
            } else {
                formContainer.classList.add('no-display');
            }

            initParticles();

            return;
        }

        // Show number of ideas left to moderate
        document.getElementById('number-of-ideas').innerHTML = result.length;
        document.getElementById('form-bottom-buttons-container').classList.remove('no-display');

        // Reset argument and secondary categories to no display because next idea might have less of either
        var argumentEls = document.getElementsByClassName('idea-argument-field');
        for (var i = 0; i < argumentEls.length; i++) {
            argumentEls[i].value = "";
            document.getElementsByClassName('idea-argument')[i].classList.add('no-display');
        }

        var secondaryCategoryEls = document.getElementsByClassName('idea-secondary-category-field');
        for (var i = 0; i < secondaryCategoryEls.length; i++) {
            secondaryCategoryEls[i].value = "";
            document.getElementsByClassName('idea-secondary-category')[i].classList.add('no-display');
        }

        // Set values of form elements to the idea's values
        var idea = result[0];
        for (var key in idea) {
            var ideaObj = idea[key];

            document.getElementById('idea-name-field').value = key;
            $('#idea-desc-field').val(ideaObj.description);
            for (var i = 0; i < ideaObj.arguments.length; i++) {
                var elField = document.getElementById('idea-argument-field-' + (i + 1));
                var elContainer = document.getElementById('idea-argument-' + (i + 1));
                elField.value = ideaObj.arguments[i];
                elContainer.classList.remove('no-display');
            }

            // This resets the materialize description input field
            $('#idea-desc-field').keydown();
            
            document.getElementById('idea-main-category').value = ideaObj.main_category;

            for (var i = 0; i < ideaObj.secondary_categories.length; i++) {
                var elField = document.getElementById('idea-secondary-category-field-' + (i + 1));
                var elContainer = document.getElementById('idea-secondary-category-' + (i + 1));
                elField.value = ideaObj.secondary_categories[i];
                elContainer.classList.remove('no-display');
            }

            // Re-initialize materialize input fields
            M.AutoInit();
            M.textareaAutoResize($('#idea-desc-field'));

            // Hide secondary categories if there are none
            var secondaryCategoriesTitleEl = document.getElementById('form-secondary-categories-title');
            if (ideaObj.secondary_categories != undefined && ideaObj.secondary_categories.length > 0) {
                secondaryCategoriesTitleEl.classList.remove('no-display');
            } else {
                secondaryCategoriesTitleEl.classList.add('no-display');
            }
        }

        // Update materialize text fields since they now have new text
        M.updateTextFields();

        // Fade in form modal
        document.getElementById('form-container').classList.remove('no-display');
        setTimeout(() => {
            document.getElementById('form-container').classList.remove('faded-out');
        }, 50);
    });
}

// On submit
$("#form").submit(function(event) {
    // Prevent page from refreshing (this happens by default when a form is submitted)
    event.preventDefault();

    // Check whether the user pressed the accept or reject button
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
        // Do some error checking
        if (results == undefined || results == null || results.length == 0) {
            return alert("Jotakin meni pieleen idean tallennuksessa. (ErrorMSG: Tarkastettavien ideoiden tiedosto oli tyhjä.)");
        }

        // Get ID of submitted idea
        var ideaID = results[0][Object.keys(results[0])[0]].id;

	    // Choose appropriate file to save to according to which button the user clicked
        var fileToSaveTo = (isAcceptBtn) ? "../data/data.json" : "../data/data_trashed.json";
    
        $.getJSON("../" + fileToSaveTo, function(result) {
            if (isAcceptBtn) {
                // Check for unusual but possible errors
                if (result == undefined || result == null || result.length == 0 || JSON.stringify(result).length <= 10) {
                    return alert("Jotakin meni pieleen idean tallennuksessa. (ErrorMSG: Ideat olivat tyhjiä)");
                }
            }

            // Create a new object for the submitted idea
            var newIdeaObj = {};
            newIdeaObj[ideaName] = {};
            newIdeaObj[ideaName]["description"] = ideaDesc;
            newIdeaObj[ideaName]["arguments"] = [];
            newIdeaObj[ideaName]["likes"] = "0";
            newIdeaObj[ideaName]["secondary_categories"] = [];
            newIdeaObj[ideaName]["id"] = ideaID;

            // Only save values that contain characters
            if (/\S/.test(ideaArgument1)) newIdeaObj[ideaName]["arguments"].push(ideaArgument1);
            if (/\S/.test(ideaArgument2)) newIdeaObj[ideaName]["arguments"].push(ideaArgument2);
            if (/\S/.test(ideaArgument3)) newIdeaObj[ideaName]["arguments"].push(ideaArgument3);
            if (/\S/.test(ideaArgument4)) newIdeaObj[ideaName]["arguments"].push(ideaArgument4);
            if (/\S/.test(ideaArgument5)) newIdeaObj[ideaName]["arguments"].push(ideaArgument5);

            if (/\S/.test(mainCategory)) newIdeaObj[ideaName]["main_category"] = mainCategory;

            if (/\S/.test(secondaryCategory1)) newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory1);
            if (/\S/.test(secondaryCategory2)) newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory2);
            if (/\S/.test(secondaryCategory3)) newIdeaObj[ideaName]["secondary_categories"].push(secondaryCategory3);

            result.push(newIdeaObj);
    
            // Send ajax request and save new contents to file
            $.ajax({
                url: '../../php/save_data.php',
                type: 'POST',
                data: {"file_path": fileToSaveTo, "data": JSON.stringify(result)},
                success: function(data) {
                    // Check that the idea saved
                    $.getJSON("../" + fileToSaveTo, function(new_results) {
                        var found = false;
                        for (var i = 0; i < new_results.length; i++) {
                            if (String(new_results[i][Object.keys(new_results[i])[0]].id) == String(results[0][Object.keys(results[0])[0]].id)) {
                                found = true;
                                break;
                            }
                        }

                        // Idea wasn't found in the file after saving
                        if (!found) {
                            afterIdeaSubmit();
                            return alert("Jotakin meni pieleen idean tallennuksessa. (ErrorMSG: Ideaa ei löytynyt tallennuksen jälkeen.)");
                        }

                        // Remove from reviewed ideas file
                        $.ajax({
                            url: '../../php/save_data.php',
                            type: 'POST',
                            data: {"file_path": "../data/data_under_review.json", "data": JSON.stringify(results.slice(1))},
                            success: function(data) {
                                afterIdeaSubmit();
                            },
                            error: function(err) {
                                afterIdeaSubmit();
                                return alert("Jotakin meni pieleen idean tallennuksessa. (ErrorMSG: Second ajax request failed)");
                            }
                        });
                    });
                },
                error: function(err) {
                    afterIdeaSubmit();
                    return alert("Jotakin meni pieleen idean tallennuksessa. (ErrorMSG: First ajax request failed)");
                }
            });
        });
    });
});

// Fades out modal and then resets it after idea is submitted
function afterIdeaSubmit() {
    formContainer.classList.add('faded-out');
    setTimeout(() => {
        resetReviewModal();
    }, 500);
}