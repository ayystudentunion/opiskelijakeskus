// Internet Explorer 6-11
var isBrowserIE = /*@cc_on!@*/false || !!document.documentMode;

if (isBrowserIE) {
    document.getElementById('site-container').innerHTML = "";
    document.getElementById('ie-message').classList.remove('no-display');
    document.body.style.backgroundColor = "#033649";
    document.body.style.overflowY = "hidden";
    document.getElementById('ie-message-text-title').style.color = "white";
}