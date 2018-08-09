/**
 * @file Holds some globally used variables and utility functions
 * @author Zentryn <https://github.com/Zentryn>
 */

// Category icon names mapped to image file names
var categoryIcons = {
    "Harrastukset": "harrastukset",
    "Hygieniatilat": "wc ja suihku",
    "Juhlat": "Juhlat",
    "Kahvila": "kahvila ja baari",
    "Kokoukset": "ryhmatyo",
    "Muut": "muut_abstrakti",
    "Palvelut": "asiakaspalvelu",
    "Pop-up -tapahtumat": "Nayttelyt",
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

// English translations for category names
var categoryTranslationsEN = {
    "Harrastukset": "Hobbies",
    "Hygieniatilat": "Hygiene Facilities",
    "Juhlat": "Parties",
    "Kahvila": "Cafeteria",
    "Kokoukset": "Meetings",
    "Muut": "Other",
    "Palvelut": "Services",
    "Pop-up -tapahtumat": "Pop-up -events",
    "Rentoutuminen": "Relaxation",
    "Ruoka": "Food",
    "Säilytys": "Storage",
    "Sauna": "Sauna",
    "Seminaarit": "Seminars",
    "Sosiaalisuus": "Socializing",
    "Tapahtumat": "Events",
    "Tietopalvelut": "Information services",
    "Työskentely": "Working",
    "Ulkotilat": "Outdoors",
    "Urheilu": "Sports",
    "Vapaa-aika": "Free time",
    "Villit ideat": "Wild ideas"
}

// Swedish translations for category names
var categoryTranslationsSE = {
    "Harrastukset": "Hobbyer",
    "Hygieniatilat": "Hygienutrymmen",
    "Juhlat": "Fester",
    "Kahvila": "Kaffe",
    "Kokoukset": "Möten",
    "Muut": "Övriga",
    "Palvelut": "Tjänster",
    "Pop-up -tapahtumat": "Pop-up -evenemang",
    "Rentoutuminen": "Avkoppling",
    "Ruoka": "Mat",
    "Säilytys": "Förvaring",
    "Sauna": "Bastu",
    "Seminaarit": "Seminarier",
    "Sosiaalisuus": "Socialt liv",
    "Tapahtumat": "Evenemang",
    "Tietopalvelut": "Informationstjänster",
    "Työskentely": "Arbete",
    "Ulkotilat": "Utomhusutrymmen",
    "Urheilu": "Idrott",
    "Vapaa-aika": "Fritid",
    "Villit ideat": "Vilda idéer"
}

// Sets copyright text in page footer
function setCopyrightText() {
    var copyrightTextEl = document.getElementById('copyright_text');
    
    if (copyrightTextEl != undefined && copyrightTextEl != null) {
        // Site was originally created in 2018
        var createdYear = 2018;
        var currentYear = new Date().getFullYear();

        // Update copyright text year span according to the current year
        var yearText = String(createdYear) + (
            (currentYear != createdYear)
            ? ("-" + String(currentYear))
            : ""
        );

        copyrightTextEl.innerHTML = "Copyright © " + yearText + " <a href='https://ayy.fi' target='_blank'>Aalto University Student Union</a>";
    }
}

/**
 * Saves a cookie for 1 year
 * @param {string} cname Name for the cookie
 * @param {string} cvalue Value for the cookie
 */
function setCookie(cname, cvalue) {
    var expiration_date = new Date();

    // This was used primarily for saving information about which ideas the user
    //     had liked; hence the long (1 year) save duration.
    expiration_date.setFullYear(expiration_date.getFullYear() + 1);

    document.cookie = cname + "=" + cvalue + ";" + " expires=" + expiration_date.toUTCString();
}

/**
 * Gets an existing cookie by name
 * @param {string} cname Name of the wanted cookie
 * @returns Value of the wanted cookie
 */
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return "";
}

/**
 * Translates an element according to the current language of the page
 * @param {HTMLElement} el The element that should be translated
 */
function translateElement(el) {
    // Get current language from cookie
    var lang = getCookie("lang");
    if (lang == "fi" || lang == "") return;

    // Translation works by replacing the contents of the element by 
    //     the translation attribute text of the element
    if (lang == "en" && el.hasAttribute('translation-en')) {
        el.innerHTML = el.getAttribute('translation-en');
    } else if (lang == "se" && el.hasAttribute('translation-se')) {
        el.innerHTML = el.getAttribute('translation-se');
    }
}