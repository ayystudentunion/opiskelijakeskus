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
var pageButtonsDisabled = false;
var sortByLikes = false;

var currentPage = 0;
var currentPageCols = 0;
var lastBlockEnterTime = 0;
var lastBlockLeaveTime = 0;
var lastMouseX = -1, lastMouseY = -1;
var mouseX = -1, mouseY = -1;

var prevPageBtn = document.getElementById('prev-page-btn');
var nextPageBtn = document.getElementById('next-page-btn');
var sortByLikesBtn = document.getElementById('sort-by-likes-btn');
var filterButtonsContainer = document.getElementById('filter-buttons-container');
var currentPageText = document.getElementById('current-page-text');
var totalPagesText = document.getElementById('total-pages-text');

// Store all grid blocks for event handling
var gridBlocks = [];
var originalGridBlocks = [];
var currentFilters = [];

var maxBlocksInPage = null;

window.onmousemove = function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    var startIdx = currentPage * maxBlocksInPage;
    for (var i = startIdx; i < Math.min(startIdx + maxBlocksInPage, gridBlocks.length); i++) {
        if (isMouseInElement(gridBlocks[i].blockContent) && !gridBlocks[i].blockContent.classList.contains('grid-block-body-container-tall')) {
            onBlockMouseEnter(gridBlocks[i]);
        }
    }
}

// Load data from JSON
window.onload = function() {
    setCopyrightText();

    updateColumnAmount();

    currentPageCols = nrColumns;

    $.getJSON("data/data.json", function(result) {
        jsonData = result;

        // Initialize main grid
        initGrid();

        // Initialize Materialize (has to be after grid init)
        M.AutoInit();

        // Initialize events for materialize collapsibles
        setTimeout(() => {
            initMaterializeEvents();
        }, 1000)

        setupFilterButtons();

        updatePageTexts();
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

    // Update max block amount according to the column amount
    maxBlocksInPage = 12;
    maxBlocksInPage -= maxBlocksInPage % nrColumns;
}

function setupFilterButtons() {
    for (var i = 0; i < filterButtonsContainer.childElementCount; i++) {
        (function() {
            var btn = filterButtonsContainer.children[i];
            var category = btn.innerHTML;

            btn.onclick = function(event) {
                if (pageButtonsDisabled) {
                    event.preventDefault();
                    return;
                }

                btn.classList.toggle('selected');

                if (currentFilters.indexOf(category) != -1) {
                    currentFilters.splice(currentFilters.indexOf(category), 1);
                } else {
                    currentFilters.push(category);
                }

                // Reset pages when filters change 
                moveToPage(
                    0,
                    function() {
                        // Handle Error
                    },
                    // Update grid items with new filters
                    function() {
                        updateGridOnFilterChange();
                    },
                    // After finished
                    function() {
                        console.log(gridBlocks);
                        /*
                        if (currentFilters.length > 0) {
                            shuffleInstance.filter(currentFilters);
                        } else {
                            shuffleInstance.filter();
                        }
                        */
                    }
                )
            }
        }());
    }
}

prevPageBtn.onclick = function() {
    moveToPage(currentPage - 1, function(err) {
        // Handle error if needed
    });
}

nextPageBtn.onclick = function() {
    moveToPage(currentPage + 1, function(err) {
        // Handle error if needed
    });
}

function sortByOriginalIndexFunc(a, b) {
    return a.originalIndex - b.originalIndex;
}

function sortByLikesFunc(a, b) {
    return b.likes - a.likes;
}

sortByLikesBtn.onclick = function(event) {
    if (pageButtonsDisabled) {
        event.preventDefault();
        return;
    }

    sortByLikes = !sortByLikes;

    moveToPage(
        0,
        
        function(err) {
            // Handle error
        },

        // Sort blocks after old ones were removed
        function() {
            sortGridBlocksByLikes();
        }
    );
}

function moveToPage(wantedIdx, errorCB, afterRemoveFunc = function() {}, cb = function() {}) {
    if (pageButtonsDisabled) return errorCB("Already switching pages");

    if (wantedIdx < 0) {
        return errorCB("Already at the first page");
    }

    if (((wantedIdx + 1) * maxBlocksInPage) - gridBlocks.length >= maxBlocksInPage) {
        return errorCB("Reached the end of pages");
    }

    pageButtonsDisabled = true;

    var startRemoveIdx = currentPage * maxBlocksInPage;

    var wantedBlocks = gridBlocks.slice(startRemoveIdx, Math.min(startRemoveIdx + maxBlocksInPage, gridBlocks.length));
    var blockElements = [];
    for (var i = 0; i < wantedBlocks.length; i++) {
        blockElements.push(wantedBlocks[i].block);
    }

    shuffleInstance.remove(blockElements);

    // Wait for animation to finish (and add some extra timeout for nicer animation)
    setTimeout(() => {
        afterRemoveFunc();

        console.log(gridBlocks);

        var startIdx = wantedIdx * maxBlocksInPage;

        // Add new items to the page and shuffle
        var blocksToAdd = [];
        for (var i = startIdx; (i < gridBlocks.length) && (i < startIdx + maxBlocksInPage); i++) {
            shuffleContainer.appendChild(gridBlocks[i].block, shuffleContainer.firstChild);
            shuffleInstance.element.appendChild(gridBlocks[i].block, shuffleInstance.element.firstChild);
            blocksToAdd.push(gridBlocks[i].block);
        }

        shuffleInstance.add(blocksToAdd);

        if (wantedIdx == 0) {
            prevPageBtn.classList.add('faded-out', 'no-events');
        } else {
            prevPageBtn.classList.remove('faded-out', 'no-events');
        }

        if (((wantedIdx + 2) * maxBlocksInPage) - gridBlocks.length >= maxBlocksInPage) {
            nextPageBtn.classList.add('faded-out', 'no-events');
        } else {
            nextPageBtn.classList.remove('faded-out', 'no-events');
        }

        updatePageTexts(wantedIdx);

        setTimeout(() => {
            currentPage = wantedIdx;

            updateGridBlocks();

            pageButtonsDisabled = false;

            M.AutoInit();
            initMaterializeEvents();

            cb();
        }, 150);
    }, 400);
}

// Initializes the grid system. Creates all HTML elements for the grid
//   and adds the first page to the DOM and ShuffleJS. All other grid elements are stored.
function initGrid() {
    var likeCounts = [];

    for (var i = jsonData.length - 1; i >= 0; i--) {
        var flippedIdx = Math.abs((i + 1) - jsonData.length);

        var title = null;
        var description = null;
        var reasons = null;
        var icon = null;
        var likes = 0;
        var category = null;

        var blockObject = {};

        // Get data
        for (var key in jsonData[i]) {
            title = key;
            description = jsonData[i][key].description;
            reasons = jsonData[i][key].reasons;
            icon = jsonData[i][key].icon;
            likes = jsonData[i][key].likes;
            category = jsonData[i][key].category;
        }

        blockObject.likes = likes;
        blockObject.description = description;

        // Create elements
        var gridBlock = document.createElement('div');
        gridBlock.classList.add('grid-block', 'col', 's12', 'm6', 'l4', 'xl4', 'xxl3');

        // Set grid position for sorting
        gridBlock.setAttribute('grid-position', flippedIdx);
        gridBlock.setAttribute('data-groups', '["' + category + '"]');

        var gridBlockContent = document.createElement('div');
        gridBlockContent.classList.add('grid-block-content', 'hoverable');
        blockObject.blockContent = gridBlockContent;

        var gridBlockHeaderContainer = document.createElement('div');
        gridBlockHeaderContainer.classList.add('grid-block-header-container');

        var gridBlockHeaderText = document.createElement('p');
        gridBlockHeaderText.classList.add('grid-block-header-text');
        gridBlockHeaderText.innerHTML = title;
        blockObject.headerText = gridBlockHeaderText;

        var gridBlockBodyContainer = document.createElement('div');
        gridBlockBodyContainer.classList.add('grid-block-body-container');
        blockObject.bodyContainer = gridBlockBodyContainer;

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
        blockObject.reasonContainer = gridBlockReasonsContainer;

        var gridBlockReasonsCollapsible = document.createElement('ul');
        gridBlockReasonsCollapsible.classList.add('collapsible');

        if (reasons == null) {
            console.log("Index " + flippedIdx + " has no reasons");
        }

        blockObject.collapsibleHeaders = [];

        for (var j = 0; reasons != null && j < reasons.length; j++) {
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
            blockObject.collapsibleHeaders.push(reasonBlockHeader);

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
        blockObject.likesText = gridBlockLikes;

        var gridBlockHeart = document.createElement('div');
        gridBlockHeart.classList.add('grid-block-heart');
        blockObject.heart = gridBlockHeart;

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
        
        blockObject.descriptionText = gridBlockDescriptionText;
        blockObject.block = gridBlock;
        blockObject.index = flippedIdx;
        blockObject.originalIndex = flippedIdx;
        originalGridBlocks.push(blockObject);
        gridBlocks.push(blockObject);
        
        if (flippedIdx < maxBlocksInPage) {
            shuffleContainer.appendChild(gridBlock, shuffleContainer.firstChild);

            // Add new element to shuffle
            shuffleInstance.element.appendChild(gridBlock, shuffleInstance.element.firstChild);
        }

        (function() {
            var idx = flippedIdx;
            var blockObj = blockObject;

            blockObj.blockContent.onmouseenter = function() {
                onBlockMouseEnter(blockObj);
            }

            blockObj.blockContent.onmouseleave = function() {
                var gridPos = blockObj.index;

                // The timeout is here because sometimes when leaving the grid block,
                //   the mouse is still on the edge of the block, but it leaves for sure on the next frame.
                setTimeout(() => {
                    // The mouseleave event sometimes fires when opening other elements inside the grid block
                    if (isMouseInElement(blockObj.blockContent) || !blockObj.bodyContainer.classList.contains('grid-block-body-container-tall')) {
                        console.log("Was still in ");
                        return;
                    }

                    blockObj.reasonContainer.classList.add('faded-out');

                    if (blockObj.bodyContainer.classList.contains('grid-block-body-container-tall')) {
                        lastBlockLeaveTime = performance.now();
                    }

                    setTimeout(() => {
                        blockObj.reasonContainer.classList.add('no-display');

                        blockObj.block.classList.add('m12', 'l8', 'xl8', 'xxl6');
                        blockObj.block.classList.remove('m12', 'l8', 'xl8', 'xxl6');
    
                        blockObj.bodyContainer.classList.remove('grid-block-body-container-tall');
    
                        setTimeout(() => {
                            updateGridBlocks();

                            // Fade in all other grid blocks
                            fadeGridBlockContent(1.0, blockObj);
                            
                            if (nrColumns > 1 && (gridPos + 1) % nrColumns == 0) {
                                gridBlocks[gridPos - 1].block.setAttribute('grid-position', gridPos - 1);
                                blockObj.block.setAttribute('grid-position', gridPos);
                                shuffleInstance.sort({compare: sortGridByPosition});
                            }
                        }, 150);
                    }, 200);
                });
            }
        }());
    }

    // Update shuffle
    var blocks = [];
    for (var i = 0; i < maxBlocksInPage; i++) {
        blocks.push(gridBlocks[i].block);
    }

    shuffleInstance.add(blocks);
    shuffleInstance.update();

    for (var i = 0; i < gridBlocks.length; i++) {
        (function() {
            var gridBlockObject = gridBlocks[i];

            gridBlockObject.heart.onclick = function() {
                gridBlockObject.heart.classList.toggle('grid-block-heart-selected');

                var likesText = gridBlockObject.likesText;
                var likesCount = parseInt(likesText.innerHTML);

                if (gridBlockObject.heart.classList.contains('grid-block-heart-selected')) {
                    likesCount++;
                } else {
                    likesCount--;
                }

                // Update HTML and data file
                likesText.innerHTML = String(likesCount);
                $.getJSON("data/data.json", function(result) {
                    var ideaName = gridBlockObject.headerText.innerHTML;

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

        // Setting the footer visible here because if it would load before the grid,
        //   it would show in the wrong place after page load
        document.getElementById('page-footer').classList.remove('no-display');
    }, 150);
}

function onBlockMouseEnter(blockObject) {
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
        if (!isMouseInElement(blockObject.blockContent) || disableEvents || performance.now() - lastBlockLeaveTime < 550) return;

        var isOnEdge = false;
        var colNr = blockObject.index;

        // Check if block is on the edge. If it is, it needs to be pushed
        //   one position to the left so it doesn't jump to the next row when it expands
        if (nrColumns > 1 && (colNr + 1) % nrColumns == 0) {
            isOnEdge = true;

            // Swap edge block and the one before it and resort all blocks
            gridBlocks[colNr - 1].block.setAttribute('grid-position', colNr);
            blockObject.block.setAttribute('grid-position', colNr - 1);
            shuffleInstance.sort({compare: sortGridByPosition});
            disableEvents = true;

            // Wait for transform animation
            setTimeout(() => {
                updateGridBlocks();
                disableEvents = false;
            }, 250);
        }

        // Timeout so that the edge cases (above) get to update the sorting before they expand
        setTimeout(() => {
            blockObject.block.classList.remove('m12', 'l8', 'xl8', 'xxl6');
            blockObject.block.classList.add('m12', 'l8', 'xl8', 'xxl6');
        });

        blockObject.bodyContainer.classList.add('grid-block-body-container-tall');

        // Fade out all other grid blocks
        fadeGridBlockContent(0.0, blockObject);

        setTimeout(() => {
            // Update edge block (events are disabled only on edge block cases)
            if (!disableEvents || (disableEvents && isOnEdge)) {
                blockObject.reasonContainer.classList.remove('no-display');
                setTimeout(() => {
                    blockObject.reasonContainer.classList.remove('faded-out');
                });
            }

            if (disableEvents) return;

            // Mouse is no longer inside the block; revert
            if (!isMouseInElement(blockObject.blockContent)) {
                blockObject.bodyContainer.classList.remove('grid-block-body-container-tall');
                return;
            }

            updateGridBlocks();
        }, 150);
    }, 150);
}

function initMaterializeEvents() {
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

function fadeGridBlockContent(opacity, blockObject) {
    var startIdx = currentPage * maxBlocksInPage;
    
    for (var i = startIdx; i < Math.min(startIdx + maxBlocksInPage, gridBlocks.length); i++) {
        if (i == blockObject.index) continue;

        for (var j = 0; j < gridBlocks[i].blockContent.childElementCount; j++) {
            gridBlocks[i].blockContent.children[j].style.opacity = opacity;
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
    var startIdx = currentPage * maxBlocksInPage;

    for (var i = startIdx; (i < gridBlocks.length) && (i < startIdx + maxBlocksInPage); i++) {
        updateGridBlock(i);
    }
    
    shuffleInstance.update();
}

function updateGridBlock(idx) {
    gridBlocks[idx].descriptionText.innerHTML = gridBlocks[idx].description;
    ellipsizeElement(gridBlocks[idx].bodyContainer, gridBlocks[idx].descriptionText);
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

function setCopyrightText() {
    var copyrightTextEl = document.getElementById('copyright_text');
    var createdYear = 2018;
    var currentYear = new Date().getFullYear();

    // Update copyright text year span according to the current year
    var yearText = String(createdYear) + ((currentYear != createdYear) ? ("-" + String(currentYear)) : "");

    copyrightTextEl.innerHTML = "Copyright © " + yearText + " <a href='https://ayy.fi' target='_blank'>Aalto University Student Union</a>";
}

function updateGridOnFilterChange() {
    if (currentFilters.length == 0) {
        gridBlocks = originalGridBlocks;
    } else {
        gridBlocks = [];

        for (var i = 0; i < originalGridBlocks.length; i++) {
            // Get category from grid block to determine if it fits the current filters
            var categories = JSON.parse(originalGridBlocks[i].block.getAttribute('data-groups'));
            
            for (var j = 0; j < categories.length; j++) {
                if (currentFilters.indexOf(categories[j]) != -1) {
                    gridBlocks.push(originalGridBlocks[i]);

                    var blockIdx = gridBlocks.length - 1;
                    gridBlocks[blockIdx].block.setAttribute('grid-position', blockIdx);
                    gridBlocks[blockIdx].index = blockIdx;
                    break;
                }
            }
        }
    }

    // Sort
    sortGridBlocksByLikes();
}

function sortGridBlocksByLikes() {
    var sortFuncToUse = (sortByLikes) ? sortByLikesFunc : sortByOriginalIndexFunc;
    gridBlocks.sort(sortFuncToUse);
    for (var i = 0; i < gridBlocks.length; i++) {
        gridBlocks[i].block.setAttribute('grid-position', i);
        gridBlocks[i].index = i;
    }
}

function updatePageTexts(currPageIdx = currentPage) {
    currentPageText.innerHTML = currPageIdx + 1;
    totalPagesText.innerHTML = Math.floor(gridBlocks.length / maxBlocksInPage + 1);
}