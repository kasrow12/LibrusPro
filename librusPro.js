// LibrusPro
// Chrome Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

/*

TO DO list:

- włączyć/wyłączyć przycisk pracy domowej
- szósteczki, random + średnia
- autologowanie?


*/




if (window.location.href == "https://synergia.librus.pl/uczen/index") {
  window.location.href = "https://synergia.librus.pl/przegladaj_oceny/uczen";
}


// Od ostatniego logowania/w tym tygodniu
if (document.querySelector("#body > form:nth-child(5) > div > h2") != null && document.querySelector("#body > form:nth-child(5) > div > h2").innerHTML.includes("-"))
{
  // Ukryj zachowanie
  document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1").style.display = "none";
} else {
  let ocenyTr = document.querySelectorAll("tr[name=przedmioty_all] + tr");
  for (let i = 0; i < ocenyTr.length; i++)
  {
    if (ocenyTr[i].children[2].textContent == "Brak ocen")
    {
      ocenyTr[i].nextSibling.remove();
      ocenyTr[i].remove();
    }
  }
}

// Pokaż wiersze zawierające przynajmniej jedną ocenę
document.querySelectorAll(".grade-box").forEach(e => {e.parentElement.tagName == "SPAN" ? e.parentElement.parentElement.parentElement.style.display = "table-row" : e.parentElement.parentElement.style.display = "table-row";});


// Zmiany obrazków
if (document.querySelector("#gradeAverangeGraph > a > img") != null) {
  document.querySelector("#gradeAverangeGraph > a > img").src = chrome.runtime.getURL('img/pobierz_wykres_ocen2_dark.png');
}
if (document.querySelector("#absenceGraph > img") != null) {
  document.querySelector("#absenceGraph > img").src = chrome.runtime.getURL('img/pobierz_wykres_absencji_dark.png');
}

// prawidłowy sposób na zamianę foldów (w css jest link z ID wtyczki, może się zmienić)
/*if (document.querySelector(".fold-start") != null) {
  document.querySelectorAll(".fold-start").forEach(e => {e.style.backgroundImage = "url(" + chrome.runtime.getURL('img/fold_dark.png'); + ")";});
  document.querySelectorAll(".fold-end").forEach(e => {e.style.backgroundImage = "url(" + chrome.runtime.getURL('img/foldEnd_dark.png'); + ")";});
  // document.querySelectorAll(".fold-start").forEach(e => {e.style.background = chrome.runtime.getURL('img/fold_dark.png');});
}*/


// ------------------------------------------------------------------------------------------

// Zmiana 'minusika' na 'plusik' przy zachowaniu
if (document.querySelector("#przedmioty_zachowanie_node") != null) {
  document.querySelector("#przedmioty_zachowanie_node").src = "/images/tree_colapsed.png";
}
if (document.getElementById("przedmioty_zachowanie") != null ) {
  setTimeout(() => {document.getElementById("przedmioty_zachowanie").style.display = "none";}, 1);
}

// Proponowane zachowanie do tabeli głównej
let propZachSrodroczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table > tbody > tr:nth-child(5) > td:nth-child(3)");
let propZachRoczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table > tbody > tr:nth-child(11) > td:nth-child(3)");

if (propZachSrodroczne != null && propZachRoczne != null) {

  // Pobranie proponowanego zachowania
  propZachSrodroczne = propZachSrodroczne.innerHTML.split(': ')[1];
  propZachRoczne = propZachRoczne.innerHTML.split(': ')[1];

  // Zwężenie komórek, aby zrobić miejsce na nowe
  document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(3)").colSpan = "1";
  document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(5)").colSpan = "1";

  // Elementy zachowania (śród)rocznego (i proponowanego)
  let zachSrodroczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)");
  let zachRoczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(6)");
  let propZachSrodroczneElement = zachSrodroczneElement.cloneNode(true);
  let propZachRoczneElement = zachRoczneElement.cloneNode(true);

  // Zmiana szerokości komórek
  propZachSrodroczneElement.colSpan = "2";
  propZachRoczneElement.colSpan = "2";
  zachRoczneElement.colSpan = "2";

  // "-", bądź ocena z zachowania
  propZachSrodroczneElement.innerHTML = propZachSrodroczne == "" ? "-" : propZachSrodroczne;
  propZachRoczneElement.innerHTML = propZachRoczne == "" ? "-" : propZachRoczne;

  // Wstawienie stworzonych elementów
  zachSrodroczneElement.parentElement.insertBefore(propZachSrodroczneElement, zachSrodroczneElement);
  zachRoczneElement.parentElement.insertBefore(propZachRoczneElement, zachRoczneElement);
}
// --------------------------------------------------------------------------------------------------




// szósteczki
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {e.innerHTML = Math.floor(Math.random() * (7 - 4) + 4)});
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {e.innerHTML = "6"});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(4)").forEach(e => {e.innerHTML = "6.00"});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(10)").forEach(e => {e.innerHTML = "6.00"});
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(5)").innerHTML = "wzorowe";
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)").innerHTML = "wzorowe";



// Losowe bordery w tabelach, bo Librus dał losowo w css je na important... pepoWTF...
if (document.querySelectorAll("#body > form:nth-child(5) > div > div > table > thead > tr:nth-child(2) > td.no-border-top.spacing") != null) {
  document.querySelectorAll("#body > form:nth-child(5) > div > div > table > thead > tr:nth-child(2) > td.no-border-top.spacing").forEach(e => {e.style.setProperty("border-left", "1px #000000 solid", "important");});
}
if (document.querySelectorAll("table.decorated table thead th, table.decorated table thead td") != null) {
  document.querySelectorAll("table.decorated table thead th, table.decorated table thead td").forEach(e => {e.style.setProperty("border-left", "1px #000000 solid", "important");});
}
if (window.location.href == "https://synergia.librus.pl/przegladaj_plan_lekcji") {
  document.querySelectorAll(".border-top").forEach(e => {e.style.setProperty("border-top", "1px #000000 solid", "important"); e.style.setProperty("border-left", "1px #000000 solid", "important");});
  document.querySelectorAll(".border-right").forEach(e => {e.style.setProperty("border-right", "1px #000000 solid", "important");});
  document.querySelectorAll("#body > div > div > form > table.decorated.plan-lekcji > tbody > tr > td").forEach(e => {e.style.setProperty("border-bottom", "0", "important");});
}
if (document.querySelectorAll("table.decorated.filters td, table.decorated.filters th") != null) {
  document.querySelectorAll("table.decorated.filters td, table.decorated.filters th").forEach(e => {e.style.setProperty("border-color", "#000000", "important");});
}
if (document.querySelectorAll("table.decorated thead td.spacing, table.decorated thead th.spacing") != null) {
  document.querySelectorAll("table.decorated thead td.spacing, table.decorated thead th.spacing").forEach(e => {e.style.setProperty("border-left", "1px solid #000000", "important");});
}


// Plan lekcji do navbara
let navBarElement = document.querySelector("#main-menu > ul > li:nth-child(3)");
if (navBarElement != null) {
  let planLekcji = navBarElement.cloneNode(true);
  planLekcji.childNodes[0].href = "javascript:otworz_w_nowym_oknie('/przegladaj_plan_lekcji','plan_u',0,0)";
  planLekcji.childNodes[0].innerHTML = "Plan lekcji";
  navBarElement.parentElement.appendChild(planLekcji);
}