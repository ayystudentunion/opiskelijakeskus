/**
 * @file Handles idea page grid including sorting, filtering, opening and moving ideas around as well as switching pages.
 * @author Zentryn <https://github.com/Zentryn>
 * 
 * @requires ShuffleJS
 * @requires jQuery
 */

var shuffle = require('shufflejs');
var $ = require('jquery');

// Container for grid items
var shuffleContainer = document.getElementById('shuffle-container');

// Elements for ShuffleJS initialization
var element = document.querySelector('#shuffle-container');
var sizer = element.querySelector('.sizer');

// Detect if the user is using Edge browser because an extra element on grid blocks is needed for it for proper shadows
var isBrowserIE = /*@cc_on!@*/false || !!document.documentMode;
var isBrowserEdge = !isBrowserIE && !!window.StyleMedia;

// ShuffleJS instance
var shuffleInstance = null;

// General states and variables
var jsonData = null;
var nrColumns = -1;
var pageButtonsDisabled = false;
var sortByLikes = false;
var maxBlocksInPage = 12;

var gridBlocks = [];
var originalGridBlocks = [];
var currentFilters = [];
var likedIdeas = [];

// Indices, coordinates and counters
var currentPage = 0;
var lastBlockLeaveTime = 0;
var mouseX = -1, mouseY = -1;
var animationDurationsMS = 200;
var lastFilterClickMS = 0;
var lastSortClickMS = 0;

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

// Updates mouse coordinates upon mouse move
window.onmousemove = function(event) {
    if (nrColumns == 1) return;

    mouseX = event.clientX;
    mouseY = event.clientY;
}

// Load ideas from JSON
window.onload = initializeSystems;

/**
 * Initializes all needed systems/components of the page
 */
function initializeSystems() {
    // Firefox leaves checkboxes checked over page refresh so de-select like checkbox here
    if (sortByLikesBtn.checked) {
        sortByLikesBtn.checked = false;
    }

    // Set footer copyright text
    setCopyrightText();

    // Update number of wanted columns in grid
    updateColumnAmount();

    // Init ShuffleJS
    shuffleInstance = new shuffle(element, {
        itemSelector: '.grid-block',
        sizer: sizer,
        staggerAmount: 0,
        staggerAmountMax: 0,
        
        // Disable animations on mobile
        useTransforms: (nrColumns == 1)
    });

    // Get idea data
    $.getJSON("data/data.json", (result) => {
        jsonData = result;

        // Get liked ideas from cookies to prevent like spamming
        var cookie = getCookie("liked_ideas");
        if (cookie != "") {
            likedIdeas = JSON.parse(cookie);
        }

        // Initialize main grid
        initGrid();

        // Set the footer visible after a timeout because if it would
        //   load before the grid, it would show in the wrong place after page load
        setTimeout(() => {
            document.getElementById('page-footer').classList.remove('no-display');
        }, 150);

        // Initialize Materialize (has to be after grid init)
        M.AutoInit();

        // Initialize events for materialize collapsibles
        setTimeout(() => {
            initMaterializeEvents();
        }, 1000);

        // Add filter buttons to DOM and setup their events
        setupFilterButtons();

        // Update text which tells the page that the user is on
        updatePageTexts();
    });
}

// Updates grid blocks after window has been resized
var resizeEndCheck;
window.onresize = function() {
    clearTimeout(resizeEndCheck);

    // After the page hasn't been resized for a small duration, update grid blocks
    resizeEndCheck = setTimeout(() => {
        updateAllGridBlockTexts();
        shuffleInstance.update();
    }, 150);

    updateColumnAmount();
}

// Updates variables that keep track of wanted number of columns in the grid
function updateColumnAmount() {
    // Some hardcoded values from custom Materialize CSS
    if (window.innerWidth < 600) {
        nrColumns = 1;
    } else if (window.innerWidth <= 992) {
        nrColumns = 2;
    } else if (window.innerWidth <= 1550) {
        nrColumns = 3;
    } else {
        nrColumns = 4;
    }

    // Disable all delays on mobile for performance
    if (nrColumns == 1) {
        gridBlockTimeoutsMS = 0;
    } else {
        gridBlockTimeoutsMS = animationDurationsMS;
    }
}

// Sets up DOM filter buttons with events
function setupFilterButtons() {
    // Setup filter dropdown if on mobile
    if (nrColumns == 1) {
        filterButtonsCollapse();
    } else {
        // This is for if the user shrinks the page small enough (after initially being larger)
        filtersTitle.setAttribute('translation-en', 'Close Filters');
        filtersTitle.setAttribute('translation-se', 'Stäng filtrarna');
        filtersTitle.innerHTML = "Sulje Filtterit";
        filtersTitleArrow.innerHTML = "arrow_drop_up";
        translateElement(filtersTitle);
    }

    // Fade out next page buttons if the user is on the last page
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
        filterBtn.setAttribute('translation-en', categoryTranslationsEN[key]);
        filterBtn.setAttribute('translation-se', categoryTranslationsSE[key]);
        filterButtonsContainer.appendChild(filterBtn);
        translateElement(filterBtn);

        (function() {
            var btn = filterBtn;
            var category = key;

            // Set up click event for filter button
            btn.onclick = function(event) {
                var currentMS = performance.now();
                
                // Prevent spamming of buttons
                if (pageButtonsDisabled || (nrColumns == 1 && currentMS - lastFilterClickMS < 1500)) {
                    return event.preventDefault();
                }

                // Store click time for the check above
                lastFilterClickMS = currentMS;

                btn.classList.toggle('selected');

                // Disselect every other button
                for (var i = 0; i < filterButtonsContainer.childElementCount; i++) {
                    if (filterButtonsContainer.children[i].innerHTML == btn.innerHTML) continue;

                    filterButtonsContainer.children[i].classList.remove('selected');
                }

                // Update filter storing variable
                if (currentFilters.indexOf(category) != -1) {
                    currentFilters = [];
                } else {
                    currentFilters = [category];
                }

                // Reset pages when filters change (move to first page)
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

// Updates the mobile filter buttons collapse element
function filterButtonsCollapse() {
    var isCollapsed = filterButtonsContainer.getAttribute('data-collapsed') == 'true';
    
    if (isCollapsed) {
        filtersTitle.innerHTML = "Sulje Filtterit";
        filtersTitle.setAttribute('translation-en', 'Close Filters');
        filtersTitle.setAttribute('translation-se', 'Stäng filtrarna');
        filtersTitleArrow.innerHTML = "arrow_drop_up";
        expandSection(filterButtonsContainer);
        filterButtonsContainer.setAttribute('data-collapsed', 'false');
    } else {
        filtersTitle.setAttribute('translation-en', 'Show Filters');
        filtersTitle.setAttribute('translation-se', 'Visa filtrarna');
        filtersTitle.innerHTML = "Näytä Filtterit";
        filtersTitleArrow.innerHTML = "arrow_drop_down";
        collapseSection(filterButtonsContainer);
    }

    translateElement(filtersTitle);
}

// Setup mobile filter buttons collapse element
filtersDropdown.onclick = filterButtonsCollapse;

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
        }

        translatePage();

        setTimeout(() => {
            for (var i = startIdx; (i < gridBlocks.length) && (i < startIdx + maxBlocksInPage); i++) {
                ellipsizeElement(gridBlocks[i].bodyContainer, gridBlocks[i].descriptionText, gridBlocks[i], true);
            }
        });

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
    // Shuffle ideas around for better diversity
    jsonData = shuffleArr(jsonData);

    var lastColorIdx = -1;
    for (var i = 0; i < jsonData.length; i++) {
        var title = null;
        var title_en = null;
        var title_se = null;
        var description = null;
        var description_en = null;
        var description_se = null;
        var idea_arguments = null;
        var idea_arguments_en = null;
        var idea_arguments_se = null;
        var likes = 0;
        var id = null;
        var primaryCategory = null;
        var secondaryCategories = [];

        var blockObject = {};

        // Get data
        for (var key in jsonData[i]) {
            title = key;
            title_en = jsonData[i][key].name_en;
            title_se = jsonData[i][key].name_se;
            id = jsonData[i][key].id;
            description = jsonData[i][key].description;
            description_en = jsonData[i][key].description_en;
            description_se = jsonData[i][key].description_se;
            idea_arguments = jsonData[i][key].arguments;
            idea_arguments_en = jsonData[i][key].arguments_en;
            idea_arguments_se = jsonData[i][key].arguments_se;
            likes = jsonData[i][key].likes;
            primaryCategory = jsonData[i][key].main_category;
            secondaryCategories = jsonData[i][key].secondary_categories;
        }

        if (title_en == undefined) title_en = "";
        if (title_se == undefined) title_se = "";
        if (description_en == undefined) description_en = "";
        if (description_se == undefined) description_se = "";
        if (idea_arguments_en == undefined) idea_arguments_en = [];
        if (idea_arguments_se == undefined) idea_arguments_se = [];

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
        gridBlockHeaderText.setAttribute('translation-en', title_en);
        gridBlockHeaderText.setAttribute('translation-se', title_se);
        blockObject.headerText = gridBlockHeaderText;

        var gridBlockBodyContainer = document.createElement('div');
        gridBlockBodyContainer.classList.add('grid-block-body-container');
        blockObject.bodyContainer = gridBlockBodyContainer;

        var gridBlockDescriptionContainer = document.createElement('div');
        gridBlockDescriptionContainer.classList.add('grid-block-description-container');

        var gridBlockDescriptionText = document.createElement('p');
        gridBlockDescriptionText.classList.add('grid-block-description-text');
        gridBlockDescriptionText.setAttribute('translation-en', description_en);
        gridBlockDescriptionText.setAttribute('translation-se', description_se);
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
        gridBlockReasonsTitle.setAttribute('translation-en', "Arguments");
        gridBlockReasonsTitle.setAttribute('translation-se', "Argumentationer");
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
            reasonBlockHeader.setAttribute('translation-en', idea_arguments_en[j]);
            reasonBlockHeader.setAttribute('translation-se', idea_arguments_se[j]);
            reasonBlock.appendChild(reasonBlockHeader);
            blockObject.collapsibleHeaders.push(reasonBlockHeader);
            //blockObject.collapsibleIcons.push(reasonBlockIcon);

            var reasonBlockBody = document.createElement('div');
            reasonBlockBody.classList.add('collapsible-body');
            blockObject.reasonBody = reasonBlockBody;

            var reasonBlockBodyText = document.createElement('span');
            reasonBlockBodyText.innerHTML = idea_arguments[j];
            reasonBlockBodyText.setAttribute('translation-en', idea_arguments_en[j]);
            reasonBlockBodyText.setAttribute('translation-se', idea_arguments_se[j]);
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

    translatePage();
    setTimeout(() => {
        $(window).trigger('resize');
    });

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
                event.preventDefault();
                return;
            }

            // Set liked ideas from cookie to be already liked
            if (likedIdeas.indexOf(gridBlockObject.id) != -1) {
                gridBlockObject.heart.firstChild.innerHTML = "favorite";
                gridBlockObject.heart.style.color = "lightcoral";
            }
        }());
    }
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
    fadeOtherGridBlockContents(0.0, blockObject);

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

/**
 * Handles the mouse leaving a grid block
 * 
 * Closes the grid block that the mouse left and fades back in all other grid blocks
 * 
 * @param {HTMLElement} blockObj The grid block that the mouse left
 */
function onBlockMouseLeave(blockObj) {
    if (nrColumns == 1) return;

    var gridPos = blockObj.index;

    // The timeout is here because sometimes when leaving the grid block,
    //   the mouse is still on the edge of the block, but it leaves for sure on the next frame.
    setTimeout(() => {
        // The mouseleave event sometimes fires when opening other elements inside the grid block
        if (isMouseInElement(blockObj.blockContent) || !blockObj.bodyContainer.classList.contains('grid-block-body-container-tall')) return;

        // Fade out needed elements
        blockObj.mainIcon.classList.add('faded-out');
        blockObj.reasonContainer.classList.add('faded-out');

        // Store leave time to prevent new blocks from opening too fast and breaking the grid
        if (blockObj.bodyContainer.classList.contains('grid-block-body-container-tall')) {
            lastBlockLeaveTime = performance.now();
        }

        // Wait for fade animation
        setTimeout(() => {
            // Reset elements to initial states
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

            // Shrink the width of the block
            if (nrColumns > 1) {
                blockObj.block.classList.remove('m12', 'l8', 'xl8', 'xxl6');
                blockObj.block.classList.add('m6', 'l4', 'xl4', 'xxl3');
            }

            // Shrink the height of the block
            blockObj.bodyContainer.classList.remove('grid-block-body-container-tall');
            updateGridBlockText(blockObj.index);

            if (nrColumns > 1) {
                // Update block texts continuously while it closes for smooth-looking animation
                for (var j = 0; j <= 200; j += 20) {
                    setTimeout(() => {
                        shuffleInstance.update();
                        updateGridBlockText(blockObj.index);
                    }, j);
                }
            }

            // Wait for the block to close
            setTimeout(() => {
                // Fade in all other grid blocks
                fadeOtherGridBlockContents(1.0, blockObj);
                
                if (nrColumns == 1) {
                    // Update ShuffleJS to reposition blocks
                    shuffleInstance.update();
                    updateGridBlockText(blockObject.index);
                }
                
                // Re-sort blocks to preserve correct ordering
                if (nrColumns > 1 && (gridPos + 1) % nrColumns == 0) {
                    gridBlocks[gridPos - 1].block.setAttribute('grid-position', gridPos - 1);
                    blockObj.block.setAttribute('grid-position', gridPos);
                    shuffleInstance.sort({compare: sortGridByPosition});
                }

                // Fade icon back in
                blockObj.bigIcon.classList.remove('no-display');
                blockObj.bigIcon.classList.remove('faded-out');
            }, animationDurationsMS);

            // Disable timeouts on mobile
        }, (nrColumns == 1) ? 0 : animationDurationsMS);
    }, (nrColumns == 1) ? 0 : 100);
}

// Initializes Materialize collapsibles
function initMaterializeEvents() {
    var collapsibleHeaders = document.getElementsByClassName('collapsible-header');

    for (var i = 0; i < collapsibleHeaders.length; i++) {
        (function() {
            var idx = i;

            // Setup click events on collapsibles to update arrows
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

/**
 * Fades the contents of all other grid blocks to a desired opacity
 * @param {Number} opacity The desired opacity of the content
 * @param {HTMLElement} blockObject The block object whose content should be faded
 */
function fadeOtherGridBlockContents(opacity, blockObject) {
    if (nrColumns == 1) return;

    var startIdx = currentPage * maxBlocksInPage;
    
    for (var i = startIdx; i < Math.min(startIdx + maxBlocksInPage, gridBlocks.length); i++) {
        if (i == blockObject.index) continue;

        // Go through all children and fade them
        for (var j = 0; j < gridBlocks[i].blockContent.childElementCount; j++) {
            gridBlocks[i].blockContent.children[j].style.opacity = opacity;
        }
    }
}

/**
 * Ellipsizes texts inside a grid block
 * @param {HTMLElement} container Body element of the grid block
 * @param {HTMLElement} textElement Description text element of the block
 * @param {HTMLElement} blockObject The actual block element
 * @param {Boolean} restrictTwoLines Whether to restrict the text element to only two (2) lines
 */
function ellipsizeElement(container, textElement, blockObject, restrictTwoLines) {
    if (container == undefined || textElement == undefined) {
        return;
    }

    var wordArray;

    // Use text according to the language of the page
    var lang = getLang();
    if (lang == "fi") {
        wordArray = textElement.innerHTML.split(' ');
    } else if (lang == "en") {
        wordArray = textElement.getAttribute('translation-en').split(' ');
    } else if (lang == "se") {
        wordArray = textElement.getAttribute('translation-se').split(' ');
    }

    // A failsafe variable that makes sure no infinite loops happen (these happen for some reason occasionally)
    var iters = 0;

    // Ellipsize description text
    if (restrictTwoLines) {
        // Hardcoded height that works for the current font size
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
    
    var titleArray;
    if (lang == "fi") {
        titleArray = blockObject.headerText.innerHTML.split(' ');
    } else if (lang == "en") {
        titleArray = blockObject.headerText.getAttribute('translation-en').split(' ');
    } else if (lang == "se") {
        titleArray = blockObject.headerText.getAttribute('translation-se').split(' ');
    }

    // Ellipsize header text
    while (blockObject.headerContainer.clientHeight > 50) {
        titleArray.pop();
        blockObject.headerText.innerHTML = titleArray.join(' ') + '...';

        if (iters++ >= 100) {
            break;
        }
    }
}

// Updates texts of all current grid blocks
function updateAllGridBlockTexts() {
    var startIdx = currentPage * maxBlocksInPage;

    for (var i = startIdx; (i < gridBlocks.length) && (i < startIdx + maxBlocksInPage); i++) {
        updateGridBlockText(i);
    }
}

/**
 * Updates text of a grid block with a specific index
 * @param {Number} idx The index of the grid block that should be updated
 */
function updateGridBlockText(idx) {
    // First set full texts in the elements
    gridBlocks[idx].descriptionText.innerHTML = gridBlocks[idx].description;
    gridBlocks[idx].headerText.innerHTML = gridBlocks[idx].title;

    // Need to re-translate the elements since the texts were reset
    translateElement(gridBlocks[idx].descriptionText);
    translateElement(gridBlocks[idx].headerText);

    // Ellipsize the texts if they're overflowing the container elements
    ellipsizeElement(
        gridBlocks[idx].bodyContainer,
        gridBlocks[idx].descriptionText,
        gridBlocks[idx],
        !gridBlocks[idx].bodyContainer.classList.contains('grid-block-body-container-tall')
    );
}

/**
 * Checks whether the mouse is currently inside a DOM element
 * @param {HTMLElement} el The element to be checked
 * @returns true if the mouse is inside the element; false otherwise
 */
function isMouseInElement(el) {
    var elX = el.getBoundingClientRect().left;
    var elY = el.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < el.clientWidth - 5 && yDiff < el.clientHeight - 5) && isMouseInShuffleContainer() && !isMouseInCookieInfo();
}

/**
 * Checks whether the mouse is currently inside the shuffle container
 * @returns true if the mouse is inside the shuffle container; false otherwise
 */
function isMouseInShuffleContainer() {
    var elX = shuffleContainer.getBoundingClientRect().left;
    var elY = shuffleContainer.getBoundingClientRect().top;
    var xDiff = mouseX - elX;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && xDiff >= 0 && xDiff < shuffleContainer.clientWidth - 5 && yDiff < shuffleContainer.clientHeight - 5);
}

/**
 * Checks whether the mouse is currently inside the cookie info element
 * @returns true if the mouse is inside the cookie info element; false otherwise
 */
function isMouseInCookieInfo() {
    var cookieInfo = document.getElementsByClassName('cookieinfo')[0];
    if (cookieInfo == undefined || cookieInfo == null) return false;

    var elY = cookieInfo.getBoundingClientRect().top;
    var yDiff = mouseY - elY;

    return (yDiff >= 0 && yDiff < cookieInfo.clientHeight - 5);
}

// Updates grid blocks when filters have changed
function updateGridOnFilterChange() {
    if (currentFilters.length == 0) {
        // Reset blocks if there are no current filters
        gridBlocks = originalGridBlocks;
    } else {
        gridBlocks = [];

        for (var i = 0; i < originalGridBlocks.length; i++) {
            // Get category from grid block to determine if it fits the current filters
            var categories = JSON.parse(originalGridBlocks[i].block.getAttribute('data-groups'));
            
            for (var j = 0; j < categories.length; j++) {
                if (currentFilters.indexOf(categories[j]) != -1) {
                    gridBlocks.push(originalGridBlocks[i]);

                    // Update the grid-position attribute to make grid blocks move correctly when they're opened
                    var blockIdx = gridBlocks.length - 1;
                    gridBlocks[blockIdx].block.setAttribute('grid-position', blockIdx);
                    gridBlocks[blockIdx].index = blockIdx;
                    break;
                }
            }
        }
    }

    // Sort grid blocks
    sortGridBlocksByLikes();
}

// Sorts grid blocks by the amount of likes they have if sorting is enabled, otherwise resets their order
function sortGridBlocksByLikes() {
    if (gridBlocks.length > 0) {
        // Sort by likes if sorting is enabled, otherwise reset the order of the blocks
        var sortFuncToUse = (sortByLikes) ? sortByLikesFunc : sortByOriginalIndexFunc;

        gridBlocks.sort(sortFuncToUse);
        for (var i = 0; i < gridBlocks.length; i++) {
            gridBlocks[i].block.setAttribute('grid-position', i);
            gridBlocks[i].index = i;
        }
    }
}

/**
 * Updates texts next to page buttons
 * @param {Number} currPageIdx Index of the page the user is currently on
 */
function updatePageTexts(currPageIdx = currentPage) {
    var totalPages = Math.floor((gridBlocks.length - 1) / maxBlocksInPage + 1);

    for (var i = 0; i < currentPageTexts.length; i++) {
        currentPageTexts[i].innerHTML = (totalPages == 0) ? 0 : currPageIdx + 1;
    }
    
    for (var i = 0; i < totalPagesTexts.length; i++) {
        totalPagesTexts[i].innerHTML = totalPages;
    }
}