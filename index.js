var shuffle = require('shufflejs');
var $ = require('jquery');

// Container for grid items
var shuffleContainer = document.getElementById('shuffle-container');

// ShuffleJS initialization
var element = document.querySelector('#shuffle-container');
var sizer = element.querySelector('.sizer');

// Detect Edge because an extra element on grid blocks is needed for it
var isBrowserIE = /*@cc_on!@*/false || !!document.documentMode;
var isBrowserEdge = !isBrowserIE && !!window.StyleMedia;

var shuffleInstance = null;

// General states / variables
var jsonData = null;
var nrColumns = -1;
var pageButtonsDisabled = false;
var sortByLikes = false;
var maxBlocksInPage = null;

var gridBlocks = [];
var originalGridBlocks = [];
var currentFilters = [];
var likedIdeas = [];

// Indices, coordinates and counters
var currentPage = 0;
var lastBlockEnterTime = 0;
var lastBlockLeaveTime = 0;
var lastMouseX = -1, lastMouseY = -1;
var mouseX = -1, mouseY = -1;
var animationDurationsMS = 200;
var lastHeartClickMS = 0;
var lastFilterClickMS = 0;
var lastSortClickMS = 0;
var currentLikeID = 0;

// HTML DOM elements
var formContainer = document.getElementById('form-container');
var formCloseBtn = document.getElementById('form-close-btn');
var prevPageBtns = document.getElementsByClassName('prev-page-btn');
var nextPageBtns = document.getElementsByClassName('next-page-btn');
var sortByLikesBtn = document.getElementById('sort-by-likes-btn');
var filterButtonsContainer = document.getElementById('filter-buttons-container');
var currentPageTexts = document.getElementsByClassName('current-page-text');
var totalPagesTexts = document.getElementsByClassName('total-pages-text');
var filtersDropdown = document.getElementById('filter-buttons-dropdown');
var filtersTitle = document.getElementById('filters-title');
var filtersTitleArrow = document.getElementById('filters-title-arrow');

// Possible colors for grid blocks
var gridBlockColors = [
    "rgb(255, 255, 229)",
    "rgb(254, 244, 113)",
    "rgb(255, 254, 174)"
]

// Update mouse coordinates and check for grid block events
window.onmousemove = function(event) {
    if (nrColumns == 1) return;

    mouseX = event.clientX;
    mouseY = event.clientY;
}

// Load ideas from JSON
window.onload = function() {
    // Firefox leaves checkboxes checked over page refresh
    if (sortByLikesBtn.checked) {
        sortByLikesBtn.checked = false;
    }

    setCopyrightText();

    updateColumnAmount();

    // Init ShuffleJS
    shuffleInstance = new shuffle(element, {
        itemSelector: '.grid-block',
        sizer: sizer,
        staggerAmount: 0,
        staggerAmountMax: 0,
        useTransforms: (nrColumns == 1)
    });

    $.getJSON("data/data.json", function(result) {
        jsonData = result;

        // Get liked ideas from cookies to prevent like spamming
        var cookie = getCookie("liked_ideas");
        if (cookie != "") {
            likedIdeas = JSON.parse(cookie);
        }

        // Initialize main grid
        initGrid();

        // Initialize Materialize (has to be after grid init)
        M.AutoInit();

        // Initialize events for materialize collapsibles
        setTimeout(() => {
            initMaterializeEvents();

           // $(".dropdown-trigger").dropdown();
        }, 1000);

        // Add filter buttons to DOM and setup their events
        setupFilterButtons();

        // Update text which tells the page that the user is on
        updatePageTexts();
    });
};

/* Sorting functions */
function sortGridByPosition(a, b) {
    return a.element.getAttribute('grid-position') - b.element.getAttribute('grid-position');
}

function sortByOriginalIndexFunc(a, b) {
    return a.originalIndex - b.originalIndex;
}

function sortByLikesFunc(a, b) {
    return b.likes - a.likes;
}

// Update texts only after window has stopped resizing for better performance
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
    // Some hardcoded values from custom Materialize CSS
    //   Should possibly be declared somewhere
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

    // Disable all delays on mobile for performance
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
        filtersTitle.setAttribute('translation-en', 'Close Filters');
        filtersTitle.innerHTML = "Sulje Filtterit";
        filtersTitleArrow.innerHTML = "arrow_drop_up";
        translateElement(filtersTitle);
    }

    // Fade out next page button if there are too few ideas
    if ((2 * maxBlocksInPage) - gridBlocks.length >= maxBlocksInPage) {
        for (var i = 0; i < nextPageBtns.length; i++) {
            nextPageBtns[i].classList.add('faded-out', 'no-events');
        }
    }

    for (var key in categoryIcons) {
        // Create button and add to DOM
        var filterBtn = document.createElement('button');
        filterBtn.classList.add('filter-btn', 'simple-btn', 'large-padding', 'center', 'waves-effect', 'waves-light');
        filterBtn.innerHTML = key;
        filterButtonsContainer.appendChild(filterBtn);

        (function() {
            var btn = filterBtn;
            var category = key;

            btn.onclick = function(event) {
                var currentMS = performance.now();
                
                if (pageButtonsDisabled || (nrColumns == 1 && currentMS - lastFilterClickMS < 1500)) {
                    event.preventDefault();
                    return;
                }

                lastFilterClickMS = currentMS;

                btn.classList.toggle('selected');

                // Disselect every other button
                for (var i = 0; i < filterButtonsContainer.childElementCount; i++) {
                    if (filterButtonsContainer.children[i].innerHTML == btn.innerHTML) continue;

                    filterButtonsContainer.children[i].classList.remove('selected');
                }

                if (currentFilters.indexOf(category) != -1) {
                    currentFilters = [];
                } else {
                    currentFilters = [category];
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
                );
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
        filtersTitle.setAttribute('translation-en', 'Close Filters');
        filtersTitleArrow.innerHTML = "arrow_drop_up";
        expandSection(filterButtonsContainer);
        filterButtonsContainer.setAttribute('data-collapsed', 'false');
    } else {
        filtersTitle.setAttribute('translation-en', 'Show Filters');
        filtersTitle.innerHTML = "Näytä Filtterit";
        filtersTitleArrow.innerHTML = "arrow_drop_down";
        collapseSection(filterButtonsContainer);
    }

    translateElement(filtersTitle);
}

formCloseBtn.onclick = function() {
    formContainer.classList.add('no-display');
    document.getElementById('content-title-container').style.borderBottom = "1px solid black";
}

for (var i = 0; i < prevPageBtns.length; i++) {
    (function() {
        var idx = i;
        
        prevPageBtns[i].onclick = function() {
            if (idx == 1 && nrColumns == 1) {
                $(window).scrollTop($('#options-container').position().top);
            }

            moveToPage(currentPage - 1, function(err) {
                // Handle error if needed
            });
        }
    }());
}

for (var i = 0; i < nextPageBtns.length; i++) {
    (function() {
        var idx = i;
        nextPageBtns[idx].onclick = function() {
            if (idx == 1 && nrColumns == 1) {
                $(window).scrollTop($('#options-container').position().top);
            }

            moveToPage(currentPage + 1, function(err) {
                // Handle error if needed
            });
        }
    }());
}

sortByLikesBtn.onclick = function(event) {
    var currentMS = performance.now();
    if (pageButtonsDisabled || (nrColumns == 1 && currentMS - lastSortClickMS < 2000)) {
        event.preventDefault();
        return;
    }

    lastSortClickMS = currentMS;

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

// Changes to wanted page in the grid if possible
function moveToPage(wantedIdx, errorCB, afterRemoveFunc = function() {}, cb = function() {}) {
    if (pageButtonsDisabled) return errorCB("Already switching pages");

    if (wantedIdx < 0) {
        return errorCB("Already at the first page");
    }

    if (wantedIdx != 0 && ((wantedIdx + 1) * maxBlocksInPage) - gridBlocks.length >= maxBlocksInPage) {
        return errorCB("Reached the end of pages");
    }

    pageButtonsDisabled = true;

    // Get removed blocks and then remove them from shuffle (and DOM)
    var blockElements = [];
    var startRemoveIdx = currentPage * maxBlocksInPage;
    var wantedBlocks = gridBlocks.slice(startRemoveIdx, Math.min(startRemoveIdx + maxBlocksInPage, gridBlocks.length));

    for (var i = 0; i < wantedBlocks.length; i++) {
        blockElements.push(wantedBlocks[i].block);
        blockElements[i].classList.add('faded-out');
    }

    // Wait for animation to finish (and add some extra timeout for nicer animation)
    setTimeout(() => {
        for (var i = 0; i < blockElements.length; i++) {
            shuffleContainer.removeChild(blockElements[i]);
        }
        
        // Reset all shuffle items (empty them)
        shuffleInstance.resetItems();
        
        afterRemoveFunc();

        var startIdx = wantedIdx * maxBlocksInPage;

        // Add new items to the page and shuffle
        var blocksToAdd = [];
        for (var i = startIdx; (i < gridBlocks.length) && (i < startIdx + maxBlocksInPage); i++) {
            gridBlocks[i].block.classList.add('faded-out');
            shuffleContainer.appendChild(gridBlocks[i].block, shuffleContainer.firstChild);
            blocksToAdd.push(gridBlocks[i].block);

            ellipsizeElement(gridBlocks[i].bodyContainer, gridBlocks[i].descriptionText, gridBlocks[i], true);
        }

        shuffleInstance.add(blocksToAdd);

        // Fade out button if on the first page
        if (wantedIdx == 0) {
            for (var i = 0; i < prevPageBtns.length; i++) {
                prevPageBtns[i].classList.add('faded-out', 'no-events');
            }
        } else {
            for (var i = 0; i < prevPageBtns.length; i++) {
                prevPageBtns[i].classList.remove('faded-out', 'no-events');
            }
        }

        // Fade out button if on the last page
        if (((wantedIdx + 2) * maxBlocksInPage) - gridBlocks.length >= maxBlocksInPage) {
            for (var i = 0; i < nextPageBtns.length; i++) {
                nextPageBtns[i].classList.add('faded-out', 'no-events');
            }
        } else {
            for (var i = 0; i < nextPageBtns.length; i++) {
                nextPageBtns[i].classList.remove('faded-out', 'no-events');
            }
        }

        updatePageTexts(wantedIdx);

        setTimeout(() => {
            currentPage = wantedIdx;

            pageButtonsDisabled = false;

            // Initialize collapsibles for current page
            M.AutoInit();
            initMaterializeEvents();

            for (var i = 0; i < gridBlocks.length; i++) {
                gridBlocks[i].block.classList.remove('faded-out');
            }

            if (nrColumns > 1) {
                shuffleInstance.update();
            }

            cb();
        }, (nrColumns == 1) ? 0 : 150);
    }, (nrColumns == 1) ? 200 : 400);
}

// Initializes the grid system. Creates all HTML elements for the grid
//   and adds the first page to the DOM and ShuffleJS. All other grid elements are stored.
function initGrid() {
    var likeCounts = [];

    // Shuffle ideas around for better diversity
    jsonData = shuffleArr(jsonData);

    var lastColorIdx = -1;
    for (var i = 0; i < jsonData.length; i++) {
        var title = null;
        var description = null;
        var idea_arguments = null;
        var likes = 0;
        var id = null;
        var primaryCategory = null;
        var secondaryCategories = [];

        var blockObject = {};

        // Get data
        for (var key in jsonData[i]) {
            title = key;
            id = jsonData[i][key].id;
            description = jsonData[i][key].description;
            idea_arguments = jsonData[i][key].arguments;
            likes = jsonData[i][key].likes;
            primaryCategory = jsonData[i][key].main_category;
            secondaryCategories = jsonData[i][key].secondary_categories;
        }

        // Store information that is needed for something else later
        blockObject.id = id;
        blockObject.title = title;
        blockObject.likes = likes;
        blockObject.description = description;
        blockObject.arguments = idea_arguments;
        blockObject.mainCategory = primaryCategory;
        blockObject.secondaryCategories = secondaryCategories;
        blockObject.footerIcons = [];
        blockObject.collapsibleIcons = [];
        var categoriesText = String(primaryCategory + "," + secondaryCategories);

        // Convert to JSON format
        categoriesText = categoriesText.replaceAll(",", "\",\"");

        /* Create all grid elements */
        var gridBlock = document.createElement('div');
        gridBlock.classList.add('grid-block', 'col', 's12', 'm6', 'l4', 'xl4', 'xxl3', 'faded-out');

        // Set grid position for sorting
        gridBlock.setAttribute('grid-position', i);
        gridBlock.setAttribute('data-groups', '["' + categoriesText + '"]');

        var gridBlockEdgeShadow = document.createElement('div');
        gridBlockEdgeShadow.classList.add('grid-block-edge-shadow');

        var gridBlockContent = document.createElement('div');
        gridBlockContent.classList.add('grid-block-content', 'hoverable');
        blockObject.blockContent = gridBlockContent;
        
        // Select a color for the block randomly
        var colorIdx;
        do {
            colorIdx = Math.floor(Math.random() * gridBlockColors.length);
        } while (colorIdx == lastColorIdx);
        lastColorIdx = colorIdx;

        gridBlockContent.style.backgroundColor = gridBlockColors[colorIdx];

        var gridBlockHeaderContainer = document.createElement('div');
        gridBlockHeaderContainer.classList.add('grid-block-header-container');
        blockObject.headerContainer = gridBlockHeaderContainer;

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

        blockObject.collapsibleHeaders = [];

        // Create argument elements
        for (var j = 0; idea_arguments != null && j < idea_arguments.length; j++) {
            var reasonBlock = document.createElement('li');

            // Open first block by default
            if (j == 0) reasonBlock.classList.add('active');

            var reasonBlockHeader = document.createElement('div');
            reasonBlockHeader.classList.add('collapsible-header', 'has-content', 'waves-effect', 'waves-light');
            reasonBlockHeader.style.backgroundColor = gridBlockColors[colorIdx];

            /* The collapsibles are still here if at some point they want to be reverted to */

            // Also add icon accordingly
            // See https://materializecss.com/icons.html for information about icons
            //var reasonBlockIcon = document.createElement('i');
            //reasonBlockIcon.classList.add('material-icons');
            //reasonBlockIcon.innerHTML = (j == 0) ? "arrow_drop_up" : "arrow_drop_down";
            //reasonBlockHeader.appendChild(reasonBlockIcon);
            reasonBlockHeader.innerHTML = idea_arguments[j];
            reasonBlock.appendChild(reasonBlockHeader);
            blockObject.collapsibleHeaders.push(reasonBlockHeader);
            //blockObject.collapsibleIcons.push(reasonBlockIcon);

            var reasonBlockBody = document.createElement('div');
            reasonBlockBody.classList.add('collapsible-body');
            blockObject.reasonBody = reasonBlockBody;

            var reasonBlockBodyText = document.createElement('span');
            reasonBlockBodyText.innerHTML = idea_arguments[j];
            reasonBlockBody.appendChild(reasonBlockBodyText);

            gridBlockReasonsCollapsible.appendChild(reasonBlock);
        }

        gridBlockReasonsContainer.appendChild(gridBlockReasonsCollapsible);

        var gridBlockFooter = document.createElement('div');
        gridBlockFooter.classList.add('grid-block-footer');
        
        var gridBlockIconsContainer = document.createElement('div');
        gridBlockIconsContainer.classList.add('grid-block-icons-container');
        blockObject.iconsContainer = gridBlockIconsContainer;

        var gridBlockCategoryIconsContainer = document.createElement('div');
        gridBlockCategoryIconsContainer.classList.add('grid-block-category-icons-container');

        var mainIcon = document.createElement('div');
        mainIcon.classList.add('grid-block-icon', 'no-display', 'faded-out');
        mainIcon.style.backgroundImage = "url('images/" + categoryIcons[primaryCategory] + "_musta.png')";
        gridBlockCategoryIconsContainer.appendChild(mainIcon);
        blockObject.mainIcon = mainIcon;
        blockObject.footerIcons.push(mainIcon);

        if (secondaryCategories.length > 0 && secondaryCategories[0] != "") {
            for (var j = 0; j < secondaryCategories.length; j++) {
                var icon = document.createElement('div');
                icon.classList.add('grid-block-icon');
                icon.style.backgroundImage = "url('images/" + categoryIcons[secondaryCategories[j]] + "_musta.png')";
                gridBlockCategoryIconsContainer.appendChild(icon);
                blockObject.footerIcons.push(icon);
            }
        }

        var gridBlockHeartContainer = document.createElement('div');
        gridBlockHeartContainer.classList.add('grid-block-heart-container');

        var gridBlockLikes = document.createElement('div');
        gridBlockLikes.classList.add('grid-block-likes');
        gridBlockLikes.innerHTML = String(likes);
        blockObject.likesText = gridBlockLikes;

        var gridBlockHeart = document.createElement('div');
        gridBlockHeart.classList.add('grid-block-heart');

        var gridBlockHeartIcon = document.createElement('i');
        gridBlockHeartIcon.classList.add('material-icons');
        gridBlockHeartIcon.innerHTML = "favorite_border";
        gridBlockHeart.appendChild(gridBlockHeartIcon);
        blockObject.heart = gridBlockHeart;
        blockObject.heartIcon = gridBlockHeartIcon;

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
        blockObject.index = i;
        blockObject.originalIndex = i;
        originalGridBlocks.push(blockObject);
        gridBlocks.push(blockObject);
        
        if (i < maxBlocksInPage) {
            shuffleContainer.appendChild(gridBlock, shuffleContainer.firstChild);

            // Add new element to shuffle
            shuffleInstance.element.appendChild(gridBlock, shuffleInstance.element.firstChild);
        }
        
        // Cut texts in the block if they overflow
        ellipsizeElement(blockObject.bodyContainer, blockObject.descriptionText, blockObject, true);

        (function() {
            var blockObj = blockObject;

            blockObj.bodyContainer.onclick = function() {
                onBlockMouseClick(blockObj);
            }

            blockObj.blockContent.onmouseleave = function() {
                onBlockMouseLeave(blockObj);
            }
        }());
    }

    // Add first page to shuffle and fade the first page in
    var blocks = [];
    for (var i = 0; i < Math.min(maxBlocksInPage, gridBlocks.length); i++) {
        blocks.push(gridBlocks[i].block);

        blocks[i].classList.remove('faded-out');
    }

    shuffleInstance.add(blocks);
    shuffleInstance.update();

    // Setup hearts (liking functionality)
    for (var i = 0; i < gridBlocks.length; i++) {
        (function() {
            var gridBlockObject = gridBlocks[i];

            gridBlockObject.heart.onclick = function(event) {
                var currTimeMS = performance.now();
                if (currTimeMS - lastHeartClickMS < 1000) {
                    event.preventDefault();
                    return;
                }

                lastHeartClickMS = currTimeMS;

                var likeIdx = likedIdeas.indexOf(gridBlockObject.id);
                if (likeIdx == -1) {
                    likedIdeas.push(gridBlockObject.id);
                } else {
                    likedIdeas.splice(likeIdx, 1);
                }

                gridBlockObject.heart.firstChild.innerHTML = (likedIdeas.indexOf(gridBlockObject.id) == -1) ? "favorite_border" : "favorite";

                var likesText = gridBlockObject.likesText;
                var likesCount = parseInt(likesText.innerHTML);
                if (isNaN(likesCount)) {
                    event.preventDefault();
                    return;
                }

                // Update heart color
                var change = 0;
                if (likedIdeas.indexOf(gridBlockObject.id) != -1) {
                    gridBlockObject.heart.style.color = "lightcoral";
                    likesCount++;
                    change = 1;
                } else {
                    gridBlockObject.heart.style.color = null;
                    likesCount--;
                    change = -1;
                }

                // Update HTML and data file
                likesText.innerHTML = String(Math.max(likesCount, 0));
                $.getJSON("data/data.json", function(result) {
                    var ideaName = gridBlockObject.headerText.innerHTML;

                    // Update likes
                    var found = false;
                    for (var i = 0; i < result.length; i++) {
                        var r = result[i][Object.keys(result[i])[0]];
                        if (r == undefined) return;

                        if (r.id == gridBlockObject.id) {
                            result[i][ideaName]["likes"] = Math.max(parseInt(result[i][ideaName]["likes"]) + change, 0);
                            found = true;
                            break;
                        }
                    }

                    if (!found || result == undefined || result == null || result.length == 0) return;
                    
                    // Save to file
                    $.ajax({
                        url: 'php/save_data.php',
                        type: 'POST',     // ../data/data.json because php file is located one dir up
                        data: {"file_path": "../data/data.json", "data": JSON.stringify(result)},
                        success: function(data) {
                            // Save the liked ideas in a cookie to prevent like spamming by using page refresh
                            setCookie("liked_ideas", JSON.stringify(likedIdeas));
                        }
                    });
                });
            }

            // Set liked ideas from cookie to be already liked
            if (likedIdeas.indexOf(gridBlockObject.id) != -1) {
                gridBlockObject.heart.firstChild.innerHTML = "favorite";
                gridBlockObject.heart.style.color = "lightcoral";
            }
        }());
    }

    // Set the footer visible after a timeout because if it would
    //   load before the grid, it would show in the wrong place after page load
    setTimeout(() => {
        document.getElementById('page-footer').classList.remove('no-display');
    }, 150);
}

function closeGridBlockIfOpen(idx) {
    if (gridBlocks[idx].bodyContainer.classList.contains('grid-block-body-container-tall')) {
        gridBlocks[idx].bodyContainer.classList.remove('grid-block-body-container-tall');
        gridBlocks[idx].bigIcon.classList.add('faded-out', 'no-display');
        gridBlocks[idx].bigIcon.classList.remove('faded-out');
        gridBlocks[idx].bigIcon.classList.remove('no-display');
        gridBlocks[idx].mainIcon.classList.add('no-display');
        gridBlocks[idx].mainIcon.classList.add('faded-out');
        updateGridBlockText(gridBlocks[idx].index);

        gridBlocks[idx].reasonContainer.classList.add('no-display', 'faded-out');
    }
}

// Mobile-optimized handling for mouse enter (basically no animations or delays)
function onBlockMouseClickMobile(blockObject) {
    var startIdx = currentPage * maxBlocksInPage;
    for (var i = startIdx; i < Math.min(startIdx + maxBlocksInPage, gridBlocks.length); i++) {
        if (i == blockObject.index) continue;

        closeGridBlockIfOpen(i);
    }

    blockObject.bigIcon.classList.add('faded-out', 'no-display');
    blockObject.mainIcon.classList.remove('no-display');
    blockObject.mainIcon.classList.remove('faded-out');
    blockObject.bodyContainer.classList.add('grid-block-body-container-tall');

    if (blockObject.arguments.length > 0) {
        blockObject.reasonContainer.classList.remove('no-display');
        blockObject.reasonContainer.classList.remove('faded-out');
    }

    shuffleInstance.update();
    updateGridBlockText(blockObject.index);
}

// Handles the mouse entering a grid block
function onBlockMouseClick(blockObject) {
    if (nrColumns == 1) {
        onBlockMouseClickMobile(blockObject);
        return;
    }

    // Do some timing checks because don't want to open a new block before last one is closed
    if (performance.now() - lastBlockLeaveTime < 500) return;
    
    // Enlarge like button so it's easier to click without leaving the block
    for (var i = 0; i < blockObject.footerIcons.length; i++) {
        blockObject.footerIcons[i].style.marginTop = "33px";
    }

    blockObject.likesText.style.fontSize = "21px";
    blockObject.heart.style.width = "50px";
    blockObject.heart.style.height = "50px";
    blockObject.heartIcon.setAttribute('style', 'font-size: 50px !important');
    blockObject.iconsContainer.style.maxHeight = "9000px";

    var colNr = blockObject.index;
    blockObject.bigIcon.classList.add('no-display', 'faded-out');
    blockObject.mainIcon.classList.remove('no-display');
    blockObject.mainIcon.classList.remove('faded-out');

    // Check if block is on the edge. If it is, it needs to be pushed
    //   one position to the left so it doesn't jump to the next row when it expands
    if ((colNr + 1) % nrColumns == 0) {
        // Swap edge block and the one before it and resort all blocks
        gridBlocks[colNr - 1].block.setAttribute('grid-position', colNr);
        blockObject.block.setAttribute('grid-position', colNr - 1);
        shuffleInstance.sort({compare: sortGridByPosition});

        // Wait for transform animation
        setTimeout(() => {
            shuffleInstance.update();
        }, animationDurationsMS);
    }

    // Timeout so that the edge cases (above) get to update the sorting before they expand
    setTimeout(() => {
        blockObject.block.classList.remove('m6', 'l4', 'xl4', 'xxl3');
        blockObject.block.classList.add('m12', 'l8', 'xl8', 'xxl6');
    });

    // Expand vertically
    blockObject.bodyContainer.classList.add('grid-block-body-container-tall');

    // Fade out all other grid blocks
    fadeGridBlockContent(0.0, blockObject);

    // Smooth position animations for grid blocks
    for (var j = 0; j <= 200; j += 20) {
        setTimeout(() => {
            shuffleInstance.update();
            updateGridBlockText(blockObject.index);
        }, j);
    }

    setTimeout(() => {
        if (blockObject.arguments.length > 0) {
            blockObject.reasonContainer.classList.remove('no-display');
            setTimeout(() => {
                blockObject.reasonContainer.classList.remove('faded-out');
            });
        }
    }, animationDurationsMS);
}

// Handles the mouse leaving a grid block
function onBlockMouseLeave(blockObj) {
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
            for (var i = 0; i < blockObj.footerIcons.length; i++) {
                blockObj.footerIcons[i].style.marginTop = null;
            }
    
            blockObj.likesText.style.fontSize = null;
            blockObj.heart.style.width = null;
            blockObj.heart.style.height = null;
            blockObj.heartIcon.style.fontSize = null;
            blockObj.iconsContainer.style.maxHeight = null;

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

function initMaterializeEvents() {
    var collapsibleHeaders = document.getElementsByClassName('collapsible-header');

    for (var i = 0; i < collapsibleHeaders.length; i++) {
        (function() {
            var idx = i;

            collapsibleHeaders[idx].onclick = function() {
                setTimeout(() => {
                    for (var i = 0; i < collapsibleHeaders.length; i++) {
                        if (collapsibleHeaders[i].parentElement.classList.contains('active')) {
                            collapsibleHeaders[i].firstChild.innerHTML = "arrow_drop_up";
                        } else {
                            collapsibleHeaders[i].firstChild.innerHTML = "arrow_drop_down";
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

function ellipsizeElement(container, textElement, blockObject, restrictTwoLines) {
    if (container == undefined || textElement == undefined) {
        return;
    }

    var wordArray = textElement.innerHTML.split(' ');
    var iters = 0;

    if (restrictTwoLines) {
        while(textElement.clientHeight > 50) {
            wordArray.pop();
            textElement.innerHTML = wordArray.join(' ') + '...';
    
            if (iters++ >= 100) {
                break;
            }
        }
    } else {
        while(container.clientHeight < container.scrollHeight) {
            wordArray.pop();
            textElement.innerHTML = wordArray.join(' ') + '...';
    
            if (iters++ >= 100) {
                break;
            }
        }
    }

    iters = 0;
    var titleArray = blockObject.headerText.innerHTML.split(' ');
    while (blockObject.headerContainer.clientHeight > 50) {
        titleArray.pop();
        blockObject.headerText.innerHTML = titleArray.join(' ') + '...';

        if (iters++ >= 100) {
            break;
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
    gridBlocks[idx].headerText.innerHTML = gridBlocks[idx].title;

    ellipsizeElement(gridBlocks[idx].bodyContainer, gridBlocks[idx].descriptionText, gridBlocks[idx], !gridBlocks[idx].bodyContainer.classList.contains('grid-block-body-container-tall'));
}

function isMouseInElement(el) {
    var elX = el.getBoundingClientRect().left;
    var elY = el.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < el.clientWidth - 5 && yDiff < el.clientHeight - 5) && isMouseInShuffleContainer() && !isMouseInCookieInfo();
}

function isMouseInShuffleContainer() {
    var elX = shuffleContainer.getBoundingClientRect().left;
    var elY = shuffleContainer.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < shuffleContainer.clientWidth - 5 && yDiff < shuffleContainer.clientHeight - 5);
}

function isMouseInCookieInfo() {
    var cookieInfo = document.getElementsByClassName('cookieinfo')[0];
    if (cookieInfo == undefined || cookieInfo == null) return false;

    var elY = cookieInfo.getBoundingClientRect().top;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && yDiff < cookieInfo.clientHeight - 5);
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
    if (gridBlocks.length > 0) {
        var sortFuncToUse = (sortByLikes) ? sortByLikesFunc : sortByOriginalIndexFunc;
        gridBlocks.sort(sortFuncToUse);
        for (var i = 0; i < gridBlocks.length; i++) {
            gridBlocks[i].block.setAttribute('grid-position', i);
            gridBlocks[i].index = i;
        }
    }
}

function updatePageTexts(currPageIdx = currentPage) {
    var totalPages = Math.floor((gridBlocks.length - 1) / maxBlocksInPage + 1);

    for (var i = 0; i < currentPageTexts.length; i++) {
        currentPageTexts[i].innerHTML = (totalPages == 0) ? 0 : currPageIdx + 1;
    }
    
    for (var i = 0; i < totalPagesTexts.length; i++) {
        totalPagesTexts[i].innerHTML = totalPages;
    }
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

// Shuffles around array randomly
function shuffleArr(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function arraysEqual(arr1, arr2) {
    if (arr1.length != arr2.length)
        return false;
    for (var i = arr1.length; i--;) {
        if (arr1[i] != arr2[i])
            return false;
    }

    return true;
}