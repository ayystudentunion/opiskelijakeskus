/**
 * @file Holds some utility functions for idea page
 * @author Zentryn <https://github.com/Zentryn>
 */

/**
 * Sorts two grid elements by their position attribute
 * @param {HTMLelement} a First element to be sorted
 * @param {HTMLelement} b Second element to be sorted
 */
function sortGridByPosition(a, b) {
    if (a == undefined ||
        b == undefined ||
        a == null ||
        b == null ||
        a.element == undefined ||
        b.element == undefined ||
        a.element == null ||
        b.element == null ||
        a.element.getAttribute('grid-position') == undefined ||
        b.element.getAttribute('grid-position') == undefined ||
        a.element.getAttribute('grid-position') == null ||
        b.element.getAttribute('grid-position') == null
    ) return 0;

    return a.element.getAttribute('grid-position') - b.element.getAttribute('grid-position');
}

/**
 * Sorts two grid elements by their original indices (the order they were loaded in)
 * @param {HTMLelement} a First element to be sorted
 * @param {HTMLelement} b Second element to be sorted
 */
function sortByOriginalIndexFunc(a, b) {
    if (a == undefined ||
        b == undefined ||
        a == null ||
        b == null ||
        a.originalIndex == undefined ||
        b.originalIndex == undefined ||
        a.originalIndex == null ||
        b.originalIndex == null
    ) return 0;

    return a.originalIndex - b.originalIndex;
}

/**
 * Sorts two grid elements by the number of likes they have
 * @param {HTMLelement} a First element to be sorted
 * @param {HTMLelement} b Second element to be sorted
 */
function sortByLikesFunc(a, b) {
    if (a == undefined ||
        b == undefined ||
        a == null ||
        b == null ||
        a.likes == undefined ||
        b.likes == undefined ||
        a.likes == null ||
        b.likes == null
    ) return 0;

    return b.likes - a.likes;
}

/**
 * Collapses an element (animates it to 0 height)
 * @param {HTMLElement} element Element to be collapsed
 */
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
  
/**
 * Expands a collapsed element
 * @param {HTMLElement} element Element to be expanded
 */
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

/**
 * Randomly shuffles around an array
 * @param {Array} a Array to be shuffled
 * @returns Shuffled array
 */
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

/**
 * Replaces all occurances of a string with another string
 * @param {string} search The strings that should be replaced
 * @param {string} replacement The string to replace to
 */
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};