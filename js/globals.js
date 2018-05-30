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