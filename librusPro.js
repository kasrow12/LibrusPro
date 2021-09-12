// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

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
  countToAverage: false,
  plusValue: 0.5,
  minusValue: 0.25,
  debug: false,
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

console.log("%cDzięki za korzystanie z rozszerzenia LibrusPro!", "color:#ce84c8;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold");
console.log("%cJeśli znajduje się tutaj cokolwiek czerwonego i coś nie działa, proszę zgłoś to:", "color:#d63d4a;font-size:1rem;font-weight:bold");
console.log(" %cOficjalny Discord: https://discord.gg/e9EkVEvsDr", "color:#90e9f0;");

browserAPI.storage.onChanged.addListener((changes, namespace) => {
  for (let key in changes) {
    if (key === "options") {
      window.location.replace(window.location.href);
    }
  }
});

// Aktualizacja numerku, klasy i planu lekcji [klasa z widoku ocen = 3a LO, a klasa z informacji = 3 a LO -> dlatego w taki sposób :)]
function updateDetails(dane, href) {
  const nrRegex = /<th class="big">Nr w dzienniku <\/th>\s*?<td>\s*?(\d*)\s*?<\/td>/;
  const xhttpNr = new XMLHttpRequest();
  xhttpNr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let nr = this.responseText.match(nrRegex);
      if (nr != null) {
        nr = nr[1];
      }
      const klasaRegex = /<b>Klasa: <\/b>(.*)&nbsp;<\/p>/;
      const xhttpKlasa = new XMLHttpRequest();
      xhttpKlasa.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          let klasa = this.responseText.match(klasaRegex);
          if (klasa != null) {
            klasa = klasa[1];
          }

          if (!dane || nr != dane.nr || klasa != dane.currentClass) {
            let temp = DANE_DEFAULT;
            if (klasa != null) temp.currentClass = klasa;
            if (nr != null) temp.nr = nr;
            browserAPI.storage.sync.set({
              ["dane"]: temp
            });
          }

          // const przedmioty = new Set();
          const planLekcji = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            "dzwonki": [],
          };
          const xhttpPlan = new XMLHttpRequest();
          xhttpPlan.responseType = "document";
          xhttpPlan.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              this.response.querySelectorAll("#body > div > div > form > table.decorated.plan-lekcji > tbody > tr.line1").forEach((e) => {
                const nr = e.firstElementChild.innerText;
                const godz = e.childNodes[1].innerText;
                e.querySelectorAll(".line1").forEach((el) => {
                  planLekcji.dzwonki[nr] = godz;
                  const b = el.querySelector(".text > b");
                  if (!b) return;
                  const dzienTyg = [...el.parentElement.children].indexOf(el) - 2;
                  planLekcji[dzienTyg][nr] = b.innerText;
                });
              });
              // this.response.querySelectorAll("#timetableEntryBox > div > b").forEach((e) => {
                // przedmioty.add(e.innerText);
              // });
              browserAPI.storage.sync.set({
                ["plan"]: planLekcji
              });
              document.location.replace(href);
            }
          };
          xhttpPlan.open("GET", "https://synergia.librus.pl/przegladaj_plan_lekcji", true);
          xhttpPlan.send();
        }
      };
      xhttpKlasa.open("GET", "https://synergia.librus.pl/przegladaj_oceny/uczen", true);
      xhttpKlasa.send();
    }
  };
  xhttpNr.open("GET", "https://synergia.librus.pl/informacja", true);
  xhttpNr.send();
}

// ---------------------------------------- GLOBALNA INICJALIZACJA ----------------------------------------

// Klasa do wklejania do własnych wydarzeń np. XD LO
let currentClass;

// Co to po komu ta strona startowa?
if (window.location.href == "https://synergia.librus.pl/uczen/index" || window.location.href == "https://synergia.librus.pl/rodzic/index") {
  // Przekierowanie i aktualizacja danych (nr i klasa)
  browserAPI.storage.sync.get(["dane"], function (t) {
    let dane = t["dane"];
    updateDetails(dane, "https://synergia.librus.pl/przegladaj_oceny/uczen");
  });
} else if (window.location.href == "https://synergia.librus.pl/terminarz") {
  browserAPI.storage.sync.get(["dane"], function (t) {
    let dane = t["dane"];
    if (dane && dane.currentClass != null) {
      currentClass = dane.currentClass;
    } else {
      updateDetails(dane, "https://synergia.librus.pl/terminarz");
    }
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
document.querySelectorAll("#body > form:nth-child(5) > div > div > table:first-of-type > thead > tr:nth-child(2) > td").forEach((e) => {
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
  let sum = 0;
  let count = 0;
  elements.forEach((e) => {
    if (options.depressionMode) e.parentElement.style.background = background;
    if (!options.countZeros && e.innerText[0] === "0") return;

    if (/[0-6][+-]?/.test(e.innerText)) {
      sum += +e.innerText[0];
      count++;
      if (e.innerText.length > 1) {
        if (e.innerText[1] == "+") sum += +options.plusValue;
        else if (e.innerText[1] == "-") sum += +options.minusValue;
      }
    }
  });
  if (count == 0) return NO_DATA;
  return (Math.round(sum / count * 100 + Number.EPSILON) / 100).toFixed(2);
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
  elements.forEach((e) => {
    if (/[0-6][+-]?/.test(e.innerText)) {
      let regexp = /<br>Licz do średniej: (tak|nie)<br>/;
      let liczDoSredniej = (e.title.match(regexp) != null) ? e.title.match(regexp)[1] : "nie";
      if ((liczDoSredniej == "nie" && !options.countToAverage) || (!options.countZeros && e.innerText[0] == "0")) {
        if (options.depressionMode) {
          e.parentElement.style.setProperty("background", DEPRESSION_MODE_COLORS.other, "important");
        }
        return;
      }

      let weight;
      if (liczDoSredniej == "nie" && options.countToAverage) {
        weight = 1;
        weights += +weight;
      } else {
        regexp = /<br>Waga: (\d+?)<br>/;
        if (e.title.match(regexp) != null) {
          weight = e.title.match(regexp)[1];
        } else {
          if (options.depressionMode) {
            e.parentElement.style.setProperty("background", DEPRESSION_MODE_COLORS.other, "important");
          }
          return;
        }
        weights += +weight;

        if (options.depressionMode) {
          if (weight == 1) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight1;
          else if (weight == 2) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight2;
          else if (weight == 3) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight3, e.parentElement.style.filter = "brightness(0.8)";
          else if (weight == 4) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight4;
          else if (weight >= 5) e.parentElement.style.background = DEPRESSION_MODE_COLORS.weight5;
        }
      }

      if (e.innerText.length == 1) sum += (+e.innerText) * weight;
      else if (e.innerText[1] == "+") sum += (+e.innerText[0] + +options.plusValue) * weight;
      else if (e.innerText[1] == "-") sum += (+e.innerText[0] - +options.minusValue) * weight;
    } else if (options.depressionMode) {
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
    average: (Math.round(sum / weights * 100 + Number.EPSILON) / 100).toFixed(2),
    sum,
    weights,
  };
}

function getYearAverage(semI, semII) {
  if (semI.weights == 0 && semII.weights == 0) return {
      average: NO_DATA,
      sum: 0,
      weights: 0,
    };
  return {
    average: (Math.round((semI.sum + semII.sum) / (semI.weights + semII.weights) * 100 + Number.EPSILON) / 100).toFixed(2),
    sum: semI.sum + semII.sum,
    weights: semI.weights + semII.weights,
  };
}

function insertNoGrades() {
  const noNewGrades = document.createElement("TR");
  noNewGrades.classList = "bolded line1";
  noNewGrades.innerHTML = `<td colspan="64" style="text-align: center;">Brak ocen 😎</td>`;
  const ref = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody");
  if (ref) {
    ref.insertBefore(noNewGrades, ref.firstElementChild);
  }
}

function handleGrades(options) {
  if (!document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr:nth-child(1):not([name=przedmioty_all])")) {
    insertNoGrades();
    return;
  }

  // Tworzenie wiersza ze średnimi
  const srednieTr = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr:nth-child(1)").cloneNode(true);
  if (srednieTr.classList.contains("bolded")) {
    insertNoGrades();
    return;
  }

  const tbody = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody");
  const proponowaneI = tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneI + OFFSET_CSS}) > span > a`);
  const srodroczneI = tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.srodroczneI + OFFSET_CSS}) > span > a`);
  const proponowaneII = tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneII + OFFSET_CSS}) > span > a`);
  const srodroczneII = tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.srodroczneII + OFFSET_CSS}) > span > a`);
  const proponowaneR = tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneR + OFFSET_CSS}) > span > a`);
  const roczne = tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.roczne + OFFSET_CSS}) > span > a`);

  const averages = [];
  const rows = document.querySelectorAll('#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr:not(.bolded):not([id^="przedmioty"]');

  // Średnia z I i II okresu
  let avgI = {
    sum: 0,
    weights: 0,
  };
  let avgII = {
    sum: 0,
    weights: 0,
  };
  let errors = [];
  // Średnie dla poszczególnych przedmiotów
  for (let i = 0; i < rows.length; i++) {
    const averageI = getWeightedAverage(rows[i].querySelectorAll(`td:nth-child(${INDICES.ocenyI + OFFSET_CSS}) span.grade-box > a`), options);
    const averageII = getWeightedAverage(rows[i].querySelectorAll(`td:nth-child(${INDICES.ocenyII + OFFSET_CSS}) span.grade-box > a`), options);
    const averageR = getYearAverage(averageI, averageII);
    averages[i] = [averageI, averageII, averageR];
    avgI.sum += averageI.sum;
    avgI.weights += averageI.weights;
    avgII.sum += averageII.sum;
    avgII.weights += averageII.weights;

    // Wyświetlanie
    if (options.calculateAverages) {
      const averageIel = rows[i].children[INDICES.sredniaI + OFFSET_JS];
      if (averageIel.innerText.length > 2 && (averageIel.innerText != averageI.average)) {
        errors.push(averageIel);
        averageIel.innerText = `${averageI.average} (${averageIel.innerText})`;
      } else {
        averageIel.innerText = averageI.average + (options.debug ? ` (${averageIel.innerText}) [${averageI.sum}; ${averageI.weights}]` : "");
      }

      const averageIIel = rows[i].children[INDICES.sredniaII + OFFSET_JS];
      if (averageIIel.innerText.length > 2 && (averageIIel.innerText != averageII.average)) {
        errors.push(averageIIel);
        averageIIel.innerText = `${averageII.average} (${averageIIel.innerText})`;
      } else {
        averageIIel.innerText = averageII.average + (options.debug ? ` (${averageIIel.innerText}) [${averageII.sum}; ${averageII.weights}]` : "");
      }

      const averageRel = rows[i].children[INDICES.sredniaR + OFFSET_JS];
      if (averageRel.innerText.length > 2 && (averageRel.innerText != averageR.average)) {
        errors.push(averageRel);
        averageRel.innerText = `${averageR.average} (${averageRel.innerText})`;
      } else {
        averageRel.innerText = averageR.average + (options.debug ? ` (${averageRel.innerText}) [${averageR.sum}; ${averageR.weights}]` : "");
      }

      averageIel.classList.add("right");
      averageIIel.classList.add("right");
      averageRel.classList.add("right");
    }
  }
  if (errors.length > 0) {
    const legend = document.querySelector("#body > form:nth-child(5) > div > div > div.legend.left.stretch > h3");
    legend.innerText = "[LibrusPro] » Przynajmniej jedna z obliczonych średnich przez LibrusaPro różni się od tej wyliczonej przez Librusa Synergię (poprawna znajduje się w nawiasach). Możesz dostosować pewne parametry uwzględniane przy jej liczeniu w menu ustawień rozszerzenia. Aby uzyskać więcej informacji i pomóc w eliminacji potencjalnego błędu, skontaktuj się ze mną na Discordzie. (Link na dole strony)";
    console.log("%c[LibrusPro] » Przynajmniej jedna z obliczonych średnich przez LibrusaPro różni się od tej wyliczonej przez Librusa Synergię (poprawna znajduje się w nawiasach). Możesz dostosować pewne parametry uwzględniane przy jej liczeniu w menu ustawień rozszerzenia. Aby uzyskać więcej informacji i pomóc w eliminacji potencjalnego błędu, skontaktuj się ze mną na Discordzie. (Link na dole strony)", "color: #ff5555;");
    legend.id = "error_legend";
    const cl = document.createElement("DIV");
    cl.innerText = "X";
    cl.onclick = () => document.getElementById("error_legend").style.display = "none";
    cl.classList.add("librusPro_error-close");
    legend.appendChild(cl);
    if (options.debug) {
      errors.forEach((e) => {
        e.style.setProperty("color", "#ff5555", "important");
      });
    }
  }

  // Wstawienie średnich w wiersz tabeli
  srednieTr.children[0].innerText = "";
  srednieTr.children[1].innerText = "Średnia";
  srednieTr.children[INDICES.ocenyI + OFFSET_JS].innerText = "";
  srednieTr.children[INDICES.ocenyII + OFFSET_JS].innerText = "";
  srednieTr.children[INDICES.sredniaI + OFFSET_JS].innerText = avgI.weights > 0 ? (Math.round(avgI.sum / avgI.weights * 100 + Number.EPSILON) / 100).toFixed(2) : NO_DATA;
  srednieTr.children[INDICES.sredniaII + OFFSET_JS].innerText = avgII.weights > 0 ? (Math.round(avgII.sum / avgII.weights * 100 + Number.EPSILON) / 100).toFixed(2) : NO_DATA;
  srednieTr.children[INDICES.sredniaR + OFFSET_JS].innerText = getYearAverage(avgI, avgII).average;
  srednieTr.children[INDICES.srodroczneI + OFFSET_JS].innerText = getAverage(srodroczneI, DEPRESSION_MODE_COLORS.final, options);
  srednieTr.children[INDICES.srodroczneII + OFFSET_JS].innerText = getAverage(srodroczneII, DEPRESSION_MODE_COLORS.final, options);
  srednieTr.children[INDICES.roczne + OFFSET_JS].innerText = getAverage(roczne, DEPRESSION_MODE_COLORS.final, options);
  srednieTr.classList.add("librusPro_average");

  if (INDICES.proponowaneI > 0)
    srednieTr.children[INDICES.proponowaneI + OFFSET_JS].innerText = getAverage(proponowaneI, DEPRESSION_MODE_COLORS.proposed, options);

  if (INDICES.proponowaneII > 0)
    srednieTr.children[INDICES.proponowaneII + OFFSET_JS].innerText = getAverage(proponowaneII, DEPRESSION_MODE_COLORS.proposed, options);

  if (INDICES.proponowaneR > 0)
    srednieTr.children[INDICES.proponowaneR + OFFSET_JS].innerText = getAverage(proponowaneR, DEPRESSION_MODE_COLORS.proposed, options);

  // Poświetlenie średniej zaliczającej się na czerwony pasek
  if (!odOstLogowania) {
    for (const type of ["proponowaneR", "roczne"]) {
      const node = srednieTr.children[INDICES[type] + OFFSET_JS];
      if (+node.innerText >= 4.75) {
        node.style.setProperty("background", "linear-gradient(90deg, #cacaca 50%, #b53232 50%)", "important");
        node.style.setProperty("color", "#000000", "important");
      }
    }
  }

  if (options.calculateAverages) {
    tbody.appendChild(srednieTr);
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
  document.querySelectorAll("#gradeAverangeGraph > a > img").forEach((e) => {
    e.src = browserAPI.runtime.getURL('img/pobierz_wykres_ocen2_dark.png');
  });

  document.querySelectorAll("#absenceGraph > img").forEach((e) => {
    e.src = browserAPI.runtime.getURL('img/pobierz_wykres_absencji_dark.png');
  });

  // Przyciski w nawigacji
  document.querySelectorAll(".fold-start").forEach((e) => {
    e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/fold_dark.png'); + ")";
  });
  document.querySelectorAll(".fold-end").forEach((e) => {
    e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/foldEnd_dark.png'); + ")";
  });
  document.querySelectorAll(".fold-end-scroll").forEach((e) => {
    e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/foldEndScroll_dark.png'); + ")";
  });

  // Wiadomości
  document.querySelectorAll(".tree-first-branch").forEach((e) => {
    e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko4_dark.png'); + ")";
  });
  document.querySelectorAll(".tree-next-branch").forEach((e) => {
    e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko1_dark.png'); + ")";
  });
  document.querySelectorAll(".tree-last-branch").forEach((e) => {
    e.style.backgroundImage = "url(" + browserAPI.runtime.getURL('img/drzewko2_dark.png'); + ")";
  });

  // Plan lekcji, terminarz
  document.querySelectorAll('img[src="/images/strzalka_prawo.gif"]').forEach((e) => {
    e.src = browserAPI.runtime.getURL('img/strzalka_prawo.png');
    e.style.filter = "none";
  });

  document.querySelectorAll('img[src="/images/strzalka_lewo.gif"]').forEach((e) => {
    e.src = browserAPI.runtime.getURL('img/strzalka_lewo.png');
    e.style.filter = "none";
  });

  // Losowe bordery w tabelach, bo Librus dał losowo w css je na important... pepoWTF...
  document.querySelectorAll(".spacing").forEach((e) => {
    e.style.setProperty("border-left", "1px #222222 solid", "important");
  });

  document.querySelectorAll('.no-border-left[title="Średnia ocen<br> z pierwszego okresu"]').forEach((e) => {
    e.style.setProperty("border-left", "1px #222222 solid", "important");
  });

  document.querySelectorAll("table.decorated table thead th, table.decorated table thead td").forEach((e) => {
    e.style.setProperty("border-left", "1px #222222 solid", "important");
  });

  if (window.location.href == "https://synergia.librus.pl/przegladaj_plan_lekcji") {
    document.querySelectorAll(".border-top").forEach((e) => {
      e.style.setProperty("border-top", "1px #222222 solid", "important");
      e.style.setProperty("border-left", "1px #222222 solid", "important");
    });
    document.querySelectorAll(".border-right").forEach((e) => {
      e.style.setProperty("border-right", "1px #222222 solid", "important");
    });
    document.querySelectorAll("#body > div > div > form > table.decorated.plan-lekcji > tbody > tr > td").forEach((e) => {
      e.style.setProperty("border-bottom", "0", "important");
    });
  }

  document.querySelectorAll("table.decorated.filters td, table.decorated.filters th").forEach((e) => {
    e.style.setProperty("border-color", "#222222", "important");
  });

  document.querySelectorAll('img[src*="pomoc_ciemna.png"]').forEach((e) => {
    e.src = browserAPI.runtime.getURL('img/pomoc_ciemna.png');
    e.style.filter = "none";
  });

  // Podświetlenie nowych wiadomości
  document.querySelectorAll('#formWiadomosci > div > div > table > tbody > tr > td:nth-child(2) > table.decorated.stretch > tbody > tr > td[style="font-weight: bold;"]:nth-child(3)').forEach((e) => {
    e.parentElement.classList.add("librusPro_new");
  });

  // "Podgląd średniej ocen został wyłączony przez administratora szkoły."
  document.querySelectorAll(`.line0 > td > img[src*="pomoc_ciemna"], .line1 > td > img[src*="pomoc_ciemna"]`).forEach((e) => {
    e.parentElement.classList.add("center");
  })
}

// Ukrywanie przedmiotów
function hideSubjects() {
  document.querySelectorAll("tr[name=przedmioty_all]").forEach((e) => {
    const el = e.previousElementSibling;
    // Wiersz z zachowaniem nie zostaje usunięty, poza nim wszystkie bez ocen
    if (el && !el.classList.contains("bolded") && (!el.querySelectorAll(".grade-box") || el.querySelectorAll(".grade-box").length < 1)) {
      el.remove();
      e.remove();
    }
  });
}

// Usuwanie jedynek
function hideOnes() {
  // Oceny poprawione (w dodatkowym spanie)
  document.querySelectorAll("span > .grade-box > a:not(#ocenaTest)").forEach((e) => {
    if (/[0-1][+-]?/.test(e.innerText)) {
      [...e.parentElement.parentElement.childNodes].forEach(elm => elm.nodeType != 1 && elm.parentNode.removeChild(elm));
      const regex = /<br \/>Poprawa oceny:(.*)/;
      const b = e.parentElement.nextElementSibling;
      if (b) b.firstElementChild.title = b.firstElementChild.title.replace(regex, "");
      e.parentElement.remove();
    }
  });

  // Oceny zwykłe
  document.querySelectorAll("td:not(.center) > .grade-box > a:not(#ocenaTest)").forEach((e) => {
    if (/[0-1][+-]?/.test(e.innerText)) {
      e.parentElement.remove();
    }
  });

  // (Proponowane) (śród)roczne [obsługa mrugania]
  document.querySelectorAll('td.center > .grade-box > a:not(#ocenaTest)').forEach((e) => {
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

adjustNavbar();
insertFooter();
disableAutoLogout();

if (document.querySelector("#body > form:nth-child(5) > div > h2") && document.querySelector("#body > form:nth-child(5) > div > h2").innerHTML.includes("-")) {
  odOstLogowania = true;
}

browserAPI.storage.sync.get(["dane", "options", "aprilfools"], function (t) {
  if (t["aprilfools"] == undefined) {
    const d = new Date();
    if (d.getMonth() == 3 && d.getDate() == 1) aprilfools();
  }

  let options = t["options"];
  if (!options) {
    browserAPI.storage.sync.set({
      ["options"]: OPTIONS_DEFAULT
    });
    return;
  } else {
    for (let p in OPTIONS_DEFAULT) {
      if (!options.hasOwnProperty(p)) {
        let t = OPTIONS_DEFAULT;
        for (let u in options) {
          t[u] = options[u];
        }
        browserAPI.storage.sync.set({
          ["options"]: t
        });
        alert("Zaktualizowano wtyczkę LibrusPro do wersji " + browserAPI.runtime.getManifest().version + "! Nie zapomnij polecić znajomym!");
        return;
      }
    }
  }

  if (options.darkTheme) {
    finalizeDarkTheme();
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

  if (options.debug) {
    console.log("[LibrusPro] » Debugging enabled.");
    browserAPI.storage.sync.get(null, function (result) {
      console.log("[LibrusPro] » Chrome storage data:", result);
      // console.log("[LibrusPro] » Chrome storage data:", JSON.stringify(result));
    });
  }

});

// --------------------------------------------------------------------------------------------

// szósteczki - maybe kiedyś
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach((e) => {if (/[0-6][+-]?/.test(e.innerText)) e.innerText = "6"});
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach((e) => {if (/[0-6][+-]?/.test(e.innerText)) e.innerText = Math.floor(Math.random() * (7 - 4) + 4)});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(4)").forEach((e) => {e.innerText = "6.00"});
// document.querySelectorAll("#body > form:nth-child(5) > div > div > table > tbody > tr:not(.bolded) > td:nth-child(10)").forEach((e) => {e.innerText = "6.00"});
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(5)").innerText = "wzorowe";
// document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)").innerText = "wzorowe";

// ---------------------------------------- ZACHOWANIE ----------------------------------------

// Proponowane zachowanie do tabeli głównej
function insertProposedBehavior() {

  // Pobranie elementów z proponowanym zachowaniem z rozwinięcia
  let propZachSrodroczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table:first-of-type > tbody");
  let propZachRoczne = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table:first-of-type > tbody");

  if (!propZachSrodroczne || !propZachRoczne) return;
  propZachSrodroczne = propZachSrodroczne.querySelectorAll("[colspan='3']")[0];
  propZachRoczne = propZachRoczne.querySelectorAll("[colspan='3']")[2];
  if (!propZachSrodroczne || !propZachRoczne) return;

  // Pobranie wartości proponowanego zachowania
  propZachSrodroczne = propZachSrodroczne.innerText.split(': ')[1];
  propZachRoczne = propZachRoczne.innerText.split(': ')[1];
  if (!propZachSrodroczne) return;
  if (propZachSrodroczne && !propZachRoczne) propZachRoczne = NO_DATA;

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
    const zachowanieTr = document.querySelector("#body > form:nth-child(5) > div > div > table > tbody > tr.bolded");
    let toRemove = true;
    zachowanieTr.querySelectorAll(".center:not(:first-child)").forEach((e) => {
      if (e.innerText != "-") toRemove = false;
    })
    if (toRemove) zachowanieTr.style.display = "none";
  } else {
    // Zwiń zachowanie
    let injectedCode = 'showHide.ShowHide("zachowanie")';
    if (document.getElementById("przedmioty_OP_zachowanie_node")) injectedCode += ',showHideOP.ShowHide("zachowanie");';
    const script = document.createElement('script');
    script.appendChild(document.createTextNode(injectedCode));
    (document.body || document.head || document.documentElement).appendChild(script);

    // Dodaj proponowane
    insertProposedBehavior();
  }
}

// Plan lekcji do navbara
function adjustNavbar() {
  const navBarElement = document.querySelector("#main-menu > ul > li:nth-child(3)");
  if (!navBarElement) return;
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

// Wyświetlanie numeru z dziennika obok szczęśliwego + informacja gdy nim jest Twój
function adjustHeader(dane) {
  const numerek = document.querySelector("#user-section > span.luckyNumber");
  const numerekDisabled = document.querySelector("#user-section > a > span.luckyNumber");

  let yourNumber = document.createElement("SPAN");
  yourNumber.innerText = "Twój numerek w dzienniku: ";
  const number = document.createElement("B");
  number.classList.add("librusPro_yourNumber");
  yourNumber.appendChild(number);
  
  number.innerText = dane.nr;
  if (numerek) {
    if (document.querySelector("#user-section > span.luckyNumber > b").innerText == dane.nr) {
      const gratulacje = document.createElement("SPAN");
      gratulacje.classList.add("librusPro_congratulations")
      gratulacje.innerText = "GRATULACJE!";
      yourNumber.appendChild(gratulacje);
    }
    numerek.parentElement.insertBefore(yourNumber, numerek.nextSibling);
  } else if (numerekDisabled) {
    yourNumber.style.marginLeft = "5px";
    numerekDisabled.parentElement.parentElement.insertBefore(yourNumber, numerekDisabled.parentElement.nextSibling);
  }

  yourNumber.id = "librusPro_number";
  yourNumber.title = "<b style='color: #b6dc3f'>Podgląd numerka z dziennika tylko z <b style='color: #a96fe3'>LibrusPro</b>!</b>";
  const injectedCode = `$('#librusPro_number').tooltip({
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
  const hakerzy = document.querySelector("#user-section > img");
  if (hakerzy) {
    hakerzy.title += "<br><b style='color: #ee9999'>❗❗ HAKERZY ATAKUJĄ! ❗❗</b>"
  }

  const uczen = document.querySelector("#user-section > b > img");
  if (uczen) {
    uczen.title = "<b style='color: #8debe3'>Dzięki za korzystanie z rozszerzenia <b style='color: #a96fe3'>LibrusPro</b>!</b><br><b style='color: #ffd128'>Jeżeli Ci się spodobało, nie zapomnij zostawić<br>5 gwiazdek w sklepie oraz polecić znajomym!</b><br><b style='color: #ff7ca0'><i>Jedz Buraczki!</i></b>"
  }

  const bezpiecznyUczen = document.querySelector('a[title="Bezpieczny Uczeń"]');
  if (bezpiecznyUczen) {
    bezpiecznyUczen.parentElement.remove();
  }

  // Zmiana title
  let tityl = "LibrusPro | ";

  // Ilość nowych rzeczy
  let num = 0;
  document.querySelectorAll(".button.counter").forEach((e) => {
    num += +e.innerText;
  })
  if (num > 0) tityl = `(${num}) ${tityl}`;

  const titels = {
    "przegladaj_oceny": "Oceny",
    "przegladaj_nb": "Frekwencja",
    "wiadomosci": "Wiadomości",
    "ogloszenia": "Ogłoszenia",
    "terminarz": "Terminarz",
    "moje_zadania": "Zadania domowe",
    "plan_lekcji": "Plan lekcji",
  }
  let typTityl = "Synergia";
  for (const e in titels) {
    if (location.href.includes(e)) typTityl = titels[e];
  }
  document.title = tityl + typTityl;

  // Zamiana favicon
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = browserAPI.runtime.getURL('img/icon.png');
}

// Copyright
function insertFooter() {
  const footer = document.querySelector("#footer");
  if (!footer) return;
  footer.innerHTML = `
  <hr>
  <span id="bottom-logo"></span>
  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" class="librusPro_icon" style="background: url(&quot;` + browserAPI.runtime.getURL('img/icon.png') + `&quot;);"></a>
  <div class="librusPro_footer">
    <span style="color: #96c5b4;">» Podoba się wtyczka? <a href="https://chrome.google.com/webstore/detail/libruspro-rozszerzenie-do/hoceldjnkcboafconokadmmbijbegdkf" target="_blank" class="librusPro_link">Zostaw 5<span style="font-size: 11px;">⭐</span></a></span>
    <div style="color: #94cae4;">» Wbijaj na oficjalny <a href="https://discord.gg/e9EkVEvsDr" target="_blank" class="librusPro_link">Discord</a>!</div>
    
    <div>» <span style="font-style: italic">LibrusPro © ` + new Date().getFullYear() + ` Maks Kowalski</span></div>
  </div>`
}

// KEKW
function aprilfools() {
  if (!document.getElementById("icon-oceny")) return;
  if (document.getElementById("liczba_ocen_od_ostatniego_logowania_form")) {
    const a = document.querySelector(`a[href="javascript:$('#liczba_ocen_od_ostatniego_logowania_form').submit();"]`);
    if (!a) return;
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
    a.classList.add("button", "counter", "blue");
    document.getElementById("icon-oceny").appendChild(f);
    document.getElementById("icon-oceny").appendChild(a);
  }

  let pp = INDICES.ocenyII + OFFSET_JS;
  if (odOstLogowania) {
    pp = 5;
  }
  document.querySelectorAll("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr > td:nth-child(2)").forEach((e) => {
    if (e.innerText.toLowerCase().includes("polski") && !document.getElementById("polski")) {
      const n = document.createElement("SPAN");
      n.innerHTML = `<a id="polski" class="ocena" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">1</a>`;
      n.classList.add("grade-box");
      n.style.background = "#00FF00";
      const el = e.parentElement.children[pp];
      if (el.innerText == "Brak ocen") el.innerText = "";
      el.appendChild(n);
      document.getElementById("polski").title = `Kategoria: Kartkówka niezapowiedziana<br>Data: 2022-04-01 (pt.)<br>Nauczyciel: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br>Licz do średniej: tak<br>Waga: 3<br>Dodał: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br/><br/>Komentarz: Prima Aprilis<br/><span style="color: #777777; padding-left: 5px; font-style: italic">Kliknij mnie, aby ukryć.</span>`;
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
      document.getElementById("matma").title = `Kategoria: Praca klasowa<br>Data: 2022-04-01 (pt.)<br>Nauczyciel: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br>Licz do średniej: tak<br>Waga: 5<br>Dodał: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br/><br/>Komentarz: Prima Aprilis<br/><span style="color: #777777; padding-left: 5px; font-style: italic">Kliknij mnie, aby ukryć.</span>`;
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
  if (document.getElementById("matma")) document.getElementById("matma").addEventListener('click', function () {
    browserAPI.storage.sync.set({
      ["aprilfools"]: false
    });
  });
  if (document.getElementById("polski")) document.getElementById("polski").addEventListener('click', function () {
    browserAPI.storage.sync.set({
      ["aprilfools"]: false
    });
  });
}

// Prace domowe
if (window.location.href == "https://synergia.librus.pl/moje_zadania") {
  document.querySelectorAll('tr[id^="homework_"] > td.bold:first-child').forEach((e) => {
    e.parentElement.classList.add("librusPro_new");
  });

  document.querySelectorAll('img[src*="aktywne.png"]').forEach((e) => {
    e.parentElement.parentElement.classList.add("librusPro_doneHomework");
  });

  document.querySelectorAll('[style="padding:5px"]').forEach((e) => {
    const s = document.createElement("SPAN");
    s.innerText = "(" + e.innerText + ")";
    s.style.fontWeight = "bold";
    s.style.paddingLeft = "5px";
    e.previousElementSibling.appendChild(s);
    e.remove();
  });

  document.querySelectorAll("#body > div > div > table > thead > tr > td:nth-child(5), #body > div > div > table > thead > tr > td:nth-child(6)").forEach((e) => {
    e.colSpan = 1;
  });
}

function disableAutoLogout() {
  // Załadowanie strony w tle co 20 minut, aby nie wylogowywało
  const code = `function refreshLibrus() {
    fetch('https://synergia.librus.pl/wiadomosci', { cache: 'no-cache', credentials: 'same-origin' });
  }
  setInterval(refreshLibrus, 20*60*1000);`;
  const refreshScript = document.createElement('script');
  refreshScript.appendChild(document.createTextNode(code));
  (document.body || document.head || document.documentElement).appendChild(refreshScript);
}

// Terminarz
if (window.location.href == "https://synergia.librus.pl/terminarz") {
  /*
    key: 'yyyy-mm-dd'
    key: '2019-10-17'
    value: {
      lesson: '',
      time: '',
      subject: '',
      type: '',
      description: '',
      background: '',
      color: '',
      url: '',
      dateAdded: '',
      dateModified: '',
    }
    
    i.e. {
      lesson: "5"
      time: "21:37"
      subject: "Matematyka"
      type: "Sprawdzian"
      description: "Dział 1"
      background: "#6a9604"
      color: "#ffffff"
      url: ""
      dateAdded: "10.02.2021, 19:51:12"
      dateModified: "10.02.2021, 19:59:11"
    }
  */

  // Automatyczne odświeżanie po zmianach (z pominięciem "Potwiedź ponowne przesłanie formularza")
  browserAPI.storage.onChanged.addListener(function (changes, namespace) {
    window.location.replace(window.location.href);
  });

  // ---------------------- ISEMPTY FUNCTION --------------------------
  function isEmpty(obj) {
    for (let emptiness in obj) {
      return false;
    }
    return true;
  }

  // ---------------------- CREATE OVERLAY --------------------------
  const overlay = document.createElement("div");
  overlay.classList = "librusPro_body";
  overlay.innerHTML = `
      <div class="librusPro_container">
          <div class="librusPro_text" id="librusPro_header">Dodaj zdarzenie</div>
          <div class="librusPro_error" id="librusPro_error"></div>
          <div class="librusPro_date"><input id="librusPro_datePicker" type="date"></div>
          <div class="librusPro_twoFieldContainer">
              <div class="librusPro_twoField" id="twoField1" style="width: 45%">
                  <label class="librusPro_title" style="margin-top: 5px;" for="librusPro_lesson">Nr lekcji:</label>
                  <input placeholder="3" type="text" id="librusPro_lesson" class="librusPro_input">
              </div>
              <div class="librusPro_twoField" id="twoField2" >
                  <label class="librusPro_title" style="margin-top: 5px;" for="librusPro_time">Godzina:</label>
                  <input type="time" id="librusPro_time" class="librusPro_input librusPro_inputTime">
              </div> 
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_subject">Przedmiot:</label>
              <input placeholder="Matematyka" type="text" id="librusPro_subject" class="librusPro_input">
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_typeSelect">Typ:</label>
              <select id="librusPro_typeSelect" class="librusPro_select" onchange="librusPro_onSelectChange()">
                  <option value="">-- wybierz --</option>
                  <option value="Sprawdzian" style="background-color: #ebebeb; color: #333333">Sprawdzian</option>
                  <option value="Kartkówka">Kartkówka</option>
                  <option value="Praca domowa" style="background-color: #ebebeb; color: #333333">Praca domowa</option>
                  <option value="Odpowiedź ustna">Odpowiedź ustna</option>
                  <option value="Inny" style="background-color: #ebebeb; color: #333333">Inny (Jaki?)</option>
              </select>
              <label id="librusPro_typeTitle" class="librusPro_title" style="display: none" for="librusPro_type">Typ:</label>
              <input placeholder="Zaliczenie" type="text" id="librusPro_type" class="librusPro_input" style="display: none; /*margin-top: 15px*/">
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_description">Opis:</label>
              <textarea placeholder="Rozdział 2" id="librusPro_description" class="librusPro_input" rows="3"></textarea>
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_imageUrl">URL obrazka:</label>
              <input placeholder="https://www.google.com/logo.png" type="text" id="librusPro_imageUrl" class="librusPro_input">
          </div>
          <div class="librusPro_colorContainer kalendarz-dzien">
              <label class="librusPro_radioContainer">
                  <input type="radio" id="librusPro_firstRadio" name="librusPro_color" value="#ff0000|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #ff0000"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#e67e22|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #e67e22"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#ff7777|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #ff7777"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#d4af37|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #d4af37"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#ffff11|#333333">
                  <span class="librusPro_radioSpan librusPro_darkDot librusPro_colorBorder" style="background: #ffff11"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#d0ff00|#333333">
                  <span class="librusPro_radioSpan librusPro_darkDot librusPro_colorBorder" style="background: #d0ff00"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#8af542|#333333">
                  <span class="librusPro_radioSpan librusPro_darkDot " style="background: #8af542"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#00aa00|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #00aa00"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#6a9604|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #6a9604"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#66cdaa|#505050">
                  <span class="librusPro_radioSpan librusPro_darkDot" style="background: #66cdaa"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#22dddd|#444444">
                  <span class="librusPro_radioSpan librusPro_darkDot" style="background: #22dddd"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#3498db|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #3498db"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#3333ff|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #3333ff"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#ee22ff|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #ee22ff"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#8e44ad|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #8e44ad"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#ffffff|#333333">
                  <span class="librusPro_radioSpan librusPro_darkDot librusPro_colorBorder" style="background: #ffffff"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="radio" name="librusPro_color" value="#aaaaaa|#ffffff">
                  <span class="librusPro_radioSpan" style="background: #aaaaaa"></span>
              </label>
              <label class="librusPro_radioContainer">
                  <input type="color" name="librusPro_colorHex" style="visibility: hidden;" onchange="librusPro_eventHexColor(this.value)" id="librusPro_inputColor" value="#010101">
                  <input type="radio" name="librusPro_color" value="#aaaaaa|#ffffff" id="librusPro_hexRadio">
                  <span class="librusPro_radioSpan librusPro_darkDot" style="background: linear-gradient(216deg, rgba(255,0,0,1) 0%, rgba(255,115,0,1) 23%, rgba(249,255,0,1) 43%, rgba(0,255,115,1) 64%, rgba(0,35,255,1) 85%)" id="librusPro_colorHexSpan"></span>
              </label>
          </div>
          <div class="librusPro_button librusPro_button-add" id="librusPro_add">Dodaj</div>
          <div class="librusPro_button librusPro_button-close" id="librusPro_close">Zamknij</div>
          <div class="librusPro_bottomText">LibrusPro © <span id="librusPro_currentYear"></span></div>
      </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("librusPro_currentYear").innerText = new Date().getFullYear();

  // ----------------------------------------------------
  const pageScript = document.createElement("script");
  pageScript.innerHTML = `
      function librusPro_onSelectChange() {
        const typeSelect = document.getElementById("librusPro_typeSelect").options[document.getElementById("librusPro_typeSelect").selectedIndex].value;
        const typeInputTitle = document.getElementById("librusPro_typeTitle");
        const typeInput = document.getElementById("librusPro_type");
        if (typeSelect == "Inny")
        {
          typeInputTitle.style.display = "block";
          typeInput.style.display = "block";
          typeInput.value = "";
        }
        else
        {
          typeInputTitle.style.display = "none";
          typeInput.style.display = "none";
          typeInput.value = typeSelect;
        }
      }
      function librusPro_eventHexColor(color) {
        document.getElementById("librusPro_colorHexSpan").style.background = color;
        if (color != "#ff0000") {
          if (librusPro_isLightFontColorForBackground(color)) document.getElementById("librusPro_colorHexSpan").classList.remove("librusPro_darkDot");
          else document.getElementById("librusPro_colorHexSpan").classList.add("librusPro_darkDot");
          document.getElementById("librusPro_hexRadio").value = color + "|" + (librusPro_isLightFontColorForBackground(color) ? "#ffffff" : "#222222");
        } else {
          document.getElementById("librusPro_hexRadio").value = color + "|#ffffff";
        }
        document.getElementById("librusPro_hexRadio").checked = true;

      }
      function librusPro_isLightFontColorForBackground(bgColor) {
        var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
        var r = parseInt(color.substring(0, 2), 16);
        var g = parseInt(color.substring(2, 4), 16);
        var b = parseInt(color.substring(4, 6), 16);
        var uicolors = [r / 255, g / 255, b / 255];
        var c = uicolors.map((col) => {
          if (col <= 0.03928) {
            return col / 12.92;
          }
          return Math.pow((col + 0.055) / 1.055, 2.4);
        });
        var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
        return (L > 0.179) ? false : true;
      }
  `;
  document.body.appendChild(pageScript);

  // ---------------------- CLOSE BUTTON LISTENER --------------------------
  const overlayCloseButton = document.getElementById("librusPro_close");
  overlayCloseButton.addEventListener("click", function () {
    overlay.style.display = "none";
    document.body.classList.toggle("librusPro_pageBody");
  });

  // ---------------- CREATE MONTH VARIABLE --------------------
  let month = document.getElementsByName("miesiac")[0];
  const monthId = month.selectedIndex;
  month = month.options[month.selectedIndex].innerText;

  // ---------------- CREATE YEAR VARIABLE --------------------
  let year = document.getElementsByName("rok")[0];
  year = year.options[year.selectedIndex].innerText.replaceAll(" ", "");

  // ---------------- "[+]" BUTTON LISTENER --------------------
  function addListenerToAddButton(button, targetKey) {
    button.addEventListener("click", function () {
      displayOverlayForAdding(`${targetKey}`);
    });
  }

  // ---------------- "[+]" CLICKED --------------------
  const overlayHeader = document.getElementById("librusPro_header");
  const overlayConfirmButton = document.getElementById("librusPro_add");
  const overlayDate = document.getElementById("librusPro_datePicker");
  let listenerLambdaFunction;

  function displayOverlayForAdding(cellKey) {
    document.body.classList.toggle("librusPro_pageBody");
    overlay.style.display = "block";
    overlayDate.value = cellKey;
    overlayHeader.innerText = "Dodaj zdarzenie";
    overlayConfirmButton.innerText = "Dodaj";
    overlayConfirmButton.classList.remove("librusPro_button-edit");
    overlayConfirmButton.classList.add("librusPro_button-add");
    time.value = 0;
    lesson.value = "";
    subject.value = "";
    typeSelect.value = "";
    type.value = "";
    typeInputTitle.style.display = "none";
    typeInput.style.display = "none";
    description.value = "";
    imageUrl.value = "";
    firstRadioElement.checked = "true";
    if (listenerLambdaFunction) {
      overlayConfirmButton.removeEventListener("click", listenerLambdaFunction);
    }
    listenerLambdaFunction = function () {
      addCustomCell();
    };
    overlayConfirmButton.addEventListener("click", listenerLambdaFunction);
  }

  // ---------------- "ADD" CLICKED INSIDE "[+]" / CREATE CUSTOM EVENT --------------------
  const lesson = document.getElementById("librusPro_lesson");
  const time = document.getElementById("librusPro_time");
  const subject = document.getElementById("librusPro_subject");
  const typeSelect = document.getElementById("librusPro_typeSelect");
  const type = document.getElementById("librusPro_type");
  const typeInputTitle = document.getElementById("librusPro_typeTitle");
  const typeInput = document.getElementById("librusPro_type");
  const description = document.getElementById("librusPro_description");
  const imageUrl = document.getElementById("librusPro_imageUrl");
  const firstRadioElement = document.getElementById("librusPro_firstRadio");

  function addCustomCell(dateAdded = "") {
    const colorRadioValue = document
      .querySelector("input[name=librusPro_color]:checked")
      .value.split("|");
    if (overlayDate.value == "") {
      document.getElementById("librusPro_error").innerText = "Wybierz datę";
      return;
    }
    if (colorRadioValue == "") {
      document.getElementById("librusPro_error").innerText = "Wybierz kolor";
      return;
    }

    overlay.style.display = "none";

    let _dateAdded = new Date().toLocaleString();
    let _dateModified = "";
    if (dateAdded != "") {
      _dateAdded = dateAdded;
      _dateModified = new Date().toLocaleString();
    }

    browserAPI.storage.sync.get([overlayDate.value], function (temp) {
      // Czy już są jakieś wydarzenia dla tego dnia
      if (isEmpty(temp)) {
        browserAPI.storage.sync.set({
          [overlayDate.value]: [{
            lesson: lesson.value,
            time: time.value,
            subject: subject.value,
            type: type.value,
            description: description.value,
            background: colorRadioValue[0],
            color: colorRadioValue[1],
            url: imageUrl.value,
            dateAdded: _dateAdded,
            dateModified: _dateModified,
          }, ]
        });
      } else {
        let t = temp[overlayDate.value];
        t.push({
          lesson: lesson.value,
          time: time.value,
          subject: subject.value,
          type: type.value,
          description: description.value,
          background: colorRadioValue[0],
          color: colorRadioValue[1],
          url: imageUrl.value,
          dateAdded: _dateAdded,
          dateModified: _dateModified,
        });
        browserAPI.storage.sync.set({
          [overlayDate.value]: t
        });
      }
    });
  }

  // ------------------------ DISPLAYING CUSTOM CELLS (AND "[+]") --------------------
  const days = document.getElementsByClassName("kalendarz-numer-dnia");
  const date = new Date();

  // Przyciemnianie przeszłych wydarzeń
  let setOpacity = false;
  if (year < date.getFullYear()) setOpacity = true;
  else if (monthId <= date.getMonth() && year == date.getFullYear()) setOpacity = true;

  browserAPI.storage.sync.get(["options"], function (t) {
    let options = t["options"];
    if (options) {
      for (const day of days) {
        const key = `${year}-${(monthId + 1) < 10 ? "0" + (monthId + 1) : monthId + 1}-${day.innerText < 10 ? "0" + day.innerText : day.innerText}`;
        day.style.width = "initial";
        day.style.float = "right";
        day.style.marginBottom = "10px";

        const addButton = document.createElement("a");
        addButton.innerText = "[+]";
        addButton.classList.add("librusPro_addButton");
        addListenerToAddButton(addButton, key);
        day.parentElement.insertBefore(addButton, day);

        if (day.parentElement.parentElement.classList.contains("today")) {
          setOpacity = false;
        }
        if (setOpacity) {
          day.parentElement.style.opacity = "0.5";
          day.parentElement.classList.add("past");
        }

        const clear = document.createElement("span");
        clear.style.clear = "both";
        clear.style.display = "none";
        day.parentElement.appendChild(clear);

        createCell(day, key, options);
      }
    }
  });

  // -------------------- CREATE CELL FUNCTION  ----------------
  function createCell(cellDay, cellKey, options) {
    browserAPI.storage.sync.get([cellKey], function (result) {
      const events = result[cellKey];
      if (!events) {
        return;
      }
      for (let i = 0; i < cellDay.parentElement.childNodes.length; i++) {
        if (cellDay.parentElement.childNodes[i].tagName == "TABLE") {
          cellDay.parentElement.childNodes[i].style.marginBottom = "0px";
          break;
        }
      }

      const table = document.createElement("table");
      table.style.marginTop = "0px";

      const uczen = document.querySelector("#user-section > b").innerText.split("(")[0];

      for (let i = 0; i < events.length; i++) {
        const row = table.insertRow();
        const cell = document.createElement("td");
        row.appendChild(cell);
        const event = events[i];
        cell.style.background = event.background;
        cell.style.color = event.color;
        cell.style.overflowWrap = "break-word";
        cell.style.wordWrap = "break-word";
        cell.style.animation = "blinking 4s infinite ease-in-out";
        cell.style.wordBreak = "break-word";
        cell.classList.add("no-border-left", "no-border-right", "librusPro_custom");

        cell.title = "Uczeń: " + uczen + "<br />";

        let temp = [];
        // Nr lekcji
        if (event.lesson != "") {
          if (event.lesson.length > 30) {
            temp.push(`Nr lekcji: ${event.lesson.slice(0, 30)} [...]`);
          } else {
            temp.push(`Nr lekcji: ${event.lesson}`);
          }
        }

        // Godzina
        if (event.time != "") {
          temp.push(`Godz: ${event.time}`);
        }

        if (options.modernizeSchedule) {
          cell.innerText = temp.join("\n");

          // Przedmiot
          if (event.subject != "") {
            const s = document.createElement("SPAN");
            if (event.subject.length > 30) {
              s.innerText = event.subject.slice(0, 30) + ' [...]';
            } else {
              s.innerText = event.subject;
            }
            s.style.fontWeight = "bold";
            s.style.fontSize = "13px";
            s.style.display = "block";
            cell.appendChild(s);
          }

          // Typ
          if (event.type != "") {
            const s = document.createElement("SPAN");
            if (event.type.length > 30) {
              s.innerText = event.type.slice(0, 30) + '[...]';
            } else {
              s.innerText = event.type;
            }
            s.style.textDecoration = "underline";
            s.style.fontSize = "13px";
            s.style.display = "block";
            s.style.marginBottom = "3px";
            cell.appendChild(s);
          }

          // Klasa
          if (currentClass != undefined && (((cell.innerText == "" && (event.description == "" || !options.addDescriptions)) && event.url == "") || !options.removeClasses)) {
            const s = document.createElement("SPAN");
            s.innerText = currentClass;
            s.style.display = "block";
            cell.appendChild(s);
          }

          // Opis
          if (event.description != "" && options.addDescriptions) {
            const s = document.createElement("SPAN");
            if (event.description.length > 200) {
              s.innerText = `Opis: ${event.description.replaceAll("<br />", "\n").slice(0, 250)}\n[...]`;
            } else {
              s.innerText = `Opis: ${event.description.replaceAll("<br />", "\n")}`;
            }
            s.style.display = "block";
            cell.appendChild(s);
          }

          cell.style.padding = "6px 9px";

        } else {
          let pp = false;
          // Przedmiot
          if (event.subject != "") {
            if (event.subject.length > 30) {
              temp.push(`${event.subject.slice(0, 30)} [...]`);
            } else {
              temp.push(`${event.subject}`);
            }

            if (event.type != "") {
              temp[temp.length - 1] += ", ";
            }
            pp = true;
          }

          // Typ
          if (event.type != "") {
            if (event.type.length > 30) {
              if (!pp) {
                temp.push(`${event.type.slice(0, 30)} [...]`);
              } else {
                temp[temp.length - 1] += `${event.type.slice(0, 30)} [...]`;
              }
            } else {
              if (!pp) {
                temp.push(`${event.type}`);
              } else {
                temp[temp.length - 1] += `${event.type}`;
              }
            }
          }

          // Klasa
          if (currentClass != undefined && ((temp.length == 0 && event.description == "") || !options.removeClasses)) {
            temp.push(currentClass);
          }

          // Opis
          if (event.description != "" && options.addDescriptions) {
            if (event.description.length > 200) {
              temp.push(`Opis: ${event.description.replaceAll("<br />", "\n").slice(0, 250)}` + "\n[...]");
            } else {
              temp.push(`Opis: ${event.description.replaceAll("<br />", "\n")}`);
            }
          }
          cell.innerText = temp.join("\n");
        }

        if (event.url != "" && event.url !== undefined) {
          const image = document.createElement("IMG");
          image.src = event.url;
          image.style.width = "85%";
          image.style.display = "block";
          image.style.margin = "5px auto";
          image.style.filter = "drop-shadow(2px 2px 1px #333333)";
          image.style.borderRadius = "5px";
          cell.appendChild(image);
        }

        if (event.description != "") cell.title += "Opis: " + event.description + "<br />";
        cell.title += "Data dodania: " + event.dateAdded;
        if (event.dateModified != "") cell.title += "<br />Data ostatniej modyfikacji: " + event.dateModified;

        const removeButton = document.createElement("a");
        removeButton.innerText = "⨉";
        removeButton.classList += "librusPro_removeButton";
        addListenerToRemoveButton(removeButton, cellKey, i);

        const editButton = document.createElement("a");
        editButton.innerText = "✎";
        editButton.classList += "librusPro_editButton";
        addListenerToEditButton(editButton, cellKey, i);

        cell.appendChild(removeButton);
        cell.appendChild(editButton);
        cellDay.parentElement.appendChild(table);

        cell.onmouseenter = function () {
          this.style.background = "#666666";
          this.style.color = "#ffffff";
        };
        cell.onmouseleave = function () {
          this.style.background = `${event.background}`;
          this.style.color = `${event.color}`;
        };

        const injectedCode = `$('.librusPro_custom').tooltip({
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
  }

  // ---------------- REMOVE BUTTON LISTENER --------------------
  function addListenerToRemoveButton(removeButton, targetKey, index) {
    removeButton.addEventListener("click", function () {
      removeCustomCell(`${targetKey}`, `${index}`);
    });
  }

  // ---------------- REMOVE CUSTOM CELL --------------------
  function removeCustomCell(targetKey, removeIndex) {
    browserAPI.storage.sync.get([targetKey], function (tempResult) {
      if (tempResult[targetKey].length == 1) {
        browserAPI.storage.sync.remove([targetKey]);
      } else {
        const t = tempResult[targetKey];
        t.splice(removeIndex, 1);
        browserAPI.storage.sync.set({
          [targetKey]: t
        });
      }
    });
  }

  // ---------------- EDIT BUTTON LISTENER --------------------
  function addListenerToEditButton(addTo, targetKey, index) {
    addTo.addEventListener("click", function () {
      displayOverlayForEditingCell(`${targetKey}`, `${index}`);
    });
  }

  // ---------------- DISPLAY OVERLAY FOR EDITING CUSTOM CELL --------------------
  function displayOverlayForEditingCell(targetKey, editIndex) {
    document.body.classList.toggle("librusPro_pageBody");
    overlay.style.display = "block";
    overlayHeader.innerText = "Edytuj zdarzenie";
    overlayConfirmButton.innerText = "Edytuj";
    overlayConfirmButton.classList.remove("librusPro_button-add");
    overlayConfirmButton.classList.add("librusPro_button-edit");
    overlayDate.value = targetKey;

    browserAPI.storage.sync.get([targetKey], function (r) {
      const event = r[targetKey][editIndex];
      lesson.value = event.lesson
      time.value = event.time;
      subject.value = event.subject;
      type.value = event.type;
      description.value = event.description;
      typeSelect.value = "Inny";
      typeInputTitle.style.display = "none";
      typeInput.style.display = "none";
      for (let i = 0; i < typeSelect.options.length; i++) {
        if (typeSelect.options[i].value === event.type) {
          typeSelect.value = event.type;
        }
      }
      if (typeSelect.value == "Inny") {
        typeInputTitle.style.display = "block";
        typeInput.style.display = "block";
      }
      imageUrl.value = event.url;
      const color = event.background + "|" + event.color;
      const colorInput = document.querySelector(`input[value="${color}"]`);
      if (colorInput) {
        for (let x = 0; x < 18; x++) {
          if (color == colorInput.value) {
            colorInput.checked = "true";
            break;
          }
        }
      } else {
        document.getElementById("librusPro_inputColor").value = event.background;
        document.getElementById("librusPro_hexRadio").checked = true;
        document.getElementById("librusPro_hexRadio").value = color;
        document.getElementById("librusPro_colorHexSpan").style.background = event.background;
        document.getElementById("librusPro_colorHexSpan").style.color = event.color;
      }
      if (listenerLambdaFunction) {
        overlayConfirmButton.removeEventListener("click", listenerLambdaFunction);
      }
      listenerLambdaFunction = function () {
        editCustomCell(`${targetKey}`, `${editIndex}`);
      };
      overlayConfirmButton.addEventListener("click", listenerLambdaFunction);
    });
  }

  // ---------------- EDIT CUSTOM CELL --------------------
  function editCustomCell(targetKey, editIndex) {
    const colorSelectValue = document
      .querySelector("input[name=librusPro_color]:checked")
      .value.split("|");
    if (overlayDate.value == "") {
      document.getElementById("librusPro_error").innerText = "Wybierz datę";
      return;
    }
    if (colorSelectValue == "") {
      document.getElementById("librusPro_error").innerText = "Wybierz kolor";
      return;
    }
    overlay.style.display = "none";

    if (overlayDate.value == targetKey) {
      browserAPI.storage.sync.get([targetKey], function (tempResult) {
        const t = tempResult[targetKey];
        t[editIndex] = {
            lesson: lesson.value,
            time: time.value,
            subject: subject.value,
            type: type.value,
            description: description.value,
            background: colorSelectValue[0],
            color: colorSelectValue[1],
            url: imageUrl.value,
            dateAdded: t[editIndex].dateAdded,
            dateModified: new Date().toLocaleString(),
          },
          browserAPI.storage.sync.set({
            [targetKey]: t
          });
      });
    } else {
      browserAPI.storage.sync.get([targetKey], function (tempResult) {
        addCustomCell(tempResult[targetKey][editIndex].dateAdded);
        removeCustomCell(targetKey, editIndex);
      });
    }
  }

  // ------------------- MODERNIZE EVENTS, ADD DESCRIPTIONS, REMOVE CLASSES ---------------

  function adjustCellContent(cell, options) {
    // Usuwanie klasy
    if (options.removeClasses) {
      const classRegex = /^(([0-9\[\]](.+?))|([A-Za-z]{1,2}\d(.*?)))$/gm;
      [...cell.childNodes].forEach((e) => {
        if (e.nodeValue && e.nodeValue.match(classRegex)) {
          e.previousSibling?.remove();
          e.remove();
        }
      });
    }

    if (options.modernizeSchedule) {
      // Typ (np. sprawdzian)
      [...cell.childNodes].forEach((e) => {
        if (e.nodeValue && e.nodeValue[0] == ",") {
          const s = document.createElement("SPAN");
          s.innerText = e.nodeValue.slice(2);
          s.style.textDecoration = "underline";
          s.style.fontSize = "13px";
          s.classList.add("typ");
          const u = cell.querySelector(`a[href^="https://liblink.pl/"]:last-child`);
          if (u) {
            s.innerText = "\n" + s.innerText;
          } else {
            if (e.nextSibling && e.nextSibling.nodeName == "BR") e.nextSibling.remove();
            s.style.display = "block";
            s.style.marginBottom = "3px";
          }
          e.after(s);
          e.remove();
        }
      });

      // Modernizacja odwołań
      const odwolaneRegex = /Odwołane zajęcia(\n.*) na lekcji nr: (\d+) \((.*)\)$/;
      const odwolaneResult = cell.innerText.match(odwolaneRegex);
      if (cell.innerText && odwolaneResult) {
        cell.innerText = "Odwołane zajęcia na lekcji nr: " + odwolaneResult[2];
        const p = document.createElement("SPAN");
        p.style.fontWeight = "bold";
        p.style.fontSize = "13px";
        p.innerText = "\n" + odwolaneResult[3];
        cell.appendChild(p);
      }

      // Modernizacja zastępstw/przesunięć
      const zastepstwaRegex = /(Zastępstwo|Przesunięcie) z (.*) na lekcji nr: (\d+) \((.*)\)$/;
      const zastepstwaResult = cell.innerText.match(zastepstwaRegex);
      if (cell.innerText && zastepstwaResult) {
        cell.innerText = zastepstwaResult[1] + " na lekcji nr: " + zastepstwaResult[3];
        const p = document.createElement("SPAN");
        p.style.fontWeight = "bold";
        p.style.fontSize = "13px";
        p.innerText = "\n" + zastepstwaResult[4];
        cell.appendChild(p);
        const x = document.createElement("SPAN");
        x.innerText = `\n(${zastepstwaResult[2]})`;
        x.style.fontStyle = "italic";
        cell.appendChild(x);
      }

      // Odchudzenie nieobecności nauczycieli
      if (cell.innerText.includes("\nNauczyciel:")) {
        cell.innerText = cell.innerText.replace("\nNauczyciel:", "");
      }

      // Pogrubienie przedmiotu
      document.querySelectorAll(".przedmiot").forEach((e) => {
        e.style.fontWeight = "bold";
        e.style.fontSize = "13px";
      });

      // Usuwanie linków ze starych lekcji online
      document.querySelectorAll('.past a[href^="https://liblink.pl/"]').forEach((e) => {
        e.remove();
      });

      // Zwiększenie paddingu
      document.querySelectorAll(".kalendarz-dzien td").forEach((e) => {
        e.style.padding = "6px 9px";
      });
    }

    // Dodawanie opisów
    if (options.addDescriptions) {
      const descriptionRegex = /Opis: (.+?)(<br>|<br \/>)Data/;
      let out = (cell.title.match(descriptionRegex)) ? "Opis: " + cell.title.match(descriptionRegex)[1] : null;
      if (out) {
        // Opis z title na wierzch, ucięcie zbyt długich.
        const d = document.createElement("SPAN");
        if (out.length > 200) {
          out = out.slice(0, 250).replaceAll("<br />", "\n").replaceAll("<br>", "\n") + "\n[...]";
        } else {
          out = out.replaceAll("<br />", "\n").replaceAll("<br>", "\n");
        }
        const u = cell.querySelector(`a[href^="https://liblink.pl/"]:last-child`);
        if (u) {
          d.innerText = "\n" + out;
          cell.insertBefore(d, u);
        } else {
          d.innerText = out;
          d.style.display = "block";
          cell.appendChild(d);
        }
      }
    }
  }

  browserAPI.storage.sync.get(["options", "plan"], function (t) {
    let options = t["options"];
    if (options) {
      // Wersja depresyjna terminarza
      if (options.depressionMode) {
        const calendarDays = document.getElementsByClassName("kalendarz-dzien");
        for (const e of calendarDays) {
          if (e.classList.contains("past")) {
            e.style.filter = "grayscale(100%) brightness(0.5)";
          } else {
            e.style.filter = "grayscale(100%) brightness(0.6) contrast(1.2)";
            e.style.opacity = "0.9";
          }
        }
      }
    }

    document.querySelectorAll("#scheduleForm > div > div > div > table > tbody:nth-child(2) > tr > td > div > table > tbody > tr > td").forEach((e) => {
      if (!e.classList.contains("librusPro_custom")) {
        adjustCellContent(e, options);
      }
    });

    let plan = t["plan"];
    if (plan) {
      let h = 0;
      for (let d in plan) {
        if (d == "dzwonki") continue;
        h += plan[d].length;
      }
      if (h > 0) {
        document.querySelectorAll(".center:not(.weekend) > .kalendarz-dzien").forEach((e) => {
          const timetable = document.createElement("ARTICLE");
          timetable.innerText = "≡";
          timetable.classList.add("librusPro_timetable");
          e.insertBefore(timetable, e.querySelector(".kalendarz-numer-dnia"));

          const dzienTyg = [...e.parentElement.parentElement.children].indexOf(e.parentElement);
          const t = plan[dzienTyg];
          const u = [];
          for (let i = 0; i < t.length; i++) {
            if (!t[i]) {
              if (i != 0) {
                u.push(`<b style="color: #0791bb">${i}</b> <i style="color: #aaaaaa">(${plan.dzwonki[i]})</i> -`);
              }
              continue;
            }
            u.push(`<b style="color: #0791bb">${i}</b> <i style="color: #aaaaaa">(${plan.dzwonki[i]})</i> ${t[i]}`);
          }
          timetable.title = u.join("<br>");
        });
        const injectedCode = `$('.librusPro_timetable').tooltip({
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
    }
  });
}