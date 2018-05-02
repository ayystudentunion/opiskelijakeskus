var fs = require('browserify-fs');
const $ = require('jquery');

var sendIdeaBtn = document.getElementById('send_idea_btn');

sendIdeaBtn.onclick = function() {
    var ideaName = document.getElementById('idea_name').value;
    var ideaDesc = document.getElementById('idea_description').value;
    var ideaReasons = document.getElementById('idea_reasons').value;

    $.getJSON("../data/data.json", function(result) {
        var newIdeaObj = {};
        newIdeaObj[ideaName] = {};
        newIdeaObj[ideaName]["description"] = ideaDesc;
        newIdeaObj[ideaName]["reasons"] = ideaReasons;

        result.push(newIdeaObj);

        $.ajax({
            url: '../php/saveNewIdea.php',
            type: 'POST',
            data: {"file_path": "../data/data.json", "data": JSON.stringify(result)},
            success: function(data) {}
        });
    });
}