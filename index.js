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

// Load data from JSON
window.onload = function() {
    $.getJSON("data/data.json", function(result) {
        initGrid(result);
    });
};

window.onresize = function() {
    updateGridBlocks();
}

// Store grid blocks because might have to be resized
var gridBlocks = [];

// Initialize HTML grid
function initGrid(jsonData) {
    // Container for grid items
    var shuffleContainer = document.getElementById('shuffle-container');

    for (var i = 0; i < jsonData.length; i++) {
        var title = null;
        var description = null;

        // Get data
        for (var key in jsonData[i]) {
            title = key;
            description = jsonData[i][key].description;
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
        gridBlockDescriptionText.classList.add('grid-block-header-text');
        gridBlockDescriptionText.innerHTML = description;

        // Add elements to DOM
        gridBlockHeaderContainer.appendChild(gridBlockHeaderText);
        gridBlockDescriptionContainer.appendChild(gridBlockDescriptionText);
        gridBlockContent.appendChild(gridBlockHeaderContainer);
        gridBlockContent.appendChild(gridBlockDescriptionContainer);
        gridBlock.appendChild(gridBlockContent);
        
        // Insert at the beginning because there are a couple
        //     of empty grid blocks inside the shuffle container
        //     that make sure that the bottom of the grid looks good.
        shuffleContainer.insertBefore(gridBlock, shuffleContainer.firstChild);

        updateGridBlock(gridBlock);

        // Add new elements to shuffle
        gridBlocks.push(gridBlock);
        shuffleInstance.element.insertBefore(gridBlock, shuffleInstance.element.firstChild);
    }

    // Update shuffle
    shuffleInstance.add(gridBlocks);
    shuffleInstance.update();
}

function updateGridBlocks() {
    for (var i = 0; i < gridBlocks.length; i++) {
        updateGridBlock(gridBlocks[i]);
    }
    
    shuffleInstance.update();
}

function updateGridBlock(gridBlock) {
    gridBlock.classList.remove('grid-block-tall');
    gridBlock.classList.remove('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
    gridBlock.classList.add('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');

    // Expand the block first in height and then in width if its content is overflowing
    if (gridBlock.clientHeight < gridBlock.scrollHeight) {
        gridBlock.classList.add('grid-block-tall');

        if (gridBlock.clientHeight < gridBlock.scrollHeight) {
            gridBlock.classList.remove('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');
            gridBlock.classList.add('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
        }
    }
}