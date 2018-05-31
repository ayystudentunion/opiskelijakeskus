var formContainer = document.getElementById('form-container');

window.onload = function() {
    setCopyrightText();

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
            argumentEls[i].innerHTML = "";
        }

        var secondaryCategoryEls = document.getElementsByClassName('idea-secondary-category');
        for (var i = 0; i < secondaryCategoryEls; i++) {
            secondaryCategoryEls[i].classList.add('no-display');
            secondaryCategoryEls[i].innerHTML = "";
        }

        var idea = result[0];
        for (var key in idea) {
            var ideaObj = idea[key];

            document.getElementById('idea-name').innerHTML = key;
            document.getElementById('idea-description').innerHTML = ideaObj.description;
            for (var i = 0; i < ideaObj.arguments.length; i++) {
                var el = document.getElementById('idea-argument-' + (i + 1));
                el.innerHTML = "- " + ideaObj.arguments[i];
                el.classList.remove('no-display');
            }
            
            document.getElementById('idea-primary-category').innerHTML = ideaObj.main_category;
            for (var i = 0; i < ideaObj.secondary_categories.length; i++) {
                var el = document.getElementById('idea-secondary-category-' + (i + 1));
                el.innerHTML = "- " + ideaObj.secondary_categories[i];
                el.classList.remove('no-display');
            }

            var secondaryCategoriesTitleEl = document.getElementById('idea-secondary-categories-title');
            if (ideaObj.secondary_categories != undefined && ideaObj.secondary_categories.length > 0) {
                secondaryCategoriesTitleEl.classList.remove('no-display');
            } else {
                secondaryCategoriesTitleEl.classList.add('no-display');
            }
        }

        document.getElementById('form-container').classList.remove('no-display');
        setTimeout(() => {
            document.getElementById('form-container').classList.remove('faded-out');
        }, 50);
    });
}

$("#form").submit(function(event) {
    event.preventDefault();
    var isAcceptBtn = document.activeElement.getAttribute('id') == 'accept-btn';

    $.getJSON("../../data/data_under_review.json", function(results) {
        $.ajax({
            url: '../../php/save_data.php',
            type: 'POST',
            data: {"file_path": "../data/data_under_review.json", "data": JSON.stringify(results.slice(1))},
            success: function(data) {}
        });
    
        // Store declined ideas so they can be revived if necessary
        var fileToSaveTo = (isAcceptBtn) ? "../data/data.json" : "../data/data_trashed.json";
    
        $.getJSON("../" + fileToSaveTo, function(result) {
            result.push(results[0]);
    
            $.ajax({
                url: '../../php/save_data.php',
                type: 'POST',
                data: {"file_path": fileToSaveTo, "data": JSON.stringify(result)},
                success: function(data) {}
            });
        });
    });

    formContainer.classList.add('faded-out');
    setTimeout(() => {
        resetReviewModal();
    }, 500);
});

function setCopyrightText() {
    var copyrightTextEl = document.getElementById('copyright_text');
    var createdYear = 2018;
    var currentYear = new Date().getFullYear();

    // Update copyright text year span according to the current year
    var yearText = String(createdYear) + ((currentYear != createdYear) ? ("-" + String(currentYear)) : "");

    copyrightTextEl.innerHTML = "Copyright © " + yearText + " <a href='https://ayy.fi' target='_blank'>Aalto University Student Union</a>";
}