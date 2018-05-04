var shuffle = require('shufflejs');
var $ = require('jquery');

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
        initGrid();
    });
};

//Desc container 222px
//block 251

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
    // Container for grid items
    var shuffleContainer = document.getElementById('shuffle-container');

    for (var i = jsonData.length - 1; i >= 0; i--) {
        var title = null;
        var description = null;
        var icon = null;

        // Get data
        for (var key in jsonData[i]) {
            title = key;
            description = jsonData[i][key].description;
            icon = jsonData[i][key].icon;
        }

        // Create elements
        var gridBlock = document.createElement('div');
        gridBlock.classList.add('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6', 'col-xs-12', 'grid-block');

        var gridBlockContent = document.createElement('div');
        gridBlockContent.classList.add('grid-block-content');

        var gridBlockHeaderContainer = document.createElement('div');
        gridBlockHeaderContainer.classList.add('grid-block-header-container');

        var gridBlockHeaderText = document.createElement('p');
        gridBlockHeaderText.classList.add('grid-block-header-text');
        gridBlockHeaderText.innerHTML = title;

        var gridBlockDescriptionContainer = document.createElement('div');
        gridBlockDescriptionContainer.classList.add('grid-block-description-container');

        var gridBlockDescriptionText = document.createElement('p');
        gridBlockDescriptionText.classList.add('grid-block-description-text');
        gridBlockDescriptionText.innerHTML = description;

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
        gridBlockLikes.innerHTML = "0";

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
        gridBlockContent.appendChild(gridBlockHeaderContainer);
        gridBlockContent.appendChild(gridBlockDescriptionContainer);
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

        ellipsizeElement(gridBlockDescriptionContainer, gridBlockDescriptionText);

        (function() {
            var idx = i;
            var contentBlock = gridBlockContent;

            contentBlock.onmouseenter = function() {
                for (var j = 0; j < gridBlocks.length; j++) {
                    if (gridBlocks[j].classList.contains('grid-block-tall')) {
                        console.log("returning"); return;;
                    }
                }

                // Add a little delay so the mouse can be moved over the blocks without immediately setting everything off
                setTimeout(() => {
                    if (!isMouseInElement(contentBlock)) return;
                    
                    gridBlocks[idx].classList.add('grid-block-tall');

                    /*
                    if ((idx + 1) % nrColumns == 0) {
                        console.log("Is last");
                    }
                    gridBlocks[idx].classList.remove('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');
                    gridBlocks[idx].classList.add('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
                    */

                    document.getElementsByClassName('grid-block-description-container')[idx].classList.add('grid-block-description-container-tall');

                    updateGridBlocks();

                    // Fade out all other grid blocks
                    for (var j = 0; j < gridBlocks.length; j++) {
                        if (j == idx) continue;

                        gridBlocks[j].style.opacity = 0.2;
                    }
                }, 500);
            }

            contentBlock.onmouseleave = function() {
                for (var j = 0; j < gridBlocks.length; j++) {
                    if (j != idx && gridBlocks[j].classList.contains('grid-block-tall')) {
                        return;
                    }
                }

                document.getElementsByClassName('grid-block')[idx].classList.remove('grid-block-tall');

                /*
                gridBlocks[idx].classList.add('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');
                gridBlocks[idx].classList.remove('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
                */

                document.getElementsByClassName('grid-block-description-container')[idx].classList.remove('grid-block-description-container-tall');
                
                updateGridBlocks();
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
    ellipsizeElement(document.getElementsByClassName('grid-block-description-container')[idx], document.getElementsByClassName('grid-block-description-text')[idx]);
}

function isMouseInElement(el) {
    var elX = el.getBoundingClientRect().left;
    var elY = el.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < el.clientWidth - 5 && yDiff < el.clientHeight - 5);
}