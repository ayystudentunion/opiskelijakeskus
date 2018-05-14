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
var disableEvents = false;

var currentPage = 0;
var lastBlockEnterTime = 0;
var lastBlockLeaveTime = 0;
var lastMouseX = -1, lastMouseY = -1;
var mouseX = -1, mouseY = -1;

// Store grid blocks because might have to be resized
var gridBlocks = [];
var descriptionTexts = [];
var bodyContainers = [];
var reasonContainers = [];
var hearts = [];
var likesTexts = [];
var headerTexts = [];

var maxBlocksInPage = null;

window.onmousemove = function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    var contentBlocks = document.getElementsByClassName('grid-block-content');
    for (var i = 0; i < contentBlocks.length; i++) {
        if (isMouseInElement(contentBlocks[i]) && !document.getElementsByClassName('grid-block-body-container')[i].classList.contains('grid-block-body-container-tall')) {
            onBlockMouseEnter(contentBlocks[i], i);
        }
    }
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

function sortGridByPosition(a, b) {
    return a.element.getAttribute('grid-position') - b.element.getAttribute('grid-position');
}

window.onresize = function() {
    updateGridBlocks();

    updateColumnAmount();
}

function updateColumnAmount() {
    if (window.innerWidth < 600) {
        nrColumns = 1;
    } else if (window.innerWidth <= 992) {
        nrColumns = 2;
    } else if (window.innerWidth <= 1550) {
        nrColumns = 3;
    } else {
        nrColumns = 4;
    }

    console.log(nrColumns);

    // Update max block amount according to the column amount
    maxBlocksInPage = 16;
    maxBlocksInPage -= maxBlocksInPage % nrColumns;
}

document.getElementById('magicbutton').onclick = function() {
    updateGridBlocks();
}

// Initialize HTML grid
function initGrid() {
    for (var i = jsonData.length - 1; i >= 0; i--) {
        var flippedIdx = Math.abs((i + 1) - jsonData.length);

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
        gridBlock.classList.add('grid-block', 'col', 's12', 'm6', 'l4', 'xl4', 'xxl3');

        // Set grid position for sorting
        gridBlock.setAttribute('grid-position', flippedIdx);

        var gridBlockContent = document.createElement('div');
        gridBlockContent.classList.add('grid-block-content');

        var gridBlockHeaderContainer = document.createElement('div');
        gridBlockHeaderContainer.classList.add('grid-block-header-container');

        var gridBlockHeaderText = document.createElement('p');
        gridBlockHeaderText.classList.add('grid-block-header-text');
        gridBlockHeaderText.innerHTML = title;
        headerTexts.push(gridBlockHeaderText);

        var gridBlockBodyContainer = document.createElement('div');
        gridBlockBodyContainer.classList.add('grid-block-body-container');
        bodyContainers.push(gridBlockBodyContainer);

        var gridBlockDescriptionContainer = document.createElement('div');
        gridBlockDescriptionContainer.classList.add('grid-block-description-container');

        var gridBlockDescriptionText = document.createElement('p');
        gridBlockDescriptionText.classList.add('grid-block-description-text');
        gridBlockDescriptionText.innerHTML = description;

        var gridBlockReasonsContainer = document.createElement('div');
        gridBlockReasonsContainer.classList.add('grid-block-reasons-container', 'no-display', 'faded-out');
        reasonContainers.push(gridBlockReasonsContainer);

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
        likesTexts.push(gridBlockLikes);

        var gridBlockHeart = document.createElement('div');
        gridBlockHeart.classList.add('grid-block-heart');
        hearts.push(gridBlockHeart);

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
        descriptionTexts.push(gridBlockDescriptionText);

        gridBlocks.push(gridBlock);
        
        if (flippedIdx < maxBlocksInPage) {
            // Insert at the beginning because there are a couple
            //     of empty grid blocks inside the shuffle container
            //     that make sure that the bottom of the grid looks good.
            shuffleContainer.appendChild(gridBlock, shuffleContainer.firstChild);

            // Add new elements to shuffle
            shuffleInstance.element.appendChild(gridBlock, shuffleInstance.element.firstChild);
        }

        (function() {
            var idx = flippedIdx;
            var contentBlock = gridBlockContent;

            contentBlock.onmouseenter = function() {
                onBlockMouseEnter(contentBlock, idx);
            }

            contentBlock.onmouseleave = function() {
                var gridPos = parseInt(gridBlocks[idx].getAttribute('grid-position'));

                if (disableEvents && !((gridPos + 2) % nrColumns == 0 && (idx + 2) % nrColumns != 0)) return;

                // The timeout is here because sometimes when leaving the grid block,
                //   the mouse is still on the edge of the block, but it leaves for sure on the next frame.
                setTimeout(() => {
                    // The mouseleave event sometimes fires when opening other elements inside the grid block
                    if (isMouseInElement(contentBlock) || !bodyContainers[idx].classList.contains('grid-block-body-container-tall')) {
                        if (isMouseInElement(contentBlock)) {
                            console.log("in it");
                        }
                        return;
                    }

                    reasonContainers[idx].classList.add('faded-out');

                    if (bodyContainers[idx].classList.contains('grid-block-body-container-tall')) {
                        lastBlockLeaveTime = performance.now();
                    }

                    setTimeout(() => {
                        reasonContainers[idx].classList.add('no-display');

                        gridBlocks[idx].classList.add('m12', 'l8', 'xl8', 'xxl6');
                        gridBlocks[idx].classList.remove('m12', 'l8', 'xl8', 'xxl6');
    
                        bodyContainers[idx].classList.remove('grid-block-body-container-tall');
    
                        setTimeout(() => {
                            updateGridBlocks();

                            // Fade in all other grid blocks
                            fadeGridBlockContent(1.0, idx);
                            
                            if (nrColumns > 1 && (gridPos + 2) % nrColumns == 0 && (idx + 2) % nrColumns != 0) {
                                gridBlocks[idx - 1].setAttribute('grid-position', gridPos);
                                gridBlocks[idx].setAttribute('grid-position', gridPos + 1);
                                shuffleInstance.sort({compare: sortGridByPosition});
                            }
                        }, 150);
                    }, 200);
                });
            }
        }());
    }

    // Update shuffle
    shuffleInstance.add(gridBlocks);
    shuffleInstance.update();

    for (var i = 0; i < hearts.length; i++) {
        (function() {
            var idx = i;

            hearts[idx].onclick = function() {
                hearts[idx].classList.toggle('grid-block-heart-selected');

                var likesText = likesTexts[idx];
                var likesCount = parseInt(likesText.innerHTML);

                if (hearts[idx].classList.contains('grid-block-heart-selected')) {
                    likesCount++;
                } else {
                    likesCount--;
                }

                // Update HTML and data file
                likesText.innerHTML = String(likesCount);
                $.getJSON("data/data.json", function(result) {
                    var ideaName = headerTexts[idx].innerHTML;

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

    setTimeout(() => {
        updateGridBlocks();
    }, 200);
}

function onBlockMouseEnter(contentBlock, idx) {
    var currTime = performance.now();

    // Add 
    if (currTime - lastBlockEnterTime < 500) {
        return;
    }

    lastBlockEnterTime = currTime;

    // Add a little delay so the mouse can be moved over the blocks without immediately setting everything off
    setTimeout(() => {
        // Check that the mouse is still inside the block.
        //   The timing check is here to allow all animations to finish before new ones start.
        if (!isMouseInElement(contentBlock) || disableEvents || performance.now() - lastBlockLeaveTime < 550) return;

        var isOnEdge = false;
        var colNr = parseInt(gridBlocks[idx].getAttribute('grid-position'));

        // Check if block is on the edge. If it is, it needs to be pushed
        //   one position to the left so it doesn't jump to the next row when it expands
        if (nrColumns > 1 && (colNr + 1) % nrColumns == 0) {
            isOnEdge = true;

            // Swap edge block and the one before it and resort all blocks
            gridBlocks[idx - 1].setAttribute('grid-position', colNr);
            gridBlocks[idx].setAttribute('grid-position', colNr - 1);
            shuffleInstance.sort({compare: sortGridByPosition});
            disableEvents = true;

            // Wait for transform animation
            setTimeout(() => {
                updateGridBlocks();
                disableEvents = false;

                // Fade out all other grid blocks
                fadeGridBlockContent(0.0, idx);
            }, 250);
        }

        // Timeout so that the edge cases (above) get to update the sorting before they expand
        setTimeout(() => {
            gridBlocks[idx].classList.remove('m12', 'l8', 'xl8', 'xxl6');
            gridBlocks[idx].classList.add('m12', 'l8', 'xl8', 'xxl6');
        });

        bodyContainers[idx].classList.add('grid-block-body-container-tall');

        // Fade out all other grid blocks
        fadeGridBlockContent(0.0, idx);

        setTimeout(() => {
            // Update edge block (events are disabled only on edge block cases)
            if (!disableEvents || (disableEvents && isOnEdge)) {
                reasonContainers[idx].classList.remove('no-display');
                setTimeout(() => {
                    reasonContainers[idx].classList.remove('faded-out');
                });
            }

            if (disableEvents) return;

            // Mouse is no longer inside the block; revert
            if (!isMouseInElement(contentBlock)) {
                bodyContainers[idx].classList.remove('grid-block-body-container-tall');
                return;
            }

            // Fade out all other grid blocks
            fadeGridBlockContent(0.0, idx);

            updateGridBlocks();
        }, 150);
    }, 150);
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

function fadeGridBlockContent(opacity, idx) {
    for (var i = 0; i < document.getElementsByClassName('grid-block-content').length; i++) {
        if (i == idx) continue;

        for (var j = 0; j < document.getElementsByClassName('grid-block-content')[i].childElementCount; j++) {
            document.getElementsByClassName('grid-block-content')[i].children[j].style.opacity = opacity;
        }
    }
}

function ellipsizeElement(container, textElement) {
    if (container == undefined || textElement == undefined) return;

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
    descriptionTexts[idx].innerHTML = jsonData[idx][Object.keys(jsonData[idx])[0]].description;
    ellipsizeElement(document.getElementsByClassName('grid-block-body-container')[idx], document.getElementsByClassName('grid-block-description-text')[idx]);
}

function isMouseInElement(el) {
    var elX = el.getBoundingClientRect().left;
    var elY = el.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < el.clientWidth - 5 && yDiff < el.clientHeight - 5) && isMouseInShuffleContainer();
}

function isMouseInShuffleContainer() {
    var elX = shuffleContainer.getBoundingClientRect().left;
    var elY = shuffleContainer.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < shuffleContainer.clientWidth - 5 && yDiff < shuffleContainer.clientHeight - 5);
}