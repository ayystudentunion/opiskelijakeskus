var setLanguageFiEls = document.getElementsByClassName('set-language-fi');
var setLanguageEnEls = document.getElementsByClassName('set-language-en');
var setLanguageSeEls = document.getElementsByClassName('set-language-se');

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

    if (currentLang == "en") {
        var translateEnEls = document.querySelectorAll('[translation-en]');
        for (var i = 0; i < translateEnEls.length; i++) {
            translateElement(translateEnEls[i]);
        }

        // Cookie info element is loaded dynamically from 3rd party library so update it manually here
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
    } else if (currentLang == "se") {
        var translateSeEls = document.querySelectorAll('[translation-se]');
        for (var i = 0; i < translateSeEls.length; i++) {
            translateElement(translateSeEls[i]);
        }
    }
});

// Sets current language cookie
function updateLang(lang) {
    setCookie("lang", lang);
    location.reload();
}

function getLang() {
    return currentLang;
}