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
-- plan lekcji _blank czy nowe okno

*/

const debug = false;

let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

const noAverage = "-";

// Co to po komu ta strona startowa?
if (window.location.href == "https://synergia.librus.pl/uczen/index" || window.location.href == "https://synergia.librus.pl/rodzic/index") {
  // window.location.href = "https://synergia.librus.pl/przegladaj_oceny/uczen";
  document.location.replace("https://synergia.librus.pl/przegladaj_oceny/uczen");
}

// Jak nie ma proponowanych to kolumny z nimi się w ogóle nie wyświetlają, więc trzeba wiedzieć, gdzie co jest. Pozdro
// JS liczy od 0, CSS od 1
const offsetJS = 2;
const offsetCSS = 3;
const indices = {
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
  const index = [...e.parentElement.children].indexOf(e);

  if (e.innerText == "Śr.I") indices["sredniaI"] = index;
  if (e.innerText == "(I)") indices["proponowaneI"] = index;
  if (e.innerText == "I") indices["srodroczneI"] = index;

  if (e.innerText == "Śr.II") indices["sredniaII"] = index;
  if (e.innerText == "(II)") indices["proponowaneII"] = index;
  if (e.innerText == "II") indices["srodroczneII"] = index;

  if (e.innerText == "Śr.R") indices["sredniaR"] = index;
  if (e.innerText == "(R)") indices["proponowaneR"] = index;
  if (e.innerText == "R") indices["roczne"] = index;

});
// Oceny bieżące są zawsze jeden przed średnimi
indices["ocenyI"] = indices["sredniaI"] - 1;
indices["ocenyII"] = indices["sredniaII"] - 1;

// ----------------------------------------------- ŚREDNIE -----------------------------------------------

// Liczenie średniej arytmetycznej np. do proponowanych
function liczSrednia(elements) {
  if (elements.length < 1)
    return noAverage;

  let suma = 0;
  elements.forEach(e => {
    if (e.innerText.length == 1) suma += +e.innerText;
    else if (e.innerText[1] == "+") suma += +e.innerText[0] + 0.5;
    else if (e.innerText[1] == "-") suma += +e.innerText[0] - 0.25;
    else suma += +e.innerText[0];
  });

  return (Math.round( suma / elements.length  * 100 + Number.EPSILON ) / 100).toFixed(2);
}

// Liczenie średniej ważonej, zwracając uwagę na parametr Licz do średniej:
function liczSredniaWazona(elements, depressionMode) {
  if (elements.length < 1)
    return noAverage;

  let sum = 0;
  let weights = 0;
  elements.forEach(e => {
    if (/[0-6][+-]?/.test(e.innerText)) {
      let regexp = /<br>Licz do średniej: (.){3}<br>/gi;
      let liczDoSredniej = e.title.match(regexp)[0];
      liczDoSredniej = liczDoSredniej.replace("<br>Licz do średniej: ", "").replace("<br>", "");
      if (liczDoSredniej == "nie") return;

      regexp = /<br>Waga: .{1}<br>/;
      let weight = e.title.match(regexp)[0];
      weight = weight.replace("<br>Waga: ", "").replace("<br>", "");
      weights += +weight;

      if (e.innerText.length == 1) sum += (+e.innerText) * weight;
      else if (e.innerText[1] == "+") sum += (+e.innerText[0] + 0.5) * weight;
      else if (e.innerText[1] == "-") sum += (+e.innerText[0] - 0.25) * weight;
      
      if (depressionMode) {
        if (weight == 1) e.parentElement.style.background = "#777777";
        else if (weight == 2) e.parentElement.style.background = "#bbbbbb";
        else if (weight == 3) e.parentElement.style.background = "#ffffff", e.parentElement.style.filter = "brightness(0.8)";
        else if (weight == 4) e.parentElement.style.background = "#ffaaaa";
        else if (weight >= 5) e.parentElement.style.background = "#ff6666";
      }
    }
    else if (depressionMode) {
      e.parentElement.style.setProperty("background", "#8592b1", "important");
    }
  });

  if (sum <= 0) return noAverage;
  return (Math.round( sum / weights  * 100 + Number.EPSILON ) / 100).toFixed(2);
}

function librusPro_insertSrednie() {
  if (document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr:nth-child(1)") == null) return;

  // Tworzenie wiersza ze średnimi
  const srednieTr = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr:nth-child(1)").cloneNode(true);

  const ocenyI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:not(.bolded) > td:nth-child(${indices["ocenyI"] + offsetCSS}) span.grade-box > a`);
  const proponowaneI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indices["proponowaneI"] + offsetCSS}) > span > a`);
  const srodroczneI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indices["srodroczneI"] + offsetCSS}) > span > a`);

  const ocenyII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indices["ocenyII"] + offsetCSS}) span.grade-box > a`);
  const proponowaneII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indices["proponowaneII"] + offsetCSS}) > span > a`);
  const srodroczneII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indices["srodroczneII"] + offsetCSS}) > span > a`);

  const ocenyR = [...ocenyI, ...ocenyII];
  const proponowaneR = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indices["proponowaneR"] + offsetCSS}) > span > a`);
  const roczne = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr > td:nth-child(${indices["roczne"] + offsetCSS}) > span > a`);


  // Wstawienie średnich w wiersz tabeli
  srednieTr.children[0].innerText = "";
  srednieTr.children[1].innerText = "Średnia";
  srednieTr.children[indices["ocenyI"] + offsetJS].innerText = "";
  srednieTr.children[indices["sredniaI"] + offsetJS].innerText = liczSredniaWazona(ocenyI);

  if (indices["proponowaneI"] > 0) {
    srednieTr.children[indices["proponowaneI"] + offsetJS].innerText = liczSrednia(proponowaneI);
    srednieTr.children[indices["proponowaneI"] + offsetJS].classList.add("right");
  }

  srednieTr.children[indices["srodroczneI"] + offsetJS].innerText = liczSrednia(srodroczneI);
  srednieTr.children[indices["ocenyII"] + offsetJS].innerText = "";
  srednieTr.children[indices["sredniaII"] + offsetJS].innerText = liczSredniaWazona(ocenyII);

  if (indices["proponowaneII"] > 0) {
    srednieTr.children[indices["proponowaneII"] + offsetJS].innerText = liczSrednia(proponowaneII);
    srednieTr.children[indices["proponowaneII"] + offsetJS].classList.add("right");
  }

  srednieTr.children[indices["srodroczneII"] + offsetJS].innerText = liczSrednia(srodroczneII);
  browserAPI.storage.sync.get(["options"], function (t) {
    options = t["options"];
    if (options.depressionMode) {
      srednieTr.children[indices["sredniaR"] + offsetJS].innerText = liczSredniaWazona(ocenyR, true);
    } else {
      srednieTr.children[indices["sredniaR"] + offsetJS].innerText = liczSredniaWazona(ocenyR, false);
    }
  });

  if (indices["proponowaneR"] > 0) {
    srednieTr.children[indices["proponowaneR"] + offsetJS].innerText = liczSrednia(proponowaneR);
    srednieTr.children[indices["proponowaneR"] + offsetJS].classList.add("right");
  }

  browserAPI.storage.sync.get(["depressionMode"], function (r) {
    if (r["depressionMode"] === true) {
      srednieTr.children[indices["roczne"] + offsetJS].innerText = liczSrednia(roczne, true);
    }
    else {
      srednieTr.children[indices["roczne"] + offsetJS].innerText = liczSrednia(roczne, false);
    }
  });
  srednieTr.classList.add("librusPro_average");

  document.querySelector("#body > form:nth-child(5) > div > div > table > tbody").appendChild(srednieTr);
  
  // Wyświetlanie średnich dla poszczególnych przedmiotów
  // I sem
  document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${indices["sredniaI"] + offsetCSS})`).forEach(e => {
    e.innerText = liczSredniaWazona(e.parentElement.querySelectorAll(`td:nth-child(${indices["ocenyI"] + offsetCSS}) span.grade-box > a`)) + (debug ? (" (" + e.innerText + ")") : "");
    e.classList.add("right");
  });
  // II sem
  document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${indices["sredniaII"] + offsetCSS})`).forEach(e => {
    e.innerText = liczSredniaWazona(e.parentElement.querySelectorAll(`td:nth-child(${indices["ocenyII"] + offsetCSS}) span.grade-box > a`)) + (debug ? (" (" + e.innerText + ")") : "");
    e.classList.add("right");
  });
  // Roczna
  document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${indices["sredniaR"] + offsetCSS})`).forEach(e => {
    e.innerText = liczSredniaWazona([...e.parentElement.querySelectorAll(`td:nth-child(${indices["ocenyI"] + offsetCSS}) span.grade-box > a`), ...e.parentElement.querySelectorAll(`td:nth-child(${indices["ocenyII"] + offsetCSS}) span.grade-box > a`)]) + (debug ? (" (" + e.innerText + ")") : "");
    e.classList.add("right");
  });

}


// ---------------------------------------------------------------------
function librusPro_hideSubjects() {
  document.querySelectorAll("tr[name=przedmioty_all]").forEach((e) => {
    const el = e.previousElementSibling;
    if (el.children[indices["ocenyI"] + offsetJS].textContent == "Brak ocen" && el.children[indices["ocenyII"] + offsetJS].textContent == "Brak ocen")
    {
      el.remove();
      e.remove();
    }
  });
}

// Od ostatniego logowania/w tym tygodniu
let odOstLogowania = false;

// Jeśli w widoku ocen
if (window.location.href == "https://synergia.librus.pl/przegladaj_oceny/uczen") {
  if (document.querySelector("#body > form:nth-child(5) > div > h2") != null && document.querySelector("#body > form:nth-child(5) > div > h2").innerHTML.includes("-")) {
    odOstLogowania = true;
  }

  librusPro_insertSrednie();

  // Ukrywanie przedmiotów bez ocen
  browserAPI.storage.sync.get(["options"], function (t) {
    options = t["options"];
    if (options.hideSubjects) {
      librusPro_hideSubjects();
    }
  });

  browserAPI.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
      if (key === "options") {
        window.location.reload();
      }
    }
  });

}

// Pokaż wiersze zawierające przynajmniej jedną ocenę
// Uwaga na oceny poprawiane - są w dodatkowym spanie
// document.querySelectorAll(".grade-box").forEach(e => {e.parentElement.tagName == "SPAN" ? e.parentElement.parentElement.parentElement.style.display = "table-row" : e.parentElement.parentElement.style.display = "table-row";});


// Zamiany obrazków na ich ciemne wersje
if (document.querySelector("#gradeAverangeGraph > a > img") != null) {
  document.querySelector("#gradeAverangeGraph > a > img").src = browserAPI.runtime.getURL('img/pobierz_wykres_ocen2_dark.png');
}
if (document.querySelector("#absenceGraph > img") != null) {
  document.querySelector("#absenceGraph > img").src = browserAPI.runtime.getURL('img/pobierz_wykres_absencji_dark.png');
}

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
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {if (/[0-6][+-]?/.test(e.innerText)) e.innerText = "6"});
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {if (/[0-6][+-]?/.test(e.innerText)) e.innerText = Math.floor(Math.random() * (7 - 4) + 4)});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(4)").forEach(e => {e.innerText = "6.00"});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(10)").forEach(e => {e.innerText = "6.00"});
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(5)").innerText = "wzorowe";
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)").innerText = "wzorowe";



// ---------------------------------------- ZACHOWANIE ----------------------------------------


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
  propZachSrodroczne = propZachSrodroczne.innerText.split(': ')[1];
  propZachRoczne = propZachRoczne.innerText.split(': ')[1];
  if (propZachSrodroczne == null) return;
  if (propZachSrodroczne != null && propZachRoczne == null) propZachRoczne = "-";

  // Elementy zachowania (śród)rocznego (i proponowanego) [niezmienne od proponowanych ocen I, II i R]
  const zachSrodroczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded > td:nth-child(4)");
  const zachRoczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded > td:nth-child(6)");
  const propZachSrodroczneElement = zachSrodroczneElement.cloneNode(true);
  const propZachRoczneElement = zachRoczneElement.cloneNode(true);
  
  // "-", bądź ocena z zachowania
  propZachSrodroczneElement.innerText = propZachSrodroczne || "-";
  propZachRoczneElement.innerText = propZachRoczne || "-";
  
  // Stylizacja proponowanych zachowań
  propZachSrodroczneElement.style.fontStyle = "italic";
  propZachRoczneElement.style.fontStyle = "italic";
  propZachSrodroczneElement.style.fontWeight = "normal";
  propZachRoczneElement.style.fontWeight = "normal";
  
  // Wstawienie stworzonych elementów
  zachSrodroczneElement.parentElement.insertBefore(propZachSrodroczneElement, zachSrodroczneElement);
  zachRoczneElement.parentElement.insertBefore(propZachRoczneElement, zachRoczneElement);
  
  // Zwężenie komórek, aby zrobić miejsce na nowe i wypełnić wiersz
  document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded > td:nth-child(3)").colSpan = "1";
  propZachSrodroczneElement.colSpan = indices["proponowaneI"] != -1 ? "2" : "1";
  zachSrodroczneElement.nextElementSibling.colSpan = "1";
  propZachRoczneElement.colSpan = indices["proponowaneII"] != -1 ? "3" : "2";
  zachRoczneElement.colSpan = indices["proponowaneR"] != -1 ? "3" : "2";
}

// Schowanie paska z zachowaniem i wywołanie funkcji dodającej jeśli znajdujemy się na poprawnej stronie
if (window.location.href == "https://synergia.librus.pl/przegladaj_oceny/uczen") {
  if (odOstLogowania) {
    // Ukryj zachowanie
    document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded").style.display = "none";
  }
  else {
    const injectedCode = 'showHide.ShowHide("zachowanie")';
    const script = document.createElement('script');
    script.appendChild(document.createTextNode('('+ injectedCode +');'));
    (document.body || document.head || document.documentElement).appendChild(script);
  }

  librusPro_insertZachowanie();
}



// ---------------------------------------------- WIZUALNE ----------------------------------------------


// Losowe bordery w tabelach, bo Librus dał losowo w css je na important... pepoWTF...
function librusPro_adjustBorders() {
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
}

librusPro_adjustBorders();


// Plan lekcji do navbara
function librusPro_adjustNavbar() {
  const navBarElement = document.querySelector("#main-menu > ul > li:nth-child(3)");
  if (navBarElement == null) return;
  const planLekcji = navBarElement.cloneNode();
  // planLekcji.children[0].href = "javascript:otworz_w_nowym_oknie('/przegladaj_plan_lekcji','plan_u',0,0)";
  // planLekcji.children[0].href = "https://synergia.librus.pl/przegladaj_plan_lekcji";
  // planLekcji.children[0].setAttribute("target", "_blank");
  const planLekcjiElement = document.createElement("A");
  planLekcjiElement.innerText = "Plan lekcji";
  planLekcjiElement.style.cursor = "pointer";
  planLekcjiElement.addEventListener("mouseup", function () {
    window.open("https://synergia.librus.pl/przegladaj_plan_lekcji");
  });
  planLekcji.appendChild(planLekcjiElement);
  navBarElement.parentElement.appendChild(planLekcji);

  document.querySelectorAll("#main-menu > ul > li > a").forEach((e) => {
    if (e.innerText == "Ankiety") e.parentElement.style.display = "none";
    if (e.innerText == "Pomoc") e.parentElement.style.display = "none";
    if (e.innerText == "Książki") e.parentElement.style.display = "none";
    if (e.innerText == "Organizacja") e.parentElement.children[1].children[0].style.display = "none";
  })
}

librusPro_adjustNavbar();

// Wyświetlanie numeru z dziennika obok szczęśliwego + informacja gdy nim jest Twój
function librusPro_adjustHeader() {
  const numerek = document.querySelector("#user-section > span.luckyNumber");
  if (numerek != null) {
    let nr;
    browserAPI.storage.sync.get(["nr"], function (r) {
      nr = r["nr"];
      if (nr != undefined){
        let yourNumber = document.createElement("SPAN");
        yourNumber.innerText = "Twój numerek w dzienniku: ";
        const number = document.createElement("B");
        number.innerText = nr;
        number.style.color = "#eeeeee";
        yourNumber.appendChild(number);
        
        if (document.querySelector("#user-section > span.luckyNumber > b").innerText == nr) {
          const gratulacje = document.createElement("SPAN");
          gratulacje.style.color = "lime";
          gratulacje.style.marginLeft = "5px";
          gratulacje.innerText = "GRATULACJE!";
          yourNumber.appendChild(gratulacje);
        }

        numerek.parentElement.insertBefore(yourNumber, numerek.nextSibling);
      } else {
        const klasaRegex = /<th class="big">Klasa <\/th>\n                <td>\n                (.*)\n                <\/td>/;
        const nrRegex = /<th class="big">Nr w dzienniku <\/th>\n                <td>\n                    (.*)\n                <\/td>/;

        const xhttp = new XMLHttpRequest();
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
  const hakerzy = document.querySelector("#user-section > img");
  if (hakerzy != null) {
    hakerzy.title += "<br><b style='color: #ee9999'>HAKERZY ATAKUJĄ!</b>"
  }
  const uczen = document.querySelector("#user-section > b > img");
  if (uczen != null) {
    uczen.title += "<br><b style='color: #a96fe3'>Dzięki za korzystanie z rozszerzenia LibrusPro!</b>"
  }
}

librusPro_adjustHeader();




// Copyright
function librusPro_insertFooter() {
  const footer = document.querySelector("#footer");
  if (footer == null) return;
  footer.innerHTML = `
  <div id="footer"><hr>
    <span id="bottom-logo"></span>
    <div style="
        display: inline-flex;
        height: 27px;
        width: 27px;
        background: url(&quot;` + browserAPI.runtime.getURL('img/icon.png') + `&quot;);
        background-size: cover;
        filter: brightness(0.7) contrast(1.1);">
    </div>
    <div style="margin-left: 5px; vertical-align: top; display: inline-flex;">
      <div style="color: rgb(153, 153, 153); ">
        <div>LibrusPro © 2021 Maks Kowalski</div>
        <div><a href="https://github.com/kasrow12/LibrusPro" target="_blank" style="color: rgb(58, 90, 171); cursor: pointer;">https://github.com/kasrow12/LibrusPro</a></div>
      </div>
    </div>
  </div>`
}

librusPro_insertFooter();