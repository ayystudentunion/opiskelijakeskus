var shuffle = require('shufflejs');
var $ = require('jquery');

// Container for grid items
var shuffleContainer = document.getElementById('shuffle-container');

// ShuffleJS initialization
var element = document.querySelector('#shuffle-container');
var sizer = element.querySelector('.sizer');

var shuffleInstance = new shuffle(element, {
  itemSelector: '.grid-block',
  sizer: sizer,
  staggerAmount: 0,
  staggerAmountMax: 0
});

var jsonData = null;
var nrColumns = -1;

var lastMouseX = -1, lastMouseY = -1;
var mouseX = -1, mouseY = -1;

window.onmousemove = function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}

// Load data from JSON
window.onload = function() {
    updateColumnAmount();

    $.getJSON("data/data.json", function(result) {
        jsonData = result;

        // Initialize main grid
        initGrid();

        // Initialize Materialize (has to be after grid init)
        M.AutoInit();

        // Initialize events for materialize collapsibles
        initEvents();
    });
};

var sortOptions = {
    reverse: false,
    randomize: true,
    by: function(el) {
        return el.getAttribute('grid-position');
    }
}

document.getElementById('sort_btn').onclick = function() {
    console.log("fuck");
    shuffle.prototype.addSorting = function() {
        document.querySelector('.grid-block').addEventListener('change', this.sort.bind(this));
    }
    shuffle.prototype.sort(sortOptions);
}

window.onresize = function() {
    updateGridBlocks();

    updateColumnAmount();    
}

function updateColumnAmount() {
    if (window.clientWidth < 768) {
        nrColumns = 1;
    } else if (window.clientWidth < 992) {
        nrColumns = 2;
    } else if (window.clientWidth < 1200) {
        nrColumns = 3;
    } else {
        nrColumns = 4;
    }
}

// Store grid blocks because might have to be resized
var gridBlocks = [];

document.getElementById('magicbutton').onclick = function() {
    updateGridBlocks();
}

// Initialize HTML grid
function initGrid() {
    for (var i = jsonData.length - 1; i >= 0; i--) {
        var title = null;
        var description = null;
        var reasons = null;
        var icon = null;
        var likes = 0;

        // Get data
        for (var key in jsonData[i]) {
            title = key;
            description = jsonData[i][key].description;
            reasons = jsonData[i][key].reasons;
            icon = jsonData[i][key].icon;
            likes = jsonData[i][key].likes;
        }

        // Create elements
        var gridBlock = document.createElement('div');
        //gridBlock.classList.add('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6', 'col-xs-12', 'grid-block');
        gridBlock.classList.add('grid-block', 'col', 's12', 'm6', 'l4', 'xl3');
        gridBlock.setAttribute('grid-position', i);

        var gridBlockContent = document.createElement('div');
        gridBlockContent.classList.add('grid-block-content');

        var gridBlockHeaderContainer = document.createElement('div');
        gridBlockHeaderContainer.classList.add('grid-block-header-container');

        var gridBlockHeaderText = document.createElement('p');
        gridBlockHeaderText.classList.add('grid-block-header-text');
        gridBlockHeaderText.innerHTML = title;

        var gridBlockBodyContainer = document.createElement('div');
        gridBlockBodyContainer.classList.add('grid-block-body-container');

        var gridBlockDescriptionContainer = document.createElement('div');
        gridBlockDescriptionContainer.classList.add('grid-block-description-container');

        var gridBlockDescriptionText = document.createElement('p');
        gridBlockDescriptionText.classList.add('grid-block-description-text');
        gridBlockDescriptionText.innerHTML = description;

        var gridBlockReasonsContainer = document.createElement('div');
        gridBlockReasonsContainer.classList.add('grid-block-reasons-container', 'no-display', 'faded-out');

        var gridBlockReasonsTitle = document.createElement('p');
        gridBlockReasonsTitle.classList.add('grid-block-reasons-title');
        gridBlockReasonsTitle.innerHTML = "Perustelut";
        gridBlockReasonsContainer.appendChild(gridBlockReasonsTitle);

        var gridBlockReasonsCollapsible = document.createElement('ul');
        gridBlockReasonsCollapsible.classList.add('collapsible');

        for (var j = 0; j < reasons.length; j++) {
            var reasonBlock = document.createElement('li');

            // Open first block by default
            if (j == 0) reasonBlock.classList.add('active');

            var reasonBlockHeader = document.createElement('div');
            reasonBlockHeader.classList.add('collapsible-header', 'waves-effect', 'waves-light');

            // Also add icon accordingly
            // See https://materializecss.com/icons.html for information about icons
            var reasonBlockIcon = document.createElement('i');
            reasonBlockIcon.classList.add('material-icons');
            reasonBlockIcon.innerHTML = (j == 0) ? "remove" : "add";
            reasonBlockHeader.appendChild(reasonBlockIcon);
            reasonBlock.appendChild(reasonBlockHeader);

            var reasonBlockBody = document.createElement('div');
            reasonBlockBody.classList.add('collapsible-body');

            var reasonBlockBodyText = document.createElement('span');
            reasonBlockBodyText.innerHTML = reasons[j];
            reasonBlockBody.appendChild(reasonBlockBodyText);
            reasonBlock.appendChild(reasonBlockBody);

            gridBlockReasonsCollapsible.appendChild(reasonBlock);
        }

        gridBlockReasonsContainer.appendChild(gridBlockReasonsCollapsible);

        var gridBlockFooter = document.createElement('div');
        gridBlockFooter.classList.add('grid-block-footer');
        
        var gridBlockIconsContainer = document.createElement('div');
        gridBlockIconsContainer.classList.add('grid-block-icons-container');

        var gridBlockIcon = document.createElement('div');
        gridBlockIcon.classList.add('grid-block-icon');
        gridBlockIcon.style.backgroundImage = "url('images/" + icon + "')";

        var gridBlockHeartContainer = document.createElement('div');
        gridBlockHeartContainer.classList.add('grid-block-heart-container');

        var gridBlockLikes = document.createElement('div');
        gridBlockLikes.classList.add('grid-block-likes');
        gridBlockLikes.innerHTML = String(likes);

        var gridBlockHeart = document.createElement('div');
        gridBlockHeart.classList.add('grid-block-heart');

        gridBlockHeartContainer.appendChild(gridBlockLikes);
        gridBlockHeartContainer.appendChild(gridBlockHeart);

        gridBlockIconsContainer.appendChild(gridBlockIcon);
        gridBlockIconsContainer.appendChild(gridBlockHeartContainer);

        gridBlockFooter.appendChild(gridBlockIconsContainer);

        // Add elements to DOM
        gridBlockHeaderContainer.appendChild(gridBlockHeaderText);
        gridBlockDescriptionContainer.appendChild(gridBlockDescriptionText);
        gridBlockBodyContainer.appendChild(gridBlockDescriptionContainer);
        gridBlockBodyContainer.appendChild(gridBlockReasonsContainer);

        gridBlockContent.appendChild(gridBlockHeaderContainer);
        gridBlockContent.appendChild(gridBlockBodyContainer);
        gridBlockContent.appendChild(gridBlockFooter);
        gridBlock.appendChild(gridBlockContent);
        
        // Insert at the beginning because there are a couple
        //     of empty grid blocks inside the shuffle container
        //     that make sure that the bottom of the grid looks good.
        shuffleContainer.insertBefore(gridBlock, shuffleContainer.firstChild);

        // Flip the index since we're iterating from end to start
        updateGridBlock(Math.abs(i + 1 - jsonData.length));

        // Add new elements to shuffle
        gridBlocks.unshift(gridBlock);
        shuffleInstance.element.insertBefore(gridBlock, shuffleInstance.element.firstChild);

        ellipsizeElement(gridBlockBodyContainer, gridBlockDescriptionText);

        (function() {
            var idx = i;
            var contentBlock = gridBlockContent;

            contentBlock.onmouseenter = function() {
                var bodyContainers = document.getElementsByClassName('grid-block-body-container');

                // Add a little delay so the mouse can be moved over the blocks without immediately setting everything off
                setTimeout(() => {
                    if (!isMouseInElement(contentBlock)) return;

                    /*
                    for (var j = 0; j < bodyContainers.length; j++) {
                        if (bodyContainers[j].classList.contains('grid-block-body-container-tall')) {
                            console.log("returning"); return;
                        }
                    }
                    */

                    /*
                    if ((idx + 1) % nrColumns == 0) {
                        console.log("Is last");
                    }
                    gridBlocks[idx].classList.remove('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');
                    gridBlocks[idx].classList.add('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
                    's12', 'm6', 'l4', 'xl3'
                    */

                    gridBlocks[idx].classList.remove('m6', 'l4', 'xl3');
                    gridBlocks[idx].classList.add('m12', 'l8', 'xl6');

                    bodyContainers[idx].classList.add('grid-block-body-container-tall');

                    // Fade out all other grid blocks
                    for (var j = 0; j < gridBlocks.length; j++) {
                        if (j == idx) continue;

                        gridBlocks[j].style.opacity = 0.2;
                    }

                    // Update grid block smoothly to avoid clunky animation
                    /*
                    for (var i = 0; i < 150; i += 5) {
                        setTimeout(() => {
                            updateGridBlock(idx);
                        }, i);
                    }*/

                    setTimeout(() => {
                        if (!isMouseInElement(contentBlock)) {
                            bodyContainers[idx].classList.remove('grid-block-body-container-tall');
                            return;
                        }

                        document.getElementsByClassName('grid-block-reasons-container')[idx].classList.remove('no-display');
                        setTimeout(() => {
                            document.getElementsByClassName('grid-block-reasons-container')[idx].classList.remove('faded-out');
                        });
                        updateGridBlocks();

                        // Fade out all other grid blocks
                        for (var j = 0; j < gridBlocks.length; j++) {
                            if (j == idx) continue;

                            gridBlocks[j].style.opacity = 0.2;
                        }
                    }, 150);
                }, 200);
            }

            contentBlock.onmouseleave = function() {
                setTimeout(() => {
                    // The timeout and this check is done because sometimes the
                    //   mouseleave event fires when opening other elements inside the grid block
                    if (isMouseInElement(document.getElementsByClassName('grid-block-content')[idx])) return;

                    var bodyContainers = document.getElementsByClassName('grid-block-body-container');
                    document.getElementsByClassName('grid-block-reasons-container')[idx].classList.add('faded-out');

                    setTimeout(() => {
                        document.getElementsByClassName('grid-block-reasons-container')[idx].classList.add('no-display');

                        /*
                        for (var j = 0; j < bodyContainers.length; j++) {
                            if (j != idx && bodyContainers[j].classList.contains('grid-block-body-container-tall')) {
                                console.log("fuck");
                                return;
                            }
                        }
                        */
    
                        /*
                        gridBlocks[idx].classList.add('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');
                        gridBlocks[idx].classList.remove('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
                        */

                       gridBlocks[idx].classList.add('m6', 'l4', 'xl3');
                       gridBlocks[idx].classList.remove('m12', 'l8', 'xl6');
    
                        bodyContainers[idx].classList.remove('grid-block-body-container-tall');
    
                        // Update grid block smoothly to avoid clunky animation
                        /*
                        for (var i = 0; i < 150; i += 5) {
                            setTimeout(() => {
                                updateGridBlock(idx);
                            }, i);
                        }
                        */
    
                        setTimeout(() => {
                            updateGridBlocks();
                        }, 150);
                    }, 200);
                });
            }
        }());
    }

    // Update shuffle
    shuffleInstance.add(gridBlocks);
    shuffleInstance.update();

    var gridHearts = document.getElementsByClassName('grid-block-heart');
    for (var i = 0; i < gridHearts.length; i++) {
        (function() {
            var idx = i;

            gridHearts[idx].onclick = function() {
                gridHearts[idx].classList.toggle('grid-block-heart-selected');

                var likesText = document.getElementsByClassName('grid-block-likes')[idx];
                var likesCount = parseInt(likesText.innerHTML);

                if (gridHearts[idx].classList.contains('grid-block-heart-selected')) {
                    likesCount++;
                } else {
                    likesCount--;
                }

                // Update HTML and data file
                likesText.innerHTML = String(likesCount);
                $.getJSON("data/data.json", function(result) {
                    var ideaName = document.getElementsByClassName('grid-block-header-text')[idx].innerHTML;

                    // Update likes (there might be better way to do this..)
                    for (var i = 0; i < result.length; i++) {
                        if (Object.keys(result[i])[0] == ideaName) {
                            result[i][ideaName]["likes"] = String(likesCount);
                            break;
                        }
                    }
            
                    // Save to file
                    $.ajax({
                        url: 'php/save_data.php',
                        type: 'POST',     // ../data/data.json because php file is located one dir up
                        data: {"file_path": "../data/data.json", "data": JSON.stringify(result)},
                        success: function(data) {}
                    });
                });
            }
        }());
    }

    updateGridBlocks();
    return;
    setTimeout(() => {
        updateGridBlocks();
    }, 100);
}

function initEvents() {
    var collapsibleHeaders = document.getElementsByClassName('collapsible-header');

    for (var i = 0; i < collapsibleHeaders.length; i++) {
        (function() {
            var idx = i;

            collapsibleHeaders[idx].onclick = function() {
                setTimeout(() => {
                    for (var i = 0; i < collapsibleHeaders.length; i++) {
                        if (collapsibleHeaders[i].parentElement.classList.contains('active')) {
                            collapsibleHeaders[i].firstChild.innerHTML = "remove";
                        } else {
                            collapsibleHeaders[i].firstChild.innerHTML = "add";
                        }
                    }
                });
            }
        }());
    }
}

function ellipsizeElement(container, textElement) {
    var wordArray = textElement.innerHTML.split(' ');

    var iters = 0;
    while(container.clientHeight < container.scrollHeight) {
        wordArray.pop();
        textElement.innerHTML = wordArray.join(' ') + '...';

        if (iters++ >= 100) {
            alert("you are stupidddd");
            break;
        }
    }
}

function updateGridBlocks() {
    for (var i = 0; i < gridBlocks.length; i++) {
        updateGridBlock(i);
    }
    
    shuffleInstance.update();
}

function updateGridBlock(idx) {
    document.getElementsByClassName('grid-block-description-text')[idx].innerHTML = jsonData[idx][Object.keys(jsonData[idx])[0]].description;
    ellipsizeElement(document.getElementsByClassName('grid-block-body-container')[idx], document.getElementsByClassName('grid-block-description-text')[idx]);
}

function isMouseInElement(el) {
    var elX = el.getBoundingClientRect().left;
    var elY = el.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < el.clientWidth - 5 && yDiff < el.clientHeight - 5);
}