var shuffle = require('shufflejs');
var $ = require('jquery');

// Container for grid items
var shuffleContainer = document.getElementById('shuffle-container');

// ShuffleJS initialization
var element = document.querySelector('#shuffle-container');
var sizer = element.querySelector('.sizer');

// Internet Explorer 6-11
var isBrowserIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
var isBrowserEdge = !isBrowserIE && !!window.StyleMedia;

var shuffleInstance = null;

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
var animationDurationsMS = 200;

var prevPageBtn = document.getElementById('prev-page-btn');
var nextPageBtn = document.getElementById('next-page-btn');
var sortByLikesBtn = document.getElementById('sort-by-likes-btn');
var filterButtonsContainer = document.getElementById('filter-buttons-container');
var currentPageText = document.getElementById('current-page-text');
var totalPagesText = document.getElementById('total-pages-text');
var filtersDropdown = document.getElementById('filter-buttons-dropdown');
var filtersTitle = document.getElementById('filters-title');
var filtersTitleArrow = document.getElementById('filters-title-arrow');

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

// Store all grid blocks for event handling
var gridBlocks = [];
var originalGridBlocks = [];
var currentFilters = [];

var maxBlocksInPage = null;

window.onmousemove = function(event) {
    if (nrColumns == 1) return;

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

    shuffleInstance = new shuffle(element, {
        itemSelector: '.grid-block',
        sizer: sizer,
        staggerAmount: 0,
        staggerAmountMax: 0,
        useTransforms: (nrColumns == 1)
    });

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

var resizeEndCheck;
window.onresize = function() {
    clearTimeout(resizeEndCheck);
    resizeEndCheck = setTimeout(() => {
        updateAllGridBlockTexts();
        shuffleInstance.update();
    }, 150);

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

    if (nrColumns == 1) {
        gridBlockTimeoutsMS = 0;
    } else {
        gridBlockTimeoutsMS = animationDurationsMS;
    }
}

function setupFilterButtons() {
    // Setup filter dropdown if on mobile
    if (nrColumns == 1) {
        filterButtonsCollapse();
    } else {
        filtersTitle.innerHTML = "Sulje Filtterit";
        filtersTitleArrow.innerHTML = "arrow_drop_up";
    }

    for (var key in categoryIcons) {
        var filterBtn = document.createElement('button');
        filterBtn.classList.add('filter-btn', 'btn', 'waves-effect', 'waves-light');
        filterBtn.innerHTML = key;
        filterButtonsContainer.appendChild(filterBtn);

        (function() {
            var btn = filterBtn;
            var category = key;

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
                    }
                )
            }
        }());
    }
}

filtersDropdown.onclick = function() {
    filterButtonsCollapse();
}

function filterButtonsCollapse() {
    var isCollapsed = filterButtonsContainer.getAttribute('data-collapsed') == 'true';
    
    if (isCollapsed) {
        filtersTitle.innerHTML = "Sulje Filtterit";
        filtersTitleArrow.innerHTML = "arrow_drop_up";
        expandSection(filterButtonsContainer)
        filterButtonsContainer.setAttribute('data-collapsed', 'false')
    } else {
        filtersTitle.innerHTML = "Näytä Filtterit";
        filtersTitleArrow.innerHTML = "arrow_drop_down";
        collapseSection(filterButtonsContainer)
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

    // Get removed blocks and then remove them from shuffle (and DOM)
    var wantedBlocks = gridBlocks.slice(startRemoveIdx, Math.min(startRemoveIdx + maxBlocksInPage, gridBlocks.length));
    var blockElements = [];
    for (var i = 0; i < wantedBlocks.length; i++) {
        blockElements.push(wantedBlocks[i].block);
    }

    shuffleInstance.remove(blockElements);

    // Wait for animation to finish (and add some extra timeout for nicer animation)
    setTimeout(() => {
        afterRemoveFunc();

        var startIdx = wantedIdx * maxBlocksInPage;

        // Add new items to the page and shuffle
        var blocksToAdd = [];
        for (var i = startIdx; (i < gridBlocks.length) && (i < startIdx + maxBlocksInPage); i++) {
            gridBlocks[i].block.classList.add('faded-out');
            shuffleContainer.appendChild(gridBlocks[i].block, shuffleContainer.firstChild);
            shuffleInstance.element.appendChild(gridBlocks[i].block, shuffleInstance.element.firstChild);
            blocksToAdd.push(gridBlocks[i].block);

            ellipsizeElement(gridBlocks[i].bodyContainer, gridBlocks[i].descriptionText, true);
        }

        shuffleInstance.add(blocksToAdd);

        // Fade out button if on the first page
        if (wantedIdx == 0) {
            prevPageBtn.classList.add('faded-out', 'no-events');
        } else {
            prevPageBtn.classList.remove('faded-out', 'no-events');
        }

        // Fade out button if on the last page
        if (((wantedIdx + 2) * maxBlocksInPage) - gridBlocks.length >= maxBlocksInPage) {
            nextPageBtn.classList.add('faded-out', 'no-events');
        } else {
            nextPageBtn.classList.remove('faded-out', 'no-events');
        }

        updatePageTexts(wantedIdx);

        setTimeout(() => {
            currentPage = wantedIdx;

            shuffleInstance.update();

            pageButtonsDisabled = false;

            M.AutoInit();
            initMaterializeEvents();

            for (var i = 0; i < gridBlocks.length; i++) {
                gridBlocks[i].block.classList.remove('faded-out');
            }

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
        var idea_arguments = null;
        var icon = null;
        var likes = 0;
        var primaryCategory = null;
        var secondaryCategories = [];

        var blockObject = {};

        // Get data
        for (var key in jsonData[i]) {
            title = key;
            description = jsonData[i][key].description;
            idea_arguments = jsonData[i][key].arguments;
            icon = jsonData[i][key].icon;
            likes = jsonData[i][key].likes;
            primaryCategory = jsonData[i][key].main_category;
            secondaryCategories = jsonData[i][key].secondary_categories;
        }

        blockObject.likes = likes;
        blockObject.description = description;
        var categoriesText = String(primaryCategory + "," + secondaryCategories);

        // Convert to JSON format
        categoriesText = categoriesText.replaceAll(",", "\",\"");

        // Create elements
        var gridBlock = document.createElement('div');
        gridBlock.classList.add('grid-block', 'col', 's12', 'm6', 'l4', 'xl4', 'xxl3', 'faded-out');

        // Set grid position for sorting
        gridBlock.setAttribute('grid-position', flippedIdx);
        gridBlock.setAttribute('data-groups', '["' + categoriesText + '"]');

        var gridBlockEdgeShadow = document.createElement('div');
        gridBlockEdgeShadow.classList.add('grid-block-edge-shadow');

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

        var gridBlockBigIcon = document.createElement('div');
        gridBlockBigIcon.classList.add('grid-block-icon-big');
        gridBlockBigIcon.style.backgroundImage = "url('images/" + categoryIcons[primaryCategory] + "_musta.png')";
        blockObject.bigIcon = gridBlockBigIcon;

        var gridBlockReasonsContainer = document.createElement('div');
        gridBlockReasonsContainer.classList.add('grid-block-reasons-container', 'no-display', 'faded-out');

        var gridBlockReasonsTitle = document.createElement('p');
        gridBlockReasonsTitle.classList.add('grid-block-reasons-title');
        gridBlockReasonsTitle.innerHTML = "Perustelut";
        gridBlockReasonsContainer.appendChild(gridBlockReasonsTitle);
        blockObject.reasonContainer = gridBlockReasonsContainer;

        var gridBlockReasonsCollapsible = document.createElement('ul');
        gridBlockReasonsCollapsible.classList.add('collapsible');

        if (idea_arguments == null) {
            console.log("Index " + flippedIdx + " has no reasons");
        }

        blockObject.collapsibleHeaders = [];

        for (var j = 0; idea_arguments != null && j < idea_arguments.length; j++) {
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
            reasonBlockBodyText.innerHTML = idea_arguments[j];
            reasonBlockBody.appendChild(reasonBlockBodyText);
            reasonBlock.appendChild(reasonBlockBody);

            gridBlockReasonsCollapsible.appendChild(reasonBlock);
        }

        gridBlockReasonsContainer.appendChild(gridBlockReasonsCollapsible);

        var gridBlockFooter = document.createElement('div');
        gridBlockFooter.classList.add('grid-block-footer');
        
        var gridBlockIconsContainer = document.createElement('div');
        gridBlockIconsContainer.classList.add('grid-block-icons-container');

        var gridBlockCategoryIconsContainer = document.createElement('div');
        gridBlockCategoryIconsContainer.classList.add('grid-block-category-icons-container');

        var mainIcon = document.createElement('div');
        mainIcon.classList.add('grid-block-icon', 'no-display', 'faded-out');
        mainIcon.style.backgroundImage = "url('images/" + categoryIcons[primaryCategory] + "_musta.png')";
        gridBlockCategoryIconsContainer.appendChild(mainIcon);
        blockObject.mainIcon = mainIcon;

        for (var j = 0; j < secondaryCategories.length; j++) {
            var icon = document.createElement('div');
            icon.classList.add('grid-block-icon');
            icon.style.backgroundImage = "url('images/" + categoryIcons[secondaryCategories[j]] + "_musta.png')";
            gridBlockCategoryIconsContainer.appendChild(icon);
        }

        var gridBlockHeartContainer = document.createElement('div');
        gridBlockHeartContainer.classList.add('grid-block-heart-container');

        var gridBlockLikes = document.createElement('div');
        gridBlockLikes.classList.add('grid-block-likes');
        gridBlockLikes.innerHTML = String(likes);
        blockObject.likesText = gridBlockLikes;

        var gridBlockHeart = document.createElement('div');
        gridBlockHeart.classList.add('grid-block-heart');
        gridBlockHeart.innerHTML = "<i class='material-icons'>favorite_border</i>";
        blockObject.heart = gridBlockHeart;

        gridBlockHeartContainer.appendChild(gridBlockLikes);
        gridBlockHeartContainer.appendChild(gridBlockHeart);

        gridBlockIconsContainer.appendChild(gridBlockCategoryIconsContainer);
        gridBlockIconsContainer.appendChild(gridBlockHeartContainer);

        gridBlockFooter.appendChild(gridBlockIconsContainer);

        // Add elements to DOM
        gridBlockHeaderContainer.appendChild(gridBlockHeaderText);
        gridBlockDescriptionContainer.appendChild(gridBlockDescriptionText);
        gridBlockBodyContainer.appendChild(gridBlockDescriptionContainer);
        gridBlockBodyContainer.appendChild(gridBlockBigIcon);
        gridBlockBodyContainer.appendChild(gridBlockReasonsContainer);

        gridBlockContent.appendChild(gridBlockHeaderContainer);
        gridBlockContent.appendChild(gridBlockBodyContainer);
        gridBlockContent.appendChild(gridBlockFooter);

        // Edge doesn't support shadows on table elements,
        //    so add additional element for edge to put shadows on
        if (isBrowserEdge) {
            gridBlockEdgeShadow.appendChild(gridBlockContent);
            gridBlock.appendChild(gridBlockEdgeShadow);
        } else {
            gridBlock.appendChild(gridBlockContent);
        }
        
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

        ellipsizeElement(blockObject.bodyContainer, blockObject.descriptionText, true);

        (function() {
            var idx = flippedIdx;
            var blockObj = blockObject;

            blockObj.blockContent.onmouseenter = function() {
                onBlockMouseEnter(blockObj);
            }

            blockObj.blockContent.onmouseleave = function() {
                if (nrColumns == 1) return;

                var gridPos = blockObj.index;

                // The timeout is here because sometimes when leaving the grid block,
                //   the mouse is still on the edge of the block, but it leaves for sure on the next frame.
                setTimeout(() => {
                    // The mouseleave event sometimes fires when opening other elements inside the grid block
                    if (isMouseInElement(blockObj.blockContent) || !blockObj.bodyContainer.classList.contains('grid-block-body-container-tall')) return;

                    blockObj.mainIcon.classList.add('faded-out');
                    blockObj.reasonContainer.classList.add('faded-out');

                    if (blockObj.bodyContainer.classList.contains('grid-block-body-container-tall')) {
                        lastBlockLeaveTime = performance.now();
                    }

                    setTimeout(() => {
                        blockObj.mainIcon.classList.add('no-display');
                        blockObj.reasonContainer.classList.add('no-display');

                        if (nrColumns > 1) {
                            blockObj.block.classList.remove('m12', 'l8', 'xl8', 'xxl6');
                            blockObj.block.classList.add('m6', 'l4', 'xl4', 'xxl3');
                        }
    
                        blockObj.bodyContainer.classList.remove('grid-block-body-container-tall');
                        updateGridBlockText(blockObj.index);

                        if (nrColumns > 1) {
                            for (var j = 0; j <= 200; j += 20) {
                                setTimeout(() => {
                                    shuffleInstance.update();
                                    updateGridBlockText(blockObj.index);
                                }, j);
                            }
                        }

                        setTimeout(() => {
                            // Fade in all other grid blocks
                            fadeGridBlockContent(1.0, blockObj, true);
                            
                            if (nrColumns == 1) {
                                shuffleInstance.update();
                                updateGridBlockText(blockObject.index);
                            }
                            
                            if (nrColumns > 1 && (gridPos + 1) % nrColumns == 0) {
                                gridBlocks[gridPos - 1].block.setAttribute('grid-position', gridPos - 1);
                                blockObj.block.setAttribute('grid-position', gridPos);
                                shuffleInstance.sort({compare: sortGridByPosition});
                            }

                            blockObj.bigIcon.classList.remove('no-display');
                            blockObj.bigIcon.classList.remove('faded-out');
                        }, animationDurationsMS);
                    }, (nrColumns == 1) ? 0 : animationDurationsMS);
                }, (nrColumns == 1) ? 0 : 100);
            }
        }());
    }

    // Update shuffle
    var blocks = [];
    for (var i = 0; i < Math.min(maxBlocksInPage, gridBlocks.length); i++) {
        blocks.push(gridBlocks[i].block);

        blocks[i].classList.remove('faded-out');
    }

    shuffleInstance.add(blocks);
    shuffleInstance.update();

    for (var i = 0; i < gridBlocks.length; i++) {
        (function() {
            var gridBlockObject = gridBlocks[i];

            gridBlockObject.heart.onclick = function() {
                gridBlockObject.heart.firstChild.innerHTML = (gridBlockObject.heart.firstChild.innerHTML == "favorite") ? "favorite_border" : "favorite";

                var likesText = gridBlockObject.likesText;
                var likesCount = parseInt(likesText.innerHTML);

                if (gridBlockObject.heart.firstChild.innerHTML == "favorite") {
                    gridBlockObject.heart.style.color = "lightcoral";
                    likesCount++;
                } else {
                    gridBlockObject.heart.style.color = null;
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

    // Set the footer visible after a timeout because if it would
    //   load before the grid, it would show in the wrong place after page load
    setTimeout(() => {
        document.getElementById('page-footer').classList.remove('no-display');
    }, 150);
}

function onBlockMouseEnterMobile(blockObject) {
    var startIdx = currentPage * maxBlocksInPage;
    for (var i = startIdx; i < Math.min(startIdx + maxBlocksInPage, gridBlocks.length); i++) {
        if (i == blockObject.index) continue;

        if (gridBlocks[i].bodyContainer.classList.contains('grid-block-body-container-tall')) {
            gridBlocks[i].bodyContainer.classList.remove('grid-block-body-container-tall');
            gridBlocks[i].bigIcon.classList.add('faded-out');
            gridBlocks[i].bigIcon.classList.add('no-display');
            gridBlocks[i].mainIcon.classList.remove('no-display');
            gridBlocks[i].mainIcon.classList.remove('faded-out');
            updateGridBlockText(gridBlocks[i].index);

            gridBlocks[i].reasonContainer.classList.add('no-display', 'faded-out');
            break;
        }
    }

    blockObject.bigIcon.classList.add('faded-out', 'no-display');
    blockObject.mainIcon.classList.remove('no-display');
    blockObject.mainIcon.classList.remove('faded-out');
    blockObject.bodyContainer.classList.add('grid-block-body-container-tall');

    blockObject.reasonContainer.classList.remove('no-display');
    blockObject.reasonContainer.classList.remove('faded-out');

    blockObject.reasonContainer.classList.remove('faded-out');

    shuffleInstance.update();
    updateGridBlockText(blockObject.index);
}

function onBlockMouseEnter(blockObject) {
    if (nrColumns == 1) {
        onBlockMouseEnterMobile(blockObject);
        return;
    }

    if (disableEvents) return;

    var currTime = performance.now();

    // Add 
    if (nrColumns > 1 && currTime - lastBlockEnterTime < 500) {
        return;
    }

    lastBlockEnterTime = currTime;

    blockObject.bigIcon.classList.add('faded-out');

    // Add a little delay so the mouse can be moved over the blocks without immediately setting everything off
    setTimeout(() => {
        // Check that the mouse is still inside the block.
        //   The timing check is here to allow all animations to finish before new ones start.
        if (nrColumns > 1 && (!isMouseInElement(blockObject.blockContent) || disableEvents || performance.now() - lastBlockLeaveTime < 550)) {
            blockObject.bigIcon.classList.remove('faded-out');
            return;
        }

        var isOnEdge = false;
        var colNr = blockObject.index;
        blockObject.bigIcon.classList.add('no-display');
        blockObject.mainIcon.classList.remove('no-display');
        blockObject.mainIcon.classList.remove('faded-out');

        var disableEnter = false;

        // Check if block is on the edge. If it is, it needs to be pushed
        //   one position to the left so it doesn't jump to the next row when it expands
        if (nrColumns > 1 && (colNr + 1) % nrColumns == 0) {
            isOnEdge = true;

            // Swap edge block and the one before it and resort all blocks
            gridBlocks[colNr - 1].block.setAttribute('grid-position', colNr);
            blockObject.block.setAttribute('grid-position', colNr - 1);
            shuffleInstance.sort({compare: sortGridByPosition});
            disableEvents = true;
            disableEnter = true;

            // Wait for transform animation
            setTimeout(() => {
                shuffleInstance.update();
                disableEvents = false;
            }, animationDurationsMS);
        }

        // Timeout so that the edge cases (above) get to update the sorting before they expand
        if (nrColumns > 1) {
            setTimeout(() => {
                blockObject.block.classList.remove('m6', 'l4', 'xl4', 'xxl3');
                blockObject.block.classList.add('m12', 'l8', 'xl8', 'xxl6');
            });
        }

        blockObject.bodyContainer.classList.add('grid-block-body-container-tall');

        // Fade out all other grid blocks
        fadeGridBlockContent(0.0, blockObject);

        // Smooth position animations for grid blocks
        if (nrColumns > 1) {
            for (var j = 0; j <= 200; j += 20) {
                setTimeout(() => {
                    shuffleInstance.update();
                    updateGridBlockText(blockObject.index);
                }, j);
            }
        }

        setTimeout(() => {
            if (nrColumns == 1) {
                shuffleInstance.update();
                updateGridBlockText(blockObject.index);
            }

            blockObject.reasonContainer.classList.remove('no-display');
            setTimeout(() => {
                blockObject.reasonContainer.classList.remove('faded-out');
            });
        }, animationDurationsMS);
    }, gridBlockTimeoutsMS);
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

function fadeGridBlockContent(opacity, blockObject, ellipsize = false) {
    if (nrColumns == 1) return;

    var startIdx = currentPage * maxBlocksInPage;
    
    for (var i = startIdx; i < Math.min(startIdx + maxBlocksInPage, gridBlocks.length); i++) {
        if (i == blockObject.index) continue;

        for (var j = 0; j < gridBlocks[i].blockContent.childElementCount; j++) {
            gridBlocks[i].blockContent.children[j].style.opacity = opacity;
        }
    }
}

function ellipsizeElement(container, textElement, restrictTwoLines) {
    if (container == undefined || textElement == undefined) {
        console.warn("Container or text element was undefined");
        return;
    }

    var wordArray = textElement.innerHTML.split(' ');
    var iters = 0;

    if (restrictTwoLines) {
        while(textElement.clientHeight > 50) {
            wordArray.pop();
            textElement.innerHTML = wordArray.join(' ') + '...';
    
            if (iters++ >= 100) {
                console.log("You fucked up on restricted thing...")
                break;
            }
        }
    } else {
        while(container.clientHeight < container.scrollHeight) {
            wordArray.pop();
            textElement.innerHTML = wordArray.join(' ') + '...';
    
            if (iters++ >= 100) {
                console.log("You fucked up on full thing...");
                break;
            }
        }
    }
}

function updateAllGridBlockTexts() {
    var startIdx = currentPage * maxBlocksInPage;

    for (var i = startIdx; (i < gridBlocks.length) && (i < startIdx + maxBlocksInPage); i++) {
        updateGridBlockText(i);
    }
}

function updateGridBlockText(idx) {
    gridBlocks[idx].descriptionText.innerHTML = gridBlocks[idx].description;

    ellipsizeElement(gridBlocks[idx].bodyContainer, gridBlocks[idx].descriptionText, !gridBlocks[idx].bodyContainer.classList.contains('grid-block-body-container-tall'));
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
    totalPagesText.innerHTML = Math.floor((gridBlocks.length - 1) / maxBlocksInPage + 1);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function collapseSection(element) {
    var sectionHeight = element.scrollHeight;
    
    var elementTransition = element.style.transition;
    element.style.transition = '';

    requestAnimationFrame(function() {
        element.style.height = sectionHeight + 'px';
        element.style.transition = elementTransition;
      
        requestAnimationFrame(function() {
            element.style.height = 0 + 'px';
            element.style.paddingTop = "1px";
        });
    });
    
    element.setAttribute('data-collapsed', 'true');
}
  
function expandSection(element) {
    var sectionHeight = element.scrollHeight;
    
    element.style.height = sectionHeight + 'px';
    element.style.paddingTop = null;
  
    element.addEventListener('transitionend', function(e) {
        element.removeEventListener('transitionend', arguments.callee);
      
        element.style.height = null;
    });
    
    element.setAttribute('data-collapsed', 'false');
}