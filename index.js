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

// Load data from JSON
window.onload = function() {
    $.getJSON("data/data.json", function(result) {
        jsonData = result;
        initGrid();
    });

    //ellipsizeElement(document.getElementsByClassName('grid-block-description-container')[0], document.getElementsByClassName('grid-block-description-text')[0]);
};

//Desc container 222px
//block 251

window.onresize = function() {
    updateGridBlocks();
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

    for (var i = 0; i < jsonData.length; i++) {
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

        /*
        <div class="grid-block-description-container">
                        
            <p class="grid-block-description-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <!--
            <p class="grid-block-description-text">Hello WOrld</p>-->
        </div>

        <div class="grid-block-footer">
            <div class="grid-block-icons-container">
                <div class="grid-block-icon"></div>
                
                <div class="grid-block-heart-container">
                    <div class="grid-block-likes">12</div>
                    <div class="grid-block-heart"></div>
                </div>
            </div>
        </div>
        */

        updateGridBlock(gridBlock);

        // Add new elements to shuffle
        gridBlocks.push(gridBlock);
        shuffleInstance.element.insertBefore(gridBlock, shuffleInstance.element.firstChild);

        ellipsizeElement(gridBlockDescriptionContainer, gridBlockDescriptionText);
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
    /*
    for (var i = 0; i < gridBlocks.length; i++) {
        updateGridBlock(gridBlocks[i]);
    }
    */

    var descriptionContainers = document.getElementsByClassName('grid-block-description-container');
    var descriptionTexts = document.getElementsByClassName('grid-block-description-text');
    for (var i = 0; i < descriptionContainers.length; i++) {
        descriptionTexts[i].innerHTML = jsonData[i][Object.keys(jsonData[i])[0]].description;
        ellipsizeElement(descriptionContainers[i], document.getElementsByClassName('grid-block-description-text')[i]);
    }
    
    shuffleInstance.update();
}

function updateGridBlock(gridBlock) {
    //gridBlock.classList.remove('grid-block-tall');
    //gridBlock.classList.remove('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
    //gridBlock.classList.add('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');

    // Expand the block first in height and then in width if its content is overflowing

    /*
    if (gridBlock.clientHeight < gridBlock.scrollHeight) {
        gridBlock.classList.add('grid-block-tall');

        if (gridBlock.clientHeight < gridBlock.scrollHeight) {
            gridBlock.classList.remove('col-xl-3', 'col-lg-4', 'col-md-6', 'col-sm-6');
            gridBlock.classList.add('col-xl-6', 'col-lg-8', 'col-md-12', 'col-sm-12');
        }
    }
    */
}