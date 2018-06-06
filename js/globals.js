// Category names mapped to image names
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

// Sets the copyright text in page footer
function setCopyrightText() {
    var copyrightTextEl = document.getElementById('copyright_text');
    
    if (copyrightTextEl != undefined && copyrightTextEl != null) {
        var createdYear = 2018;
        var currentYear = new Date().getFullYear();

        // Update copyright text year span according to the current year
        var yearText = String(createdYear) + ((currentYear != createdYear) ? ("-" + String(currentYear)) : "");

        copyrightTextEl.innerHTML = "Copyright © " + yearText + " <a href='https://ayy.fi' target='_blank'>Aalto University Student Union</a>";
    }
}

// Sets a new cookie
function setCookie(cname, cvalue) {
    // Store cookie for 1 year
    var expiration_date = new Date();
    expiration_date.setFullYear(expiration_date.getFullYear() + 1);

    document.cookie = cname + "=" + cvalue + ";" + " expires=" + expiration_date.toUTCString();
}

// Get an existing cookie by name
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

// Updates element's text according to the current language
function translateElement(el) {
    var lang = getCookie("lang");
    if (lang == "fi" || lang == "") return;

    if (lang == "en" && el.hasAttribute('translation-en')) {
        el.innerHTML = el.getAttribute('translation-en');
    } else if (lang == "se" && el.hasAttribute('translation-se')) {
        el.innerHTML = el.getAttribute('translation-se');
    }
}