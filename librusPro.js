// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

// Rework terminarza
// Light theme
// Przełączniki:
// opis, klasa, nauczyciel



const DEBUG = false;
const NO_DATA = "-";
const DANE_DEFAULT = {
  nr: null,
  currentClass: null,
};
const OPTIONS_DEFAULT = {
  hideSubjects: true,
  calculateAverages: true,
  depressionMode: false,
  modernizeSchedule: true,
  removeClasses: true,
  addDescriptions: true,
  darkTheme: true,
  hideOnes: false,
  countZeros: true,
  plusValue: 0.5,
  minusValue: 0.25,
};
const DEPRESSION_MODE_COLORS = {
  proposed: "#aaad84",
  final: "#b0c4de",
  other: "#8592b1",
  weight1: "#777777",
  weight2: "#bbbbbb",
  weight3: "#ffffff",
  weight4: "#ffaaaa",
  weight5: "#ff6666",
  negativeBehavior: "#927265",
  positiveBehavior: "#98a987",
};
const DEFAULT_COLORS = {
  rocznopodobne: "#b0c4de",
};

// Kompatybilność
let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

browserAPI.storage.onChanged.addListener((changes, namespace) => {
  for (let key in changes) {
    if (key === "options") {
      window.location.replace(window.location.href);
    }
  }
});

// Aktualizacja numerku i klasy
function updateDetails(dane, href) {
  const nrRegex = /<th class="big">Nr w dzienniku <\/th>\n                <td>\n                    (.*)\n                <\/td>/;
  const xhttpNr = new XMLHttpRequest();
  xhttpNr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let nr = this.responseText.match(nrRegex);
      if (nr != null) {
        nr = nr[1];
      }
      const klasaRegex = /<b>Klasa: <\/b>(.*)&nbsp;<\/p>/;
      const xhttpKlasa = new XMLHttpRequest();
      xhttpKlasa.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          let klasa = this.responseText.match(klasaRegex);
          if (klasa != null) {
            klasa = klasa[1];
          }

          if (dane == null || nr != dane.nr || klasa != dane.currentClass) {
            let temp = DANE_DEFAULT;
            if (klasa != null) temp.currentClass = klasa;
            if (nr != null) temp.nr = nr;
            browserAPI.storage.sync.set({ ["dane"]: temp });

          }
        }
        document.location.replace(href);
      };
      xhttpKlasa.open("GET", "https://synergia.librus.pl/przegladaj_oceny/uczen", true);
      xhttpKlasa.send();
    }
  };
  xhttpNr.open("GET", "https://synergia.librus.pl/informacja", true);
  xhttpNr.send();
}

// ---------------------------------------- GLOBALNA INICJALIZACJA ----------------------------------------

// Co to po komu ta strona startowa?
if (window.location.href == "https://synergia.librus.pl/uczen/index" || window.location.href == "https://synergia.librus.pl/rodzic/index") {
  // Przekierowanie i aktualizacja danych (nr i klasa)
  browserAPI.storage.sync.get(["dane"], function (t) {
    let dane = t["dane"];
    updateDetails(dane, "https://synergia.librus.pl/przegladaj_oceny/uczen");
  });
}

// Jak nie ma proponowanych to kolumny z nimi się w ogóle nie wyświetlają, więc trzeba wiedzieć, gdzie co jest. Pozdro
// JS liczy od 0, CSS od 1
const OFFSET_JS = 2;
const OFFSET_CSS = 3;
const INDICES = {
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
document.querySelectorAll("#body > form:nth-child(5) > div > div > table:first-of-type > thead > tr:nth-child(2) > td").forEach(e => {
  const index = [...e.parentElement.children].indexOf(e);

  if (e.innerText == "Śr.I") INDICES.sredniaI = index;
  if (e.innerText == "(I)") INDICES.proponowaneI = index;
  if (e.innerText == "I") INDICES.srodroczneI = index;

  if (e.innerText == "Śr.II") INDICES.sredniaII = index;
  if (e.innerText == "(II)") INDICES.proponowaneII = index;
  if (e.innerText == "II") INDICES.srodroczneII = index;

  if (e.innerText == "Śr.R") INDICES.sredniaR = index;
  if (e.innerText == "(R)") INDICES.proponowaneR = index;
  if (e.innerText == "R") INDICES.roczne = index;

});
// Oceny bieżące są zawsze jeden przed średnimi
INDICES.ocenyI = INDICES.sredniaI - 1;
INDICES.ocenyII = INDICES.sredniaII - 1;

// ----------------------------------------------- ŚREDNIE -----------------------------------------------

// Liczenie średniej arytmetycznej np. do proponowanych
function getAverage(elements, background, options) {
  if (elements.length < 1)
    return NO_DATA;

  let sum = 0;
  elements.forEach(e => {
    if (e.innerText.length == 1) sum += +e.innerText;
    else if (e.innerText[1] == "+") sum += +e.innerText[0] + +options.plusValue;
    else if (e.innerText[1] == "-") sum += +e.innerText[0] - +options.minusValue;
    else sum += +e.innerText[0];

    if (options.depressionMode) {
      e.parentElement.style.background = background;
    }
  });

  return (Math.round( sum / elements.length  * 100 + Number.EPSILON ) / 100).toFixed(2);
}

// Liczenie średniej ważonej, zwracając uwagę na parametr "Licz do średniej:"
function getWeightedAverage(elements, options) {
  if (elements.length < 1)
    return {
      average: NO_DATA,
      sum: 0,
      weights: 0,
    };

  let sum = 0;
  let weights = 0;
  elements.forEach(e => {
    if (/[0-6][+-]?/.test(e.innerText)) {
      let regexp = /<br>Licz do średniej: (.){3}<br>/gi;
      let liczDoSredniej = (e.title.match(regexp) != null) ? e.title.match(regexp)[0] : "nie";
      liczDoSredniej = liczDoSredniej.replace("<br>Licz do średniej: ", "").replace("<br>", "");
      if (liczDoSredniej == "nie") {
        if (options.depressionMode) {
          e.parentElement.style.setProperty("background", DEPRESSION_MODE_COLORS.other, "important");
        }
        return;
      }

      regexp = /<br>Waga: \d+?<br>/;
      let weight;
      if (e.title.match(regexp) != null) {
        weight = e.title.match(regexp)[0];
      } else {
        if (options.depressionMode) {
          e.parentElement.style.setProperty("background", DEPRESSION_MODE_COLORS.other, "important");
        }
        return;
      }
      weight = weight.replace("<br>Waga: ", "").replace("<br>", "");
      weights += +weight;

      if (e.innerText.length == 1) sum += (+e.innerText) * weight;
      else if (e.innerText[1] == "+") sum += (+e.innerText[0] + +options.plusValue) * weight;
      else if (e.innerText[1] == "-") sum += (+e.innerText[0] - +options.minusValue) * weight;

      if (options.depressionMode) {
        if (weight == 1) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight1;
        else if (weight == 2) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight2;
        else if (weight == 3) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight3, e.parentElement.style.filter = "brightness(0.8)";
        else if (weight == 4) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight4;
        else if (weight >= 5) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight5;
      }
    }
    else if (options.depressionMode) {
      e.parentElement.style.setProperty("background", DEPRESSION_MODE_COLORS.other, "important");
    }
  });

  if (sum <= 0)
    return {
      average: NO_DATA,
      sum: 0,
      weights: 0,
    };
  return {
    average: (Math.round( sum / weights  * 100 + Number.EPSILON ) / 100).toFixed(2),
    sum,
    weights,
  };
}

function getYearAverage(semI, semII) {
  if (semI.weights == 0 && semII.weights == 0) return NO_DATA;
  return (Math.round( (semI.sum + semII.sum) / (semI.weights + semII.weights)  * 100 + Number.EPSILON ) / 100).toFixed(2);
}

function insertNoGrades() {
  const noNewGrades = document.createElement("TR");
  noNewGrades.classList = "bolded line1";
  noNewGrades.innerHTML = `<td colspan="64" style="text-align: center;">Brak ocen 😎</td>`;
  const ref = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody");
  if (ref != null) {
    ref.insertBefore(noNewGrades, ref.firstElementChild);
  }
}

function handleGrades(options) {
  if (document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr:nth-child(1):not([name=przedmioty_all])") == null) {
    insertNoGrades();
    return;
  }

  // Tworzenie wiersza ze średnimi
  const srednieTr = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr:nth-child(1)").cloneNode(true);
  if (srednieTr.classList.contains("bolded")) {
    insertNoGrades();
    return;
  }

  const ocenyI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr:not(.bolded) > td:nth-child(${INDICES.ocenyI + OFFSET_CSS}) span.grade-box > a`);
  const proponowaneI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr:not(.bolded) > td:nth-child(${INDICES.proponowaneI + OFFSET_CSS}) > span > a`);
  const srodroczneI = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr > td:nth-child(${INDICES.srodroczneI + OFFSET_CSS}) > span > a`);

  const ocenyII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr > td:nth-child(${INDICES.ocenyII + OFFSET_CSS}) span.grade-box > a`);
  const proponowaneII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr > td:nth-child(${INDICES.proponowaneII + OFFSET_CSS}) > span > a`);
  const srodroczneII = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr > td:nth-child(${INDICES.srodroczneII + OFFSET_CSS}) > span > a`);

  // const ocenyR = [...ocenyI, ...ocenyII];
  const proponowaneR = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr > td:nth-child(${INDICES.proponowaneR + OFFSET_CSS}) > span > a`);
  const roczne = document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr > td:nth-child(${INDICES.roczne + OFFSET_CSS}) > span > a`);

  // Wstawienie średnich w wiersz tabeli
  srednieTr.children[0].innerText = "";
  srednieTr.children[1].innerText = "Średnia";
  srednieTr.children[INDICES.ocenyI + OFFSET_JS].innerText = "";
  srednieTr.children[INDICES.ocenyII + OFFSET_JS].innerText = "";
  srednieTr.classList.add("librusPro_average");

  const ocenyIresult = getWeightedAverage(ocenyI, options);
  srednieTr.children[INDICES.sredniaI + OFFSET_JS].innerText = ocenyIresult.average;

  const ocenyIIresult = getWeightedAverage(ocenyII, options);
  srednieTr.children[INDICES.sredniaII + OFFSET_JS].innerText = ocenyIIresult.average;

  srednieTr.children[INDICES.sredniaR + OFFSET_JS].innerText = getYearAverage(ocenyIresult, ocenyIIresult);

  srednieTr.children[INDICES.srodroczneI + OFFSET_JS].innerText = getAverage(srodroczneI, DEPRESSION_MODE_COLORS.final, options);
  srednieTr.children[INDICES.srodroczneII + OFFSET_JS].innerText = getAverage(srodroczneII, DEPRESSION_MODE_COLORS.final, options);
  srednieTr.children[INDICES.roczne + OFFSET_JS].innerText = getAverage(roczne, DEPRESSION_MODE_COLORS.final, options);

  if (INDICES.proponowaneI > 0) {
    srednieTr.children[INDICES.proponowaneI + OFFSET_JS].innerText = getAverage(proponowaneI, DEPRESSION_MODE_COLORS.proposed, options);
    srednieTr.children[INDICES.proponowaneI + OFFSET_JS].classList.add("right");
  }

  if (INDICES.proponowaneII > 0) {
    srednieTr.children[INDICES.proponowaneII + OFFSET_JS].innerText = getAverage(proponowaneII, DEPRESSION_MODE_COLORS.proposed, options);
    srednieTr.children[INDICES.proponowaneII + OFFSET_JS].classList.add("right");
  }

  if (INDICES.proponowaneR > 0) {
    srednieTr.children[INDICES.proponowaneR + OFFSET_JS].innerText = getAverage(proponowaneR, DEPRESSION_MODE_COLORS.proposed, options);
    srednieTr.children[INDICES.proponowaneR + OFFSET_JS].classList.add("right");
  }

  if (options.calculateAverages)
  {
    document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody").appendChild(srednieTr);

    // Wyświetlanie średnich dla poszczególnych przedmiotów
    // I sem
    document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${INDICES.sredniaI + OFFSET_CSS})`).forEach(e => {
      const grades = e.parentElement.querySelectorAll(`td:nth-child(${INDICES.ocenyI + OFFSET_CSS}) span.grade-box > a`);
      e.innerText = getWeightedAverage(grades, options).average + (DEBUG ? (" (" + e.innerText + ")") : "");
      e.classList.add("right");
    });

    // II sem
    document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${INDICES.sredniaII + OFFSET_CSS})`).forEach(e => {
      const grades = e.parentElement.querySelectorAll(`td:nth-child(${INDICES.ocenyII + OFFSET_CSS}) span.grade-box > a`);
      e.innerText = getWeightedAverage(grades, options).average + (DEBUG ? (" (" + e.innerText + ")") : "");
      e.classList.add("right");
    });

    // Roczna
    document.querySelectorAll(`#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr:nth-child(2n + 1):not(.bolded):not(.librusPro_average) > td:nth-child(${INDICES.sredniaR + OFFSET_CSS})`).forEach(e => {
      const grades = [...e.parentElement.querySelectorAll(`td:nth-child(${INDICES.ocenyI + OFFSET_CSS}) span.grade-box > a`), ...e.parentElement.querySelectorAll(`td:nth-child(${INDICES.ocenyII + OFFSET_CSS}) span.grade-box > a`)];
      e.innerText = getWeightedAverage(grades, options).average + (DEBUG ? (" (" + e.innerText + ")") : "");
      e.classList.add("right");
    });
  }

  // Zmiana koloru ocen z zachowania
  if (options.depressionMode) {
    document.querySelectorAll(".positive-behaviour").forEach((e) => {
      e.style.background = DEPRESSION_MODE_COLORS.positiveBehavior;
    });
    document.querySelectorAll(".negative-behaviour").forEach((e) => {
      e.style.background = DEPRESSION_MODE_COLORS.negativeBehavior;
    });
  }
}

// ---------------------------------------- DODATKI ----------------------------------------

function finalizeDarkTheme() {
  // Zamiany obrazków na ich ciemne wersje
  // Wykresy
  if (document.querySelector("#gradeAverangeGraph > a > img") != null) {
    document.querySelector("#gradeAverangeGraph > a > img").src = browserAPI.runtime.getURL('img/pobierz_wykres_ocen2_dark.png');
  }

  if (document.querySelector("#absenceGraph > img") != null) {
    document.querySelector("#absenceGraph > img").src = browserAPI.runtime.getURL('img/pobierz_wykres_absencji_dark.png');
  }

  // Przyciski w nawigacji
  if (document.querySelector(".fold-start") != null) {
    document.querySelectorAll(".fold-start").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/fold_dark.png'); + ")";});
    document.querySelectorAll(".fold-end").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/foldEnd_dark.png'); + ")";});
    document.querySelectorAll(".fold-end-scroll").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/foldEndScroll_dark.png'); + ")";});
  }

  // Wiadomości
  if (document.querySelector(".tree-first-branch") != null) {
    document.querySelectorAll(".tree-first-branch").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko4_dark.png'); + ")";});
    document.querySelectorAll(".tree-next-branch").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko1_dark.png'); + ")";});
    document.querySelectorAll(".tree-last-branch").forEach(e => {e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko2_dark.png'); + ")";});
  }

  // Plan lekcji, terminarz
  if (document.querySelector('img[src="/images/strzalka_prawo.gif"]') != null) {
    document.querySelectorAll('img[src="/images/strzalka_prawo.gif"]').forEach(e => {
      e.src = browserAPI.runtime.getURL('img/strzalka_prawo.png');
      e.style.filter = "none";
    });
  }

  if (document.querySelector('img[src="/images/strzalka_lewo.gif"]') != null) {
    document.querySelectorAll('img[src="/images/strzalka_lewo.gif"]').forEach(e => {
      e.src = browserAPI.runtime.getURL('img/strzalka_lewo.png');
      e.style.filter = "none";
    });
  }

  // Losowe bordery w tabelach, bo Librus dał losowo w css je na important... pepoWTF...
  if (document.querySelectorAll(".spacing") != null) {
    document.querySelectorAll(".spacing").forEach(e => {e.style.setProperty("border-left", "1px #000000 solid", "important");});
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

  if (document.querySelector('img[src="/images/pomoc_ciemna.png"]') != null) {
    document.querySelectorAll('img[src="/images/pomoc_ciemna.png"]').forEach(e => {
      e.src = browserAPI.runtime.getURL('img/pomoc_ciemna.png');
      e.style.filter = "none";
    });
  }
}

function hideSubjects() {
  document.querySelectorAll("tr[name=przedmioty_all]").forEach((e) => {
    const el = e.previousElementSibling;
    if (el != null && el.children[INDICES.ocenyI + OFFSET_JS].textContent == "Brak ocen" && el.children[INDICES.ocenyII + OFFSET_JS].textContent == "Brak ocen") {
      el.remove();
      e.remove();
    }
  });
}

// Usuwanie jedynek
function hideOnes() {
  // Oceny poprawione (w dodatkowym spanie)
  document.querySelectorAll("span > .grade-box > a:not(#ocenaTest)").forEach(e => {
    if (/[0-1][+-]?/.test(e.innerText)) {
      [...e.parentElement.parentElement.childNodes].forEach(elm => elm.nodeType != 1 && elm.parentNode.removeChild(elm));
      const regex = /<br \/>Poprawa oceny:(.*)/;
      const b = e.parentElement.nextElementSibling;
      if (b != null) b.firstElementChild.title = b.firstElementChild.title.replace(regex, "");
      e.parentElement.remove();
    }
  });

  // Oceny zwykłe
  document.querySelectorAll("td:not(.center) > .grade-box > a:not(#ocenaTest)").forEach(e => {
    if (/[0-1][+-]?/.test(e.innerText)) {
      e.parentElement.remove();
    }
  });

  // (Proponowane) (śród)roczne [obsługa mrugania]
  document.querySelectorAll('td.center > .grade-box > a:not(#ocenaTest)').forEach(e => {
    if (/[0-1][+-]?/.test(e.innerText)) {
      const el = e.parentElement.cloneNode(true);
      e.parentElement.parentElement.appendChild(el);
      el.children[0].innerText = "2";
      el.children[0].classList.add("librusPro_jedynki");
      
      const injectedCode = `$('.librusPro_jedynki').tooltip({track: true,show: {delay: 200,duration: 200},hide: {delay: 100,duration: 200}});`;
      const script = document.createElement('script');
      script.appendChild(document.createTextNode(injectedCode));
      (document.body || document.head || document.documentElement).appendChild(script);

      const other = document.querySelectorAll(`td.center:nth-child(${Array.from(e.parentNode.parentNode.parentNode.children).indexOf(e.parentNode.parentNode) + 1}) > .grade-box > a:not(#ocenaTest)`);
      let color;
      other.forEach((x) => {
        if (x.parentElement.parentElement.querySelectorAll("script").length > 0) return;
        if (color == undefined) color = x.parentElement.style.backgroundColor;
      })
      if (color != undefined) el.style.backgroundColor = color;
      else el.style.backgroundColor = DEFAULT_COLORS.rocznopodobne;
      e.parentElement.remove();
    }
  });
}

// ---------------------------------------- INICJALIZACJA C.D. ----------------------------------------

// Od ostatniego logowania/w tym tygodniu
let odOstLogowania = false;

finalizeDarkTheme();
adjustNavbar();
insertFooter();

if (document.querySelector("#body > form:nth-child(5) > div > h2") != null && document.querySelector("#body > form:nth-child(5) > div > h2").innerHTML.includes("-")) {
  odOstLogowania = true;
}

browserAPI.storage.sync.get(["dane", "options", "aprilfools"], function(t) {
  if (t["aprilfools"] == undefined) {
    const d = new Date();
    if (d.getMonth() == 3 && d.getDate() == 1) aprilfools();
  }

  options = t["options"];
  if (options == null) {
    browserAPI.storage.sync.set({ ["options"]: OPTIONS_DEFAULT });
    return;
  } else {
    for (let p in OPTIONS_DEFAULT) {
      if (!options.hasOwnProperty(p)) {
        browserAPI.storage.sync.set({ ["options"]: OPTIONS_DEFAULT });
        alert("Zaktualizowano wtyczkę LibrusPro. Twoje ustawienia zostały przywrócone do domyślnych.");
        return;
      }
    }
  }

  // Jeśli w widoku ocen
  if (window.location.href == "https://synergia.librus.pl/przegladaj_oceny/uczen") {
    // Ukrywanie przedmiotów bez ocen
    if (options.hideSubjects) {
      hideSubjects();
    }

    // Ukrywanie jedynek
    if (options.hideOnes) {
      hideOnes();
    }

    // Wstawianie średnich i dostosowanie kolorów w wersji depresyjnej
    handleGrades(options);
  }

  let dane = t["dane"];
  if (dane != undefined) {
    adjustHeader(dane);
  } else {
    updateDetails(dane, "https://synergia.librus.pl/przegladaj_oceny/uczen");
  }

});

// --------------------------------------------------------------------------------------------

// szósteczki - maybe kiedyś
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {if (/[0-6][+-]?/.test(e.innerText)) e.innerText = "6"});
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach(e => {if (/[0-6][+-]?/.test(e.innerText)) e.innerText = Math.floor(Math.random() * (7 - 4) + 4)});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(4)").forEach(e => {e.innerText = "6.00"});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(10)").forEach(e => {e.innerText = "6.00"});
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(5)").innerText = "wzorowe";
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)").innerText = "wzorowe";

// ---------------------------------------- ZACHOWANIE ----------------------------------------

// Proponowane zachowanie do tabeli głównej
function insertProposedBehavior() {

  // Pobranie elementów z proponowanym zachowaniem z rozwinięcia
  let propZachSrodroczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table:first-of-type > tbody");
  let propZachRoczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table:first-of-type > tbody");

  if (propZachSrodroczne == null || propZachRoczne == null) return;
  propZachSrodroczne = propZachSrodroczne.querySelectorAll("[colspan='3']")[0];
  propZachRoczne = propZachRoczne.querySelectorAll("[colspan='3']")[2];
  if (propZachSrodroczne == null || propZachRoczne == null) return;

  // Pobranie wartości proponowanego zachowania
  propZachSrodroczne = propZachSrodroczne.innerText.split(': ')[1];
  propZachRoczne = propZachRoczne.innerText.split(': ')[1];
  if (propZachSrodroczne == null) return;
  if (propZachSrodroczne != null && propZachRoczne == null) propZachRoczne = NO_DATA;

  // Elementy zachowania (śród)rocznego (i proponowanego) [niezmienne od proponowanych ocen I, II i R]
  const zachSrodroczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr.bolded > td:nth-child(4)");
  const zachRoczneElement = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr.bolded > td:nth-child(6)");
  const propZachSrodroczneElement = zachSrodroczneElement.cloneNode(true);
  const propZachRoczneElement = zachRoczneElement.cloneNode(true);
  
  // "-", bądź ocena z zachowania
  propZachSrodroczneElement.innerText = propZachSrodroczne || NO_DATA;
  propZachRoczneElement.innerText = propZachRoczne || NO_DATA;
  
  // Stylizacja proponowanych zachowań
  propZachSrodroczneElement.style.fontStyle = "italic";
  propZachRoczneElement.style.fontStyle = "italic";
  propZachSrodroczneElement.style.fontWeight = "normal";
  propZachRoczneElement.style.fontWeight = "normal";
  
  // Wstawienie stworzonych elementów
  zachSrodroczneElement.parentElement.insertBefore(propZachSrodroczneElement, zachSrodroczneElement);
  zachRoczneElement.parentElement.insertBefore(propZachRoczneElement, zachRoczneElement);
  
  // Zwężenie komórek, aby zrobić miejsce na nowe i wypełnić wiersz
  document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr.bolded > td:nth-child(3)").colSpan = "1";
  propZachSrodroczneElement.colSpan = INDICES.proponowaneI != -1 ? "2" : "1";
  zachSrodroczneElement.nextElementSibling.colSpan = "1";
  propZachRoczneElement.colSpan = INDICES.proponowaneII != -1 ? "3" : "2";
  zachRoczneElement.colSpan = INDICES.proponowaneR != -1 ? "3" : "2";
}

// ---------------------------------------- WIZUALNE ----------------------------------------

// Schowanie paska z zachowaniem i wywołanie funkcji go dodającej, jeśli znajdujemy się na odpowiedniej stronie
if (window.location.href == "https://synergia.librus.pl/przegladaj_oceny/uczen") {
  if (odOstLogowania) {
    // Ukryj całkowicie zachowanie
    document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr.bolded").style.display = "none";
  }
  else {
    // Zwiń zachowanie
    const injectedCode = 'showHide.ShowHide("zachowanie")';
    const script = document.createElement('script');
    script.appendChild(document.createTextNode('('+ injectedCode +');'));
    (document.body || document.head || document.documentElement).appendChild(script);

    // Dodaj proponowane
    insertProposedBehavior();
  }
}

// Plan lekcji do navbara
function adjustNavbar() {
  const navBarElement = document.querySelector("#main-menu > ul > li:nth-child(3)");
  if (navBarElement == null) return;
  const planLekcji = navBarElement.cloneNode();
  // planLekcji.children[0].href = "javascript:otworz_w_nowym_oknie('/przegladaj_plan_lekcji','plan_u',0,0)";
  // planLekcji.children[0].href = "https://synergia.librus.pl/przegladaj_plan_lekcji";
  // planLekcji.children[0].setAttribute("target", "_blank");
  const planLekcjiElement = document.createElement("A");
  planLekcjiElement.innerText = "Plan lekcji";
  planLekcjiElement.style.cursor = "pointer";
  planLekcjiElement.addEventListener("mouseup", function() {
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

// Wyświetlanie numeru z dziennika obok szczęśliwego + informacja gdy nim jest Twój
function adjustHeader(dane) {
  const numerek = document.querySelector("#user-section > span.luckyNumber");
  const numerekDisabled = document.querySelector("#user-section > a > span.luckyNumber");

  let yourNumber = document.createElement("SPAN");
  yourNumber.innerText = "Twój numerek w dzienniku: ";
  const number = document.createElement("B");
  number.style.color = "#eeeeee";
  yourNumber.appendChild(number);

  if (numerek != null) {
    number.innerText = dane.nr;
    if (document.querySelector("#user-section > span.luckyNumber > b").innerText == dane.nr) {
      const gratulacje = document.createElement("SPAN");
      gratulacje.style.color = "lime";
      gratulacje.style.marginLeft = "5px";
      gratulacje.innerText = "GRATULACJE!";
      yourNumber.appendChild(gratulacje);
    }
    numerek.parentElement.insertBefore(yourNumber, numerek.nextSibling);
  } else if (numerekDisabled != null) {
    number.innerText = dane.nr;
    numerekDisabled.parentElement.parentElement.insertBefore(yourNumber, numerekDisabled.parentElement.nextSibling);
  }

  const hakerzy = document.querySelector("#user-section > img");
  if (hakerzy != null) {
    hakerzy.title += "<br><b style='color: #ee9999'>❗❗ HAKERZY ATAKUJĄ! ❗❗</b>"
  }

  const uczen = document.querySelector("#user-section > b > img");
  if (uczen != null) {
    uczen.title = "<b style='color: #a96fe3'>Dzięki za korzystanie z rozszerzenia LibrusPro!</b><br><b style='color: #ffd128'>Jeżeli Ci się spodobało, nie zapomnij zostawić<br>5 gwiazdek w sklepie oraz polecić znajomym!</b><br><b style='color: #ff7ca0'><i>Jedz Buraczki!</i></b>"
  }

  const bezpiecznyUczen = document.querySelector("a[title=\"Bezpieczny Uczeń\"]");
  if (bezpiecznyUczen != null) {
    bezpiecznyUczen.parentElement.remove();
  }
}

// Copyright
function insertFooter() {
  const footer = document.querySelector("#footer");
  if (footer == null) return;
  footer.innerHTML = `
  <div id="footer"><hr>
  <span id="bottom-logo"></span>
  <div class="librusPro_footer-img" style="
  background: url(&quot;` + browserAPI.runtime.getURL('img/icon.png') + `&quot;);">
  </div>
  <div style="margin-left: 5px; vertical-align: top; display: inline-flex;">
  <div style="color: rgb(153, 153, 153); cursor: vertical-text;">
  <div>LibrusPro © ` + new Date().getFullYear() + ` Maks Kowalski</div>
  <div><a href="https://discord.gg/e9EkVEvsDr" target="_blank" class="librusPro_footer-link">Oficjalny Discord!</a></div>
  </div>
  </div>
  </div>`
}

// KEKW
function aprilfools() {
  if (document.getElementById("icon-oceny") == null) return;
  if (document.getElementById("liczba_ocen_od_ostatniego_logowania_form") != null) {
    const a = document.querySelector(`a[href="javascript:$('#liczba_ocen_od_ostatniego_logowania_form').submit();"]`);
    if (a == null) return;
    a.innerText = +a.innerText + 2;
  } else {
    const f = document.createElement("FORM");
    const a = document.createElement("A");
    f.innerHTML = '<input type="hidden" name="zmiany_logowanie" value="zmiany_logowanie">';
    f.action = "https://synergia.librus.pl/przegladaj_oceny/uczen";
    f.method = "POST";
    f.id = "liczba_ocen_od_ostatniego_logowania_form";
    f.classList.add("hidden");
    a.innerText = "2";
    a.href = "javascript:$('#liczba_ocen_od_ostatniego_logowania_form').submit();";
    a.classList.add("button","counter","blue");
    document.getElementById("icon-oceny").appendChild(f);
    document.getElementById("icon-oceny").appendChild(a);
  }

  let pp = INDICES.ocenyII + OFFSET_JS;
  if (odOstLogowania) {
    pp = 5;
  }
  document.querySelectorAll("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr > td:nth-child(2)").forEach(e => {
    if (e.innerText.toLowerCase().includes("polski") && !document.getElementById("polski")) {
      const n = document.createElement("SPAN");
      n.innerHTML = `<a id="polski" class="ocena" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">1</a>`;
      n.classList.add("grade-box");
      n.style.background = "#00FF00";
      const el = e.parentElement.children[pp];
      if (el.innerText == "Brak ocen") el.innerText = "";
      el.appendChild(n);
      document.getElementById("polski").title = `Kategoria: Kartkówka niezapowiedziana<br>Data: 2021-04-01 (czw.)<br>Nauczyciel: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br>Licz do średniej: tak<br>Waga: 3<br>Dodał: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br/><br/>Komentarz: Prima Aprilis<br/><span style="color: #777777; padding-left: 5px; font-style: italic">Kliknij mnie, aby ukryć.</span>`;
      const injectedCode = `$('#polski').tooltip({
        track: true,
        show: {
          delay: 200,
          duration: 200
        },
        hide: {
          delay: 100,
          duration: 200
        }
      });`;
      const script = document.createElement('script');
      script.appendChild(document.createTextNode(injectedCode));
      (document.body || document.head || document.documentElement).appendChild(script);
    } else if (e.innerText.toLowerCase().includes("matematyka") && !document.getElementById("matma")) {
      const n = document.createElement("SPAN");
      n.innerHTML = `<a id="matma" class="ocena" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">1</a>`;
      n.classList.add("grade-box");
      n.style.background = "#FF0000";
      const el = e.parentElement.children[pp];
      if (el.innerText == "Brak ocen") el.innerText = "";
      el.appendChild(n);
      document.getElementById("matma").title = `Kategoria: Praca klasowa<br>Data: 2021-04-01 (czw.)<br>Nauczyciel: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br>Licz do średniej: tak<br>Waga: 5<br>Dodał: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br/><br/>Komentarz: Prima Aprilis<br/><span style="color: #777777; padding-left: 5px; font-style: italic">Kliknij mnie, aby ukryć.</span>`;
      const injectedCode = `$('#matma').tooltip({
        track: true,
        show: {
          delay: 200,
          duration: 200
        },
        hide: {
          delay: 100,
          duration: 200
        }
      });`;
      const script = document.createElement('script');
      script.appendChild(document.createTextNode(injectedCode));
      (document.body || document.head || document.documentElement).appendChild(script);
    }
  });
  if (document.getElementById("matma") != null) document.getElementById("matma").addEventListener('click', function() {
    browserAPI.storage.sync.set({ ["aprilfools"]: false });
  });
  if (document.getElementById("polski") != null) document.getElementById("polski").addEventListener('click', function() {
    browserAPI.storage.sync.set({ ["aprilfools"]: false });
  });
}

// Prace domowe
if (window.location.href == "https://synergia.librus.pl/moje_zadania") {
  document.querySelectorAll('tr[id^="homework_"] > td.bold:first-child').forEach(e => {
    e.parentElement.classList.add("librusPro_newHomework");
  });

  document.querySelectorAll('img[src*="aktywne.png"]').forEach(e => {
    e.parentElement.parentElement.classList.add("librusPro_doneHomework");
  });

  document.querySelectorAll('[style="padding:5px"]').forEach(e => {
    const s = document.createElement("SPAN");
    s.innerText = "(" + e.innerText + ")";
    s.style.fontWeight = "bold";
    s.style.paddingLeft= "5px";
    e.previousElementSibling.appendChild(s);
    e.remove();
  });

  document.querySelectorAll("#body > div > div > table > thead > tr > td:nth-child(5), #body > div > div > table > thead > tr > td:nth-child(6)").forEach(e => {
    e.colSpan = 1;
  });
}