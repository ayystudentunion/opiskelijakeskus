/**
 * @file Translates all elements in page that have a translation attribute according to the current langauge of the page
 * @author Zentryn <https://github.com/Zentryn>
 */

// Get all elements that are set to be translated
var setLanguageFiEls = document.getElementsByClassName('set-language-fi');
var setLanguageEnEls = document.getElementsByClassName('set-language-en');
var setLanguageSeEls = document.getElementsByClassName('set-language-se');

// Translates all elements in the page set to be translated
function translatePage() {
    // English
    if (currentLang == "en") {
        // Go through each element that is set to be translated and translate them
        var translateEnEls = document.querySelectorAll('[translation-en]');
        for (var i = 0; i < translateEnEls.length; i++) {
            translateElement(translateEnEls[i]);
        }

        // Cookie info element is loaded dynamically from 3rd party library so update it manually here
        //     there is only english cookie translation at the moment.
        $(".cookieinfo").children().each(function () {
            $(this).html($(this).html().replace(
                "Käytämme evästeitä parantaaksemme sivuston toiminnallisuutta. Käyttämällä sivustoamme hyväksyt evästeiden käytön.",
                "We use cookies to enhance the functionality of our site. By continuing to use our site you accept the use of cookies."
            ));

            $(this).html($(this).html().replace(
                "Lisätietoa",
                "More Information"
            ));

            $(this).html($(this).html().replace(
                "https://fi.wikipedia.org/wiki/Ev%C3%A4ste",
                "https://en.wikipedia.org/wiki/HTTP_cookie"
            ));
        });
    }
    // Swedish
    else if (currentLang == "se") {
        // Go through each element that is set to be translated and translate them
        var translateSeEls = document.querySelectorAll('[translation-se]');
        for (var i = 0; i < translateSeEls.length; i++) {
            translateElement(translateSeEls[i]);
        }
    }
}

var currentLang = "";
$(document).ready(() => {
    try {
        M.AutoInit();
    } catch (error) {
        // Error
    }

    // Get current language or use Finnish as default
    currentLang = getCookie("lang");
    if (currentLang == "") {
        setCookie("lang", "fi");
        currentLang = "fi";
    }

    // Set event handlers for language setters
    if (setLanguageFiEls.length > 0) {
        for (var i = 0; i < setLanguageFiEls.length; i++) {
            setLanguageFiEls[i].onclick = function() {
                updateLang("fi");
            }
        }
    }

    if (setLanguageEnEls.length > 0) {
        for (var i = 0; i < setLanguageEnEls.length; i++) {
            setLanguageEnEls[i].onclick = function() {
                updateLang("en");
            }
        }
    }

    if (setLanguageSeEls.length > 0) {
        for (var i = 0; i < setLanguageSeEls.length; i++) {
            setLanguageSeEls[i].onclick = function() {
                updateLang("se");
            }
        }
    }

    // Translate page once when it loads
    translatePage();
});

// Sets current language cookie and reloads the page
function updateLang(lang) {
    setCookie("lang", lang);
    location.reload();
}

// Returns the current language of the page
function getLang() {
    return currentLang;
}