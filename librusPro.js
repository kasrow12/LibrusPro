// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

/*

TO DO list:

- Ustawienia w popupie
-- włączyć/wyłączyć przycisk pracy domowej
-- szósteczki, random + średnia
-- kolory w zależności od wagi
-- wielkość w zależności od wagi
-- ukrywanie pustych przedmiotów
-- wartość plusów i minusów

- if href==
- autologowanie?
- ↓ ↑ proponowana vs. średnia

*/

var debug = false;

let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}


// Co to po komu?
if (window.location.href == "https://synergia.librus.pl/uczen/index") {
  window.location.href = "https://synergia.librus.pl/przegladaj_oceny/uczen";
}

// Jak nie ma proponowanych to kolumny z nimi się w ogóle nie wyświetlają, więc trzeba wiedzieć, gdzie co jest.
// JS liczy od 0, CSS od 1
let offsetJS = 2;
let offsetCSS = 3;
let indexy = {
  ocenyI: -1,
  sredniaI: -1,
  proponowaneI: -1,
  srodroczneI: -1,
  ocenyII: -1,
  sredniaII: -1,
  proponowaneII: -1,
  srodroczneII: -1,
  sredniaR: -1,
  proponowaneR: -1,
  roczne: -1
};

// Pobranie indexów kolumn
document.querySelectorAll("#body > form:nth-child(5) > div > div > table > thead > tr:nth-child(2) > td").forEach(e => {
  let index = [...e.parentElement.children].indexOf(e);

  if (e.innerHTML == "Śr.I") indexy["sredniaI"] = index;
  if (e.innerHTML == "(I)") indexy["proponowaneI"] = index;
  if (e.innerHTML == "I") indexy["srodroczneI"] = index;

  if (e.innerHTML == "Śr.II") indexy["sredniaII"] = index;
  if (e.innerHTML == "(II)") indexy["proponowaneII"] = index;
  if (e.innerHTML == "II") indexy["srodroczneII"] = index;

  if (e.innerHTML == "Śr.R") indexy["sredniaR"] = index;
  if (e.innerHTML == "(R)") indexy["proponowaneR"] = index;
  if (e.innerHTML == "R") indexy["roczne"] = index;

});
// Oceny bieżące są zawsze jeden przed średnimi
indexy["ocenyI"] = indexy["sredniaI"] - 1;
indexy["ocenyII"] = indexy["sredniaII"] - 1;

if (debug) console.log(indexy);

// Od ostatniego logowania/w tym tygodniu
let odOstLogowania = false;
if (document.querySelector("#body > form:nth-child(5) > div > h2") != null && document.querySelector("#body > form:nth-child(5) > div > h2").innerHTML.includes("-")) {
  odOstLogowania = true;
} else {
  // Usunięcie wierszy bez ocen
  let ocenyTr = document.querySelectorAll("tr[name=przedmioty_all] + tr");
  for (let i = 0; i < ocenyTr.length; i++)
  {
    if (ocenyTr[i].children[2].textContent == "Brak ocen")
    {
      ocenyTr[i].nextElementSibling.remove();
      ocenyTr[i].remove();
    }
  }
}

// Pokaż wiersze zawierające przynajmniej jedną ocenę
// Uwaga na oceny poprawiane - są w dodatkowym spanie
document.querySelectorAll(".grade-box").forEach(e => {e.parentElement.tagName == "SPAN" ? e.parentElement.parentElement.parentElement.style.display = "table-row" : e.parentElement.parentElement.style.display = "table-row";});


// Zamiany obrazków na ich ciemne wersje
if (document.querySelector("#gradeAverangeGraph > a > img") != null) {
  document.querySelector("#gradeAverangeGraph > a > img").src = browserAPI.runtime.getURL('img/pobierz_wykres_ocen2_dark.png');
}
if (document.querySelector("#absenceGraph > img") != null) {
  document.querySelector("#absenceGraph > img").src = browserAPI.runtime.getURL('img/pobierz_wykres_absencji_dark.png');
}

// prawidłowy sposób na zamianę foldów (w css jest link z ID wtyczki, może się zmienić) - jeżeli jest używane to, to przyciski migną na zielono przy ładowaniu
if (document.querySelector(".fold-start") != null) {
  document.querySelectorAll(".fold-start").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/fold_dark.png'); + ")";});
  document.querySelectorAll(".fold-end").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/foldEnd_dark.png'); + ")";});
  document.querySelectorAll(".fold-end-scroll").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/foldEndScroll_dark.png'); + ")";});
}

if (document.querySelector(".tree-first-branch") != null) {
  document.querySelectorAll(".tree-first-branch").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko4_dark.png'); + ")";});
  document.querySelectorAll(".tree-next-branch").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko1_dark.png'); + ")";});
  document.querySelectorAll(".tree-last-branch").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko2_dark.png'); + ")";});
}



// szósteczki
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {e.innerHTML = Math.floor(Math.random() * (7 - 4) + 4)});
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {if (/[0-6][+-]?/.test(e.innerHTML)) e.innerHTML = "6"});
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {if (/[0-6][+-]?/.test(e.innerHTML)) e.innerHTML = Math.floor(Math.random() * (5 - 2) + 2)});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(4)").forEach(e => {e.innerHTML = "6.00"});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(10)").forEach(e => {e.innerHTML = "6.00"});
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(5)").innerHTML = "wzorowe";
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)").innerHTML = "wzorowe";



// ---------------------------------------- ZACHOWANIE ----------------------------------------

// Zmiana 'minusika' na 'plusik' przy zachowaniu (OLD)
// if (document.querySelector("#przedmioty_zachowanie_node") != null) {
//   document.querySelector("#przedmioty_zachowanie_node").src = "/images/tree_colapsed.png";
// }
// if (document.getElementById("przedmioty_zachowanie") != null ) {
//   setTimeout(() => {document.getElementById("przedmioty_zachowanie").style.display = "none";}, 1);
// }

// Proponowane zachowanie do tabeli głównej
function librusPro_insertZachowanie() {

  // Pobranie elementów z proponowanym zachowaniem z rozwinięcia
  let propZachSrodroczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table > tbody");
  let propZachRoczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table > tbody");

  if (propZachSrodroczne == null || propZachRoczne == null) return;
  propZachSrodroczne = propZachSrodroczne.querySelectorAll("[colspan='3']")[0];
  propZachRoczne = propZachRoczne.querySelectorAll("[colspan='3']")[2];

  if (propZachSrodroczne == null || propZachRoczne == null) return;
  // Pobranie wartości proponowanego zachowania
  propZachSrodroczne = propZachSrodroczne.innerHTML.split(': ')[1];
  propZachRoczne = propZachRoczne.innerHTML.split(': ')[1];

  // Elementy zachowania (śród)rocznego (i proponowanego) [niezmienne od proponowanych ocen I, II i R]
  let zachSrodroczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)");
  let zachRoczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(6)");
  let propZachSrodroczneElement = zachSrodroczneElement.cloneNode(true);
  let propZachRoczneElement = zachRoczneElement.cloneNode(true);

  // Zmiana szerokości komórek
  // zachRoczneElement.colSpan = "2";
  
  // "-", bądź ocena z zachowania
  propZachSrodroczneElement.innerHTML = propZachSrodroczne == "" ? "-" : propZachSrodroczne;
  propZachRoczneElement.innerHTML = propZachRoczne == "" ? "-" : propZachRoczne;
  
  // Stylizacja proponowanych zachowań
  propZachSrodroczneElement.style.fontStyle = "italic";
  propZachRoczneElement.style.fontStyle = "italic";
  propZachSrodroczneElement.style.fontWeight = "normal";
  propZachRoczneElement.style.fontWeight = "normal";
  
  // Wstawienie stworzonych elementów
  zachSrodroczneElement.parentElement.insertBefore(propZachSrodroczneElement, zachSrodroczneElement);
  zachRoczneElement.parentElement.insertBefore(propZachRoczneElement, zachRoczneElement);
  
  // Zwężenie komórek, aby zrobić miejsce na nowe i wypełnić wiersz
  document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(3)").colSpan = "1";
  propZachSrodroczneElement.colSpan = indexy["proponowaneI"] != -1 ? "2" : "1";
  zachSrodroczneElement.nextElementSibling.colSpan = "1";
  propZachRoczneElement.colSpan = indexy["proponowaneII"] != -1 ? "3" : "2";
  zachRoczneElement.colSpan = indexy["proponowaneR"] != -1 ? "3" : "2";
}

// Schowanie paska z zachowaniem i wywołanie funkcji dodającej jeśli znajdujemy się na poprawnej stronie
if (window.location.href == "https://synergia.librus.pl/przegladaj_oceny/uczen") {
  if (odOstLogowania) {
    // Ukryj zachowanie
    document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1").style.display = "none";
  }
  else {
    let injectedCode = 'showHide.ShowHide("zachowanie")';
    let script = document.createElement('script');
    script.appendChild(document.createTextNode('('+ injectedCode +');'));
    (document.body || document.head || document.documentElement).appendChild(script);
  }

  librusPro_insertZachowanie();
}


// ----------------------------------------------- ŚREDNIE -----------------------------------------------

// Liczenie średniej arytmetycznej np. do proponowanych
function liczSrednia(elements) {
  if (elements.length < 1)
    return nieMaSredniej;

  let suma = 0;
  elements.forEach(e => {
    if (e.innerHTML.length == 1) suma += +e.innerHTML;
    else if (e.innerHTML[1] == "+") suma += +e.innerHTML[0] + 0.5;
    else if (e.innerHTML[1] == "-") suma += +e.innerHTML[0] - 0.25;
    else suma += +e.innerHTML[0];
  });

  return (Math.round( suma / elements.length  * 100 + Number.EPSILON ) / 100).toFixed(2);
}

// Liczenie średniej ważonej, zwracając uwagę na parametr Licz do średniej:
function liczSredniaWazona(elements) {
  if (elements.length < 1)
    return nieMaSredniej;

  let suma = 0;
  let wagi = 0;
  elements.forEach(e => {
    if (/[0-6][+-]?/.test(e.innerHTML)) {
      let regexp = /<br>Licz do średniej: (.){3}<br>/gi;
      let liczDoSredniej = e.title.match(regexp)[0];
      liczDoSredniej = liczDoSredniej.replace("<br>Licz do średniej: ", "").replace("<br>", "");
      if (liczDoSredniej == "nie") return;

      regexp = /<br>Waga: .{1}<br>/;
      let waga = e.title.match(regexp)[0];
      waga = waga.replace("<br>Waga: ", "").replace("<br>", "");
      wagi += +waga;

      // if (waga >= 2) e.parentElement.style.setProperty("border", "1px solid black", "important");
      // if (waga == 1) e.parentElement.style.setProperty("background", "white", "important");
      // if (waga == 2) e.parentElement.style.setProperty("background", "yellow", "important");
      // if (waga == 3) e.parentElement.style.setProperty("background", "#00ab00", "important");
      // if (waga == 4) e.parentElement.style.setProperty("background", "#ff3434", "important");
      // // if (waga == 4) e.style.setProperty("color", "#ffffff", "important");
      // if (waga >= 5) e.parentElement.style.setProperty("background", "#1f1f1f", "important");
      // if (waga >= 5) e.style.setProperty("color", "#ffffff", "important");
      
      if (e.innerHTML.length == 1) suma += (+e.innerHTML) * waga;
      else if (e.innerHTML[1] == "+") suma += (+e.innerHTML[0] + 0.5) * waga;
      else if (e.innerHTML[1] == "-") suma += (+e.innerHTML[0] - 0.25) * waga;
    }
  });

  if (suma <= 0) return nieMaSredniej;
  return (Math.round( suma / wagi  * 100 + Number.EPSILON ) / 100).toFixed(2);
}

let nieMaSredniej = "-";

function librusPro_insertSrednie() {
  let wierszOceny = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr:nth-child(1)");
  if (wierszOceny == null) return;

  // Tworzenie wiersza ze średnimi
  let srednieTr = wierszOceny.cloneNode(true);

  let ocenyI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:not(.bolded) > td:nth-child(${indexy["ocenyI"] + offsetCSS}) span.grade-box > a`);
  let proponowaneI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indexy["proponowaneI"] + offsetCSS}) > span > a`);
  let srodroczneI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indexy["srodroczneI"] + offsetCSS}) > span > a`);

  let ocenyII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indexy["ocenyII"] + offsetCSS}) span.grade-box > a`);
  let proponowaneII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indexy["proponowaneII"] + offsetCSS}) > span > a`);
  let srodroczneII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indexy["srodroczneII"] + offsetCSS}) span.grade-box > a`);

  let ocenyR = [...ocenyI, ...ocenyII];
  let proponowaneR = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indexy["proponowaneR"] + offsetCSS}) > span > a`);
  let roczne = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indexy["roczne"] + offsetCSS}) > span > a`);

  // Wstawienie średnich w wiersz tabeli
  srednieTr.children[0].innerHTML = "";
  srednieTr.children[1].innerHTML = "Średnia";
  srednieTr.children[indexy["ocenyI"] + offsetJS].innerHTML = "";
  srednieTr.children[indexy["sredniaI"] + offsetJS].innerHTML = liczSredniaWazona(ocenyI);

  if (indexy["proponowaneI"] > 0)
  srednieTr.children[indexy["proponowaneI"] + offsetJS].innerHTML = liczSrednia(proponowaneI);

  srednieTr.children[indexy["srodroczneI"] + offsetJS].innerHTML = liczSrednia(srodroczneI);
  srednieTr.children[indexy["ocenyII"] + offsetJS].innerHTML = "";
  srednieTr.children[indexy["sredniaII"] + offsetJS].innerHTML = liczSredniaWazona(ocenyII);

  if (indexy["proponowaneII"] > 0)
  srednieTr.children[indexy["proponowaneII"] + offsetJS].innerHTML = liczSrednia(proponowaneII);

  srednieTr.children[indexy["srodroczneII"] + offsetJS].innerHTML = liczSrednia(srodroczneII);
  srednieTr.children[indexy["sredniaR"] + offsetJS].innerHTML = liczSredniaWazona(ocenyR);

  if (indexy["proponowaneR"] > 0)
  srednieTr.children[indexy["proponowaneR"] + offsetJS].innerHTML = liczSrednia(proponowaneR);

  srednieTr.children[indexy["roczne"] + offsetJS].innerHTML = liczSrednia(roczne);
  srednieTr.classList.add("librusPro_average");

  document.querySelector("#body > form:nth-child(5) > div > div > table > tbody").appendChild(srednieTr);
  
  // Wyświetlanie średnich dla poszczególnych przedmiotów
  // I sem
  document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${indexy["sredniaI"] + offsetCSS})`).forEach(e => {
    e.innerHTML = liczSredniaWazona(e.parentElement.querySelectorAll(`td:nth-child(${indexy["ocenyI"] + offsetCSS}) span.grade-box > a`)) + (debug ? (" <i>(" + e.innerHTML + ")</i>") : "")
  });
  // II sem
  document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${indexy["sredniaII"] + offsetCSS})`).forEach(e => {
    e.innerHTML = liczSredniaWazona(e.parentElement.querySelectorAll(`td:nth-child(${indexy["ocenyII"] + offsetCSS}) span.grade-box > a`)) + (debug ? (" <i>(" + e.innerHTML + ")</i>") : "")
  });
  // Roczna
  document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${indexy["sredniaR"] + offsetCSS})`).forEach(e => {
    e.innerHTML = liczSredniaWazona([...e.parentElement.querySelectorAll(`td:nth-child(${indexy["ocenyI"] + offsetCSS}) span.grade-box > a`), ...e.parentElement.querySelectorAll(`td:nth-child(${indexy["ocenyII"] + offsetCSS}) span.grade-box > a`)]) + (debug ? (" <i>(" + e.innerHTML + ")</i>") : "")
  });

}

if (window.location.href == "https://synergia.librus.pl/przegladaj_oceny/uczen") {
  librusPro_insertSrednie();
}


// ---------------------------------------------- WIZUALNE ----------------------------------------------


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
  planLekcji.children[0].href = "javascript:otworz_w_nowym_oknie('/przegladaj_plan_lekcji','plan_u',0,0)";
  planLekcji.children[0].innerHTML = "Plan lekcji";
  navBarElement.parentElement.appendChild(planLekcji);
}


// Wyświetlanie numeru z dziennika obok szczęśliwego + informacja gdy nim jest Twój
let numerek = document.querySelector("#user-section > span.luckyNumber");
if (numerek != null) {
  let nr;
  browserAPI.storage.sync.get(["nr"], function (r) {
    nr = r["nr"];
    if (nr != undefined){
      let twojNumer = document.createElement("SPAN");
      twojNumer.innerHTML = "Twój numerek w dzienniku: <b style='color: #eeeeee'>" + nr + "</b>";
      
      if (document.querySelector("#user-section > span.luckyNumber > b").innerHTML == nr) {
          twojNumer.innerHTML += "<span style='color: lime; margin-left: 5px;'><b>GRATULACJE!</b></span>";
      }

      numerek.parentElement.insertBefore(twojNumer, numerek.nextSibling);
    } else {
      let klasaRegex = /<th class="big">Klasa <\/th>\n                <td>\n                (.*)\n                <\/td>/;
      let nrRegex = /<th class="big">Nr w dzienniku <\/th>\n                <td>\n                    (.*)\n                <\/td>/;

      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          browserAPI.storage.sync.set({ ["klasa"]: this.responseText.match(klasaRegex)[1] });
          browserAPI.storage.sync.set({ ["nr"]: this.responseText.match(nrRegex)[1] });
          window.location.reload();
        }
      };
      xhttp.open("GET", "https://synergia.librus.pl/informacja", true);
      xhttp.send();
    }
  });

}

// Easter egg
let hakerzy = document.querySelector("#user-section > img");
if (hakerzy != null) {
  hakerzy.title += "<br><b style='color: #ee9999'>HAKERZY ATAKUJĄ!</b>"
}


// Copyright
function librusPro_insertFooter() {
  let footer = document.querySelector("#footer");
  if (footer == null) return;
  let copyright = document.createElement("DIV");
  let github = document.createElement("DIV");
  copyright.innerText = "LibrusPro © 2021 Maks Kowalski";
  let githublink = document.createElement("A");
  githublink.onclick = () => {window.open("https://github.com/kasrow12/LibrusPro", "_blank");}
  githublink.innerText = "https://github.com/kasrow12/LibrusPro"
  github.appendChild(githublink);
  copyright.style.color = "#999999";
  githublink.style.color = "#3a5aab";
  githublink.style.cursor = "pointer";
  footer.append(copyright, github);
}

librusPro_insertFooter();