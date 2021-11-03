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
  averageWarn: false,
  modernizeTitles: true,
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
const GRADE_MANAGER_DEFAULT_COLOR = "#00ff00";
const ADD_SYMBOL = "✎";
const REMOVE_SYMBOL = "⨉";
const API = "https://synergia.librus.pl/gateway/api/2.0/";

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

async function getAttendanceLessonsStatistics() {
  try {
    let userID = await fetch(API + 'Me')
    .then(response => response.json())
    .then(data => {return data["Me"]["Account"]["UserId"]});

    fetch(API + 'Lessons')
    .then(response => response.json())
    .then(async function(lessons) {
      document.querySelector(".librusPro_tfoot-text").innerText = "Widok przedstawia aktualne dane pobrane z dziennika Librus Synergia.";
      const container = document.getElementById("librusPro_lessonsAttendance");
      const tr = document.createElement("TR");
      tr.classList.add("line0", "bolded");
      const _spacer = document.createElement("td");
      const totalTitle = document.createElement("td");
      const totalAbsencesEl = document.createElement("td");
      const totalAttendancesEl = document.createElement("td");
      const totalAttendancePercentEl = document.createElement("td");
      totalTitle.innerText = "Razem";
      totalTitle.classList.add("right");
      totalAbsencesEl.innerText = "0";
      totalAttendancesEl.innerText = "0";
      totalAttendancePercentEl.innerText = "%";
      tr.appendChild(_spacer);
      tr.appendChild(totalTitle);
      tr.appendChild(totalAbsencesEl);
      tr.appendChild(totalAttendancesEl);
      tr.appendChild(totalAttendancePercentEl);
      container.insertBefore(tr, container.firstElementChild);
      for (let lesson of lessons["Lessons"]) {
        fetch(API + `Attendances/LessonsStatistics/${lesson["Id"]}`)
        .then(response => response.json())
        .then(async function(data) {
          for (let lessonStats of data["LessonsStatistics"]) {
            if (lessonStats["Student"]["Id"] == userID) {
              const subjectName = await fetch(API + `Subjects/${lesson["Subject"]["Id"]}`)
              .then(response => response.json())
              .then(data => {return data["Subject"]["Name"]});

              const teacherName = await fetch(API + `Users/${lesson["Teacher"]["Id"]}`)
              .then(response => response.json())
              .then(data => {return `${data["User"]["FirstName"]} ${data["User"]["LastName"]}`});

              const absences = lessonStats["Absences"];
              const attendances = lessonStats["Attendances"];
              const tr = document.createElement("TR");
              tr.classList.add("line0");
              const subjectNameEl = document.createElement("td");
              const teacherNameEl = document.createElement("td");
              const absencesEl = document.createElement("td");
              const attendancesEl = document.createElement("td");
              const percentageEl = document.createElement("td");
              subjectNameEl.innerText = subjectName;
              teacherNameEl.innerText = teacherName;
              absencesEl.innerText = absences;
              attendancesEl.innerText = attendances;
              const percent = ((attendances - absences) / attendances * 100).toFixed(2);
              percentageEl.innerText = percent + "%";
              if (percent < 50) percentageEl.classList.add("librusPro_lessons-attendance-low");
              tr.appendChild(subjectNameEl);
              tr.appendChild(teacherNameEl);
              tr.appendChild(absencesEl);
              tr.appendChild(attendancesEl);
              tr.appendChild(percentageEl);
              container.insertBefore(tr, container.firstElementChild);
              totalAbsencesEl.innerText = +totalAbsencesEl.innerText + absences;
              totalAttendancesEl.innerText = +totalAttendancesEl.innerText + attendances;
              const totalPercent = ((+totalAttendancesEl.innerText - +totalAbsencesEl.innerText) / +totalAttendancesEl.innerText * 100).toFixed(2);
              totalAttendancePercentEl.innerText = totalPercent + "%";
            }
          }
        });
      }
    });
  } catch(error) {
    console.log("%c[LibrusPro] » Wystąpił błąd przy pobieraniu statystyk frekwencji!", "color: #ff5555;", error);
    const container = document.getElementById("librusPro_lessonsAttendance");
    const tr = document.createElement("TR");
    tr.classList.add("line0", "bolded");
    const errorMessage = document.createElement("td");
    errorMessage.innerText = "Sesja wygasła! Zaloguj się ponownie, aby pobrać wykaz uczęszczania.";
    errorMessage.colSpan = "5";
    errorMessage.classList.add("center");
    tr.appendChild(errorMessage);
    container.insertBefore(tr, container.firstElementChild);
    return;
  }
}

if (window.location.href === "https://synergia.librus.pl/przegladaj_nb/uczen") {
  const parent = document.querySelector(".container-background");
  const header = document.createElement("H3");
  header.classList.add("center", "librusPro_header");
  header.innerText = "Wykaz uczęszczania";
  const subHeader = document.createElement("DIV");
  subHeader.classList.add("librusPro_sub-header");
  subHeader.innerText = "Dzięki LibrusPro!";
  header.appendChild(subHeader);
  parent.insertBefore(header, parent.firstElementChild);
  let template = document.createElement('template');
  let html = `
  <table class="center big decorated" style="margin-bottom: 4em;">
    <thead>
      <tr>
        <td rowspan="2">Przedmiot</td>
        <td rowspan="2">Nauczyciel</td>
        <td colspan="3" class="colspan" style="padding: 0;"><span>Frekwencja</span></td>
      </tr>
      <tr class="no-border-top">
        <td class="spacing librusPro_jqueryTitle" title="Łączna liczba nieobecności" style="border-left: 1px solid rgb(34, 34, 34) !important;">nb</td>
        <td class="librusPro_jqueryTitle" title="Łączna liczba wszystkich wpisanych frekwencji do dziennika">Razem</td>
        <td class="librusPro_jqueryTitle" title="Procent obecności na danym przedmiocie wg Librusa">Procent</td>
      </tr>
    </thead>
    <tbody id="librusPro_lessonsAttendance">
    <tr class="line0">
      <td colspan="5"><input type="submit" class="librusPro_attendance-statistics-button ui-button ui-widget ui-state-default ui-corner-all" value="Pobierz wykaz uczęszczania (Procenty frekwencji)"></td>
    </tr>
    </tbody>
    <tfoot>
      <tr>
        <td class="librusPro_tfoot-text" colspan="5">&nbsp;</td>
      </tr>
    </tfoot>
  </table>`;
  html = html.trim();
  template.innerHTML = html;
  parent.insertBefore(template.content.firstChild, header.nextSibling);
  document.querySelector(".librusPro_attendance-statistics-button").onclick = (e) => {
    getAttendanceLessonsStatistics();
    e.target.parentElement.parentElement.remove();
  }
  location.href = "javascript: librusPro_jqueryTitle()";
}

// TO DO: yoink z API/Me
// Aktualizacja numerku, klasy i planu lekcji [klasa z widoku ocen = 3a LO, a klasa z informacji = 3 a LO -> dlatego w taki sposób :)]
function updateDetails(dane, href) {
  const loading = document.createElement("DIV");
  loading.innerText = "Ładowanie...";
  loading.classList.add("librusPro_loading");
  document.getElementById("body").appendChild(loading);
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
                  const lekcja = [b.innerText];
                  const zast = el.querySelector(".plan-lekcji-info");
                  if (zast) lekcja[1] = `(${zast.innerText})`;
                  planLekcji[dzienTyg][nr] = lekcja;
                });
              });
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

// Wyświetlanie charakterystycznych dymków po najechaniu na dane elementy
const jQinjectedCode = `
  function librusPro_jqueryTitle() {
    $('.librusPro_jqueryTitle').tooltip({
      track: true,
      show: {
        delay: 200,
        duration: 200
      },
      hide: {
        delay: 100,
        duration: 200
      }
    });
  }
  setTimeout(librusPro_jqueryTitle, 1000);
`;
const jQscript = document.createElement('script');
jQscript.appendChild(document.createTextNode(jQinjectedCode));
(document.body || document.head || document.documentElement).appendChild(jQscript);

// Przełącznik modyfikacji ocen
let gradeManagerEnabled = false;
let gradeManager;
let gradeManagerOverlay;

function insertGradeManager() {
  const gradeManagerParent = document.querySelector("#body > form:nth-child(5) > div > div > div.container-icon > table > tbody > tr > td:nth-child(2) > p")?.parentElement;
  if (!gradeManagerParent) return;
  gradeManagerParent.insertAdjacentHTML("afterend", `
  <td class="librusPro_grade-manager-icon">
    <img src="${browserAPI.runtime.getURL('img/pen.png')}">
  </td>
  <td class="librusPro_grade-manager librusPro_jqueryTitle">
    <label class="librusPro_grade-manager-label">
      <span>Tymczasowa modyfikacja ocen:</span>
      <input type="checkbox" id="librusPro_gradeManagerCheckbox">
      <img class="tooltip helper-icon" title="<article style='text-align: justify;'><b style='color: #a96fe3'>LibrusPro</b><br>Gdy to ustawienie jest <b class='librusPro_title-tak'>włączone</b>, możesz tymczasowo lokalnie dodawać nowe oceny, bądź edytować i usuwać bieżące, aby sprawdzić jaką miał(a)byś wtedy średnią.</article><i style='color: #a96fe3'>(Po odświeżeniu strony wszystko wraca do stanu sprzed modyfikacji! Wszystkie zmiany zachodzą jedynie lokalnie i nie mają wpływu na Twoje rzeczywiste oceny!)</i><br><b style='color: #6fa5e3'>Oceny możesz dodawać dzięki '${ADD_SYMBOL}',<br>a modyfikować po prostu klikając na daną ocenę.</b>" src="/images/pomoc_ciemna.png">
    </label>
    <div class="librusPro_grade-manager-advice">(Najedź, aby dowiedzieć się więcej)</div>
  </td>
  <div id="librusPro_gradeEditorOverlay" class="librusPro_grade-editor-overlay">
    <div class="librusPro_grade-editor-body">
          <div class="librusPro_text" id="librusPro_gradeManagerHeader">Dodaj ocenę</div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_grade">Ocena:</label>
              <select id="librusPro_grade" class="librusPro_select">
                  ${['0', '1', '1+', '2-', '2', '2+', '3-', '3', '3+', '4-', '4', '4+', '5-', '5', '5+', '6-', '6']
                    .map(x => `<option value="${x}"${x === '1' ? 'selected' : ''}>${x}</option>`).join("")}
              </select>
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_weight">Waga:</label>
              <input placeholder="2" type="number" step="1" min="0" id="librusPro_weight" class="librusPro_input librusPro_inputNumber">
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_comment">Komentarz:</label>
              <textarea placeholder="Rozdział 4" id="librusPro_comment" class="librusPro_input" rows="2"></textarea>
          </div>
          <div class="librusPro_button librusPro_button-add" id="librusPro_add">Dodaj</div>
          <div class="librusPro_button librusPro_button-edit" id="librusPro_edit" style="display: none;">Edytuj</div>
          <div class="librusPro_button librusPro_button-remove" id="librusPro_remove" style="display: none;">Usuń</div>
          <div class="librusPro_button librusPro_button-close" id="librusPro_close">Zamknij</div>
          <div class="librusPro_bottomText">LibrusPro © <span id="librusPro_currentYear"></span></div>
      </div>
  </div>`);
  gradeManager = document.getElementById("librusPro_gradeManagerCheckbox");
  gradeManagerOverlay = document.getElementById("librusPro_gradeEditorOverlay");
  document.getElementById("librusPro_currentYear").innerText = new Date().getFullYear();
  document.getElementById("librusPro_close").addEventListener("click", () => gradeManagerOverlay.style.display = "none");

  gradeManager.onchange = (e) => {
    gradeManagerEnabled = e.target.checked;
    document.querySelectorAll(".librusPro_no-grade").forEach((el) => {
      el.innerText = gradeManagerEnabled ? ADD_SYMBOL : NO_DATA;
      el.classList.toggle("cursor-pointer");
    });    
    document.querySelectorAll(".librusPro_add-grade").forEach((el) => {
      el.classList.toggle("librusPro_add-grade-enabled");
    });    
    

  }
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
    e.parentElement.isFinal = true;
    if (!e.dataset.title) {
      e.dataset.title = btoa(unescape(encodeURIComponent(e.title)));
      if (options.modernizeTitles) modernizeTitle(e);
    }
    if (!options.countZeros && e.innerText[0] === "0") return;

    if (/[0-6][+-]?/.test(e.innerText)) {
      sum += +e.innerText[0];
      count++;
      if (e.innerText.length > 1) {
        if (e.innerText[1] == "+") sum += +options.plusValue;
        else if (e.innerText[1] == "-") sum -= +options.minusValue;
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
    let elementTitle;
    if (e.dataset.title) {
      elementTitle = decodeURIComponent(escape(atob(e.dataset.title)));
    } else {
      elementTitle = e.title;
      e.dataset.title = btoa(unescape(encodeURIComponent(e.title)));
      if (options.modernizeTitles) modernizeTitle(e);
    }
    if (/[0-6][+-]?/.test(e.innerText)) {
      let regexp = /<br>Licz do średniej: (tak|nie)<br>/;
      let liczDoSredniej = (elementTitle.match(regexp) != null) ? elementTitle.match(regexp)[1] : "nie";
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
        if (elementTitle.match(regexp) != null) {
          weight = elementTitle.match(regexp)[1];
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

  if (sum < 0 || weights <= 0)
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

function handleGrades(options, recalculate = false) {
  if (!document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr:nth-child(1):not([name=przedmioty_all])")) {
    insertNoGrades();
    return;
  }

  // Tworzenie wiersza ze średnimi
  let srednieTr;
  if (recalculate) {
    srednieTr = document.getElementById("librusPro_average");
  } else {
    srednieTr = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type > tbody > tr:nth-child(1)").cloneNode(true);
    if (srednieTr.classList.contains("bolded")) {
      insertNoGrades();
      return;
    }
  }

  const tbody = document.querySelector("#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody");
  const midtermGrades = {
    srodroczneI: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.srodroczneI + OFFSET_CSS}) > span > a`),
    srodroczneII: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.srodroczneII + OFFSET_CSS}) > span > a`),
    roczne: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.roczne + OFFSET_CSS}) > span > a`),
    proponowaneI: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneI + OFFSET_CSS}) > span > a`),
    proponowaneII: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneII + OFFSET_CSS}) > span > a`),
    proponowaneR: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneR + OFFSET_CSS}) > span > a`),
  }

  const averages = [];
  const rows = document.querySelectorAll('#body > form:nth-child(5) > div > div > table:first-of-type:not(#tabSource) > tbody > tr:not(.bolded, [id^="przedmioty"], .librusPro_average)');

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
  // Średnie dla poszczególnych przedmiotów oraz możliwość dodawania nowych ocen
  for (let i = 0; i < rows.length; i++) {
    if (!recalculate) {
      // (Proponowane) (śród)roczne
      for (let u of Object.keys(midtermGrades).filter((e) => { return INDICES[e] >= 0})) {
        const td = rows[i].children[INDICES[u] + OFFSET_JS];
        // Jeśli nie ma oceny, dodajemy po kliknięciu nową
        if (!td.firstElementChild) {
          td.addEventListener("click", function addGrade(e) {
            if (!gradeManagerEnabled) {
              gradeManager.focus();
              return;
            };
            displayGradeManagerOverlay(e.target, options, true, true);
            td.removeEventListener("click", addGrade);
          });
          td.classList.add("librusPro_no-grade");
        }
      }
      // Dodawanie nowych ocen cząstkowych
      for (let u of ["ocenyI", "ocenyII"]) {
        const td = rows[i].children[INDICES[u] + OFFSET_JS];
        const plus = document.createElement("DIV");
        plus.innerText = ADD_SYMBOL;
        plus.title = "Dodaj tymczasowo";
        plus.addEventListener("click", (e) => {
          if (!gradeManagerEnabled) {
            gradeManager.focus();
            return;
          };
          displayGradeManagerOverlay(e.target.parentElement, options);
        });
        td.appendChild(plus);
        plus.classList.add("librusPro_add-grade", "librusPro_jqueryTitle");
      }
    }
    const averageI = getWeightedAverage(rows[i].querySelectorAll(`td:nth-child(${INDICES.ocenyI + OFFSET_CSS}) span.grade-box > a`), options);
    const averageII = getWeightedAverage(rows[i].querySelectorAll(`td:nth-child(${INDICES.ocenyII + OFFSET_CSS}) span.grade-box > a`), options);
    const averageR = getYearAverage(averageI, averageII);
    averages[i] = [averageI, averageII, averageR];
    avgI.sum += averageI.sum;
    avgI.weights += averageI.weights;
    avgII.sum += averageII.sum;
    avgII.weights += averageII.weights;

    // Wyświetlanie średnich dla poszczególnych przedmiotów
    if (options.calculateAverages) {
      const averageIndices = [INDICES.sredniaI, INDICES.sredniaII, INDICES.sredniaR];
      for (let j = 0; j < averageIndices.length; j++) {
        const elem = rows[i].children[averageIndices[j] + OFFSET_JS];
        elem.classList.add("right");
        // Jeśli była już jakaś średnia, która się różni od wyliczonej
        if (elem.innerText !== averages[i][j].average && elem.innerText.length > 2 && !options.debug && (recalculate || !options.hideOnes)) {
          if (!recalculate && !options.hideOnes) errors.push(elem);
            const correctAverage = document.createElement("SPAN");
            correctAverage.innerText = elem.firstElementChild ? elem.firstElementChild.innerText : ` (${elem.innerText})`;
            elem.innerText = averages[i][j].average;
            elem.appendChild(correctAverage);
        // Jeśli inna średnia po modyfikacji | [Jeśli przeliczamy średnie na nowo, (?) są już zastąpione]
        } else if (elem.innerText !== averages[i][j].average && recalculate) {
          const correctAverage = document.createElement("SPAN");
          if (options.debug) {
            correctAverage.innerText = ` ${elem.firstElementChild.innerText}`;
          } else {
            correctAverage.innerText = ` (${elem.innerText})`;
          }
          elem.innerText = averages[i][j].average;
          elem.appendChild(correctAverage);
        } else {
          if (options.debug) {
            const debugInfo = document.createElement("SPAN");
            debugInfo.innerText = ` (${elem.innerText}) [${averages[i][j].sum}; ${averages[i][j].weights}]`;
            elem.innerText = averages[i][j].average;
            elem.appendChild(debugInfo);  
          } else {
            elem.innerText = averages[i][j].average;
          }
        }
      }
    }
  }
  if (errors.length > 0) {
    const wrongAverageMessage = "[LibrusPro] » Przynajmniej jedna z obliczonych średnich przez LibrusaPro różni się od tej wyliczonej przez Librusa Synergię (poprawna znajduje się w nawiasach). W menu ustawień rozszerzenia możesz dostosować pewne parametry uwzględniane przy jej liczeniu do swojej konfiguracji szkoły. Aby uzyskać więcej informacji i pomóc w eliminacji potencjalnego błędu, skontaktuj się ze mną na Discordzie. (Link znajduje się w stopce na dole strony)";
    console.log(`%c${wrongAverageMessage}`, "color: #ff5555;");
    const legend = document.querySelector("#body > form:nth-child(5) > div > div > div.legend.left.stretch > h3");
    if (!options.averageWarn) {
      legend.innerText = wrongAverageMessage;
      legend.id = "error_legend";
      const cl = document.createElement("DIV");
      cl.innerText = REMOVE_SYMBOL;
      cl.addEventListener("click", function()  {
        document.getElementById("error_legend").style.display = "none";
        browserAPI.storage.sync.get(["options"], function (t) {
          let temp = t["options"];
          temp.averageWarn = true;
          browserAPI.storage.sync.set({
            ["options"]: temp
          });
        });
      });
      cl.classList.add("librusPro_error-close");
      legend.appendChild(cl);
    }
    if (options.debug) {
      errors.forEach((e) => {
        e.style.setProperty("color", "#ff5555", "important");
      });
    }
  }
  if (!recalculate) {
    // Możliwość modyfikacji ocen
    document.querySelectorAll(".grade-box:not(#Ocena0, .positive-behaviour, .negative-behaviour) > a").forEach((e) => {
      e.addEventListener("click", (event) => {
        if (!gradeManagerEnabled) {
          gradeManager.focus();
          return;
        };
        event.preventDefault();
        displayGradeManagerOverlay(event.target, options, false);
      });
    });
    // Wstawienie średnich w wierszu tabeli
    srednieTr.children[0].innerText = "";
    srednieTr.children[1].innerText = "Średnia";
    srednieTr.children[INDICES.ocenyI + OFFSET_JS].innerText = "";
    srednieTr.children[INDICES.ocenyII + OFFSET_JS].innerText = "";
    srednieTr.classList.add("librusPro_average");
    srednieTr.id = "librusPro_average";
    for (let u of ["sredniaI", "sredniaII", "sredniaR"]) {
      srednieTr.children[INDICES[u] + OFFSET_JS].classList.add("right");
    }
  }
  srednieTr.children[INDICES.sredniaI + OFFSET_JS].innerText = avgI.weights > 0 ? (Math.round(avgI.sum / avgI.weights * 100 + Number.EPSILON) / 100).toFixed(2) : NO_DATA;
  srednieTr.children[INDICES.sredniaII + OFFSET_JS].innerText = avgII.weights > 0 ? (Math.round(avgII.sum / avgII.weights * 100 + Number.EPSILON) / 100).toFixed(2) : NO_DATA;
  srednieTr.children[INDICES.sredniaR + OFFSET_JS].innerText = getYearAverage(avgI, avgII).average;

  // Wypisanie średnich z proponowanych i (śród)rocznych
  for (let u in midtermGrades) {
    if (INDICES[u] > 0) {
      const proposedOrFinal = u[0] === "p" ? "proposed" : "final";
      srednieTr.children[INDICES[u] + OFFSET_JS].innerText = getAverage(midtermGrades[u], DEPRESSION_MODE_COLORS[proposedOrFinal], options);
    }
  }

  // Poświetlenie średniej zaliczającej się na czerwony pasek
  if (!odOstLogowania) {
    for (const type of ["proponowaneR", "roczne"]) {
      const node = srednieTr.children[INDICES[type] + OFFSET_JS];
      if (+node.innerText >= 4.75) {
        node.style.setProperty("background", "linear-gradient(90deg, #cacaca 50%, #b53232 50%)", "important");
        node.style.setProperty("color", "#000000", "important");
      } else {
        node.style.background = null;
        node.style.color = null;
      }
    }
  }

  if (options.calculateAverages && !recalculate) {
    tbody.appendChild(srednieTr);
  }

  // Zmiana koloru ocen z zachowania oraz modernizacja dymka
  if (!recalculate) {
    if (options.depressionMode) {
      document.querySelectorAll(".positive-behaviour").forEach((e) => {
        e.style.background = DEPRESSION_MODE_COLORS.positiveBehavior;
      });
      document.querySelectorAll(".negative-behaviour").forEach((e) => {
        e.style.background = DEPRESSION_MODE_COLORS.negativeBehavior;
      });
    }
    if (options.modernizeTitles) {
      document.querySelectorAll(".positive-behaviour > a, .negative-behaviour > a").forEach((e) => {
        modernizeTitle(e);
      });
    }
  }
}

// ---------------------------------------- DODATKI ----------------------------------------

function finalizeDarkTheme() {
  // Zamiany obrazków na ich ciemne wersje
  const darkThemeAccents = {
    ".fold-start": "img/fold_dark.png",
    ".fold-end": "img/foldEnd_dark.png",
    ".fold-end-scroll": "img/foldEndScroll_dark.png",
    ".tree-first-branch": "img/drzewko4_dark.png",
    ".tree-next-branch": "img/drzewko1_dark.png",
    ".tree-last-branch": "img/drzewko2_dark.png",
  }
  const darkThemeImages = {
    '#gradeAverangeGraph > a > img': 'img/pobierz_wykres_ocen2_dark.png',
    '#absenceGraph > img': 'img/pobierz_wykres_absencji_dark.png',
    'img[src="/images/strzalka_prawo.gif"]': 'img/strzalka_prawo.png',
    'img[src="/images/strzalka_lewo.gif': 'img/strzalka_lewo.png',
    'img[src*="pomoc_ciemna.png"]': 'img/pomoc_ciemna.png',
  }

  for (let selector in darkThemeAccents) {
    document.querySelectorAll(selector).forEach((e) => {
      e.style.backgroundImage = `url(${browserAPI.runtime.getURL(darkThemeAccents[selector])})`;
    });
  }

  for (let selector in darkThemeImages) {
    document.querySelectorAll(selector).forEach((e) => {
      e.src = browserAPI.runtime.getURL(darkThemeImages[selector]);
      e.style.filter = "none";
    });
  }

  // Losowe bordery w tabelach, bo Librus dał losowo w css je na important... pepoWTF...
  document.querySelectorAll('.spacing, .no-border-left[title="Średnia ocen<br> z pierwszego okresu"], table.decorated table thead th, table.decorated table thead td').forEach((e) => {
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
      el.children[0].classList.add("librusPro_jqueryTitle");

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
insertGradeManager();

if (document.querySelector("#body > form:nth-child(5) > div > h2")?.innerText.includes("-")) {
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

  // Modernizacja dymków w widoku frekwencji
  if (options.modernizeTitles && window.location.href == "https://synergia.librus.pl/przegladaj_nb/uczen") {
    document.querySelectorAll(".box > .ocena").forEach(e => modernizeTitle(e));
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

  // Inne rozszerzenia
  if (document.getElementById(atob("TGlicGx1cw==")))
    alert(decodeURIComponent(escape(atob("W0xpYnJ1c1Byb10gV3lrcnl0byBpbm5lIHJvenN6ZXJ6ZW5pZSB6d2nEhXphbmUgeiBmdW5rY2pvbm93YW5pZW0gZHppZW5uaWthIExpYnJ1cyAoTGliUGx1cykuIEFieSB1bmlrbsSFxIcgcG90ZW5jamFsbnljaCBwcm9ibGVtw7N3IGkga29uZmxpa3TDs3cgeiBMaWJydXNQcm8sIHd5xYLEhWN6IHBvem9zdGHFgmUgcm96c3plcnplbmlhIGRvIExpYnJ1c2Eu"))));

  location.href = "javascript: librusPro_jqueryTitle()";
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

  yourNumber.classList.add("librusPro_jqueryTitle");
  yourNumber.title = "<b style='color: #b6dc3f'>Podgląd numerka z dziennika tylko z <b style='color: #a96fe3'>LibrusPro</b>!</b>";
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
  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" class="librusPro_icon" style="background: url(&quot;${browserAPI.runtime.getURL('img/icon.png')}&quot;);"></a>
  <div class="librusPro_footer">
    <span style="color: #96c5b4;">» Podoba się wtyczka? <a href="https://chrome.google.com/webstore/detail/libruspro-rozszerzenie-do/hoceldjnkcboafconokadmmbijbegdkf" target="_blank" class="librusPro_link">Zostaw 5<span style="font-size: 11px;">⭐</span></a></span>
    <div style="color: #94cae4;">» Wbijaj na oficjalny <a href="https://discord.gg/e9EkVEvsDr" target="_blank" class="librusPro_link">Discord</a>!</div>
    
    <div>» <span style="font-style: italic">LibrusPro © ${new Date().getFullYear()} Maks Kowalski</span></div>
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
      n.innerHTML = `<a id="polski" class="ocena librusPro_jqueryTitle" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">1</a>`;
      n.classList.add("grade-box");
      n.style.background = "#00FF00";
      const el = e.parentElement.children[pp];
      if (el.innerText == "Brak ocen") el.innerText = "";
      el.appendChild(n);
      document.getElementById("polski").title = `Kategoria: Kartkówka niezapowiedziana<br>Data: 2022-04-01 (pt.)<br>Nauczyciel: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br>Licz do średniej: tak<br>Waga: 3<br>Dodał: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br/><br/>Komentarz: Prima Aprilis<br/><span style="color: #777777; padding-left: 5px; font-style: italic">Kliknij mnie, aby ukryć.</span>`;
    } else if (e.innerText.toLowerCase().includes("matematyka") && !document.getElementById("matma")) {
      const n = document.createElement("SPAN");
      n.innerHTML = `<a id="matma" class="ocena librusPro_jqueryTitle" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">1</a>`;
      n.classList.add("grade-box");
      n.style.background = "#FF0000";
      const el = e.parentElement.children[pp];
      if (el.innerText == "Brak ocen") el.innerText = "";
      el.appendChild(n);
      document.getElementById("matma").title = `Kategoria: Praca klasowa<br>Data: 2022-04-01 (pt.)<br>Nauczyciel: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br>Licz do średniej: tak<br>Waga: 5<br>Dodał: ${document.querySelector("#user-section > b").innerText.split("(")[0]}<br/><br/>Komentarz: Prima Aprilis<br/><span style="color: #777777; padding-left: 5px; font-style: italic">Kliknij mnie, aby ukryć.</span>`;
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

  // Łączenie daty z dniem tygodnia: 1970-01-01 (pon.)
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

  // Otwieranie prac domowych w nowej karcie, a nie oknie
  document.querySelectorAll(`input[onclick*="otworz_w_nowym_oknie('/moje_zadania/podglad/"]`).forEach((e) => {
    const regex = /(otworz_w_nowym_oknie\(\'\/moje_zadania\/podglad\/)(\d*?)(\',\'o1\',650,600\);)/;
    e.outerHTML = e.outerHTML.replace(regex, `window.open('https://synergia.librus.pl/moje_zadania/podglad/$2');`);
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

// Otwieranie overlaya do dodawania/edycji ocen
function displayGradeManagerOverlay(element, options, isNew = true, isFinal = false) {
  const gradeManagerHeader = document.getElementById("librusPro_gradeManagerHeader");
  const weightInput = document.getElementById("librusPro_weight");
  const addButton = document.getElementById("librusPro_add");
  const editButton = document.getElementById("librusPro_edit");
  const removeButton = document.getElementById("librusPro_remove");
  const commentInput = document.getElementById("librusPro_comment");
  const gradeInput = document.getElementById("librusPro_grade");
  gradeManagerOverlay.style.display = "block";
  element.librusPro_options = options;
  gradeManagerHeader.innerText = isNew ? "Dodaj ocenę" : "Edytuj ocenę";
  weightInput.value = isFinal ? "0" : "1";
  weightInput.parentElement.style.display = (isFinal || element.parentElement.isFinal) ? "none" : "block";
  addButton.style.display = isNew ? "block" : "none";
  editButton.style.display =  isNew ? "none" : "block";
  removeButton.style.display =  isNew ? "none" : "block";
  if (isNew) {
    commentInput.parentElement.style.display = isFinal ? "none" : "block";
    gradeInput.value = "1";
    addButton.onclick = (e) => {
      gradeManagerOverlay.style.display = "none";
      // Usuwanie "Brak ocen"
      if (element.firstElementChild?.tagName == "SCRIPT") {
        element.firstElementChild?.remove();
        element.childNodes.forEach(n => n.remove());
      } else if (element.childNodes[0]?.nodeType === 3) element.childNodes[0].remove();
      addCustomGrade(element, isFinal);
    }
  } else {
    commentInput.parentElement.style.display = "none";
    let title = decodeURIComponent(escape(atob(element.dataset.title)));
    const regexp = /(<br>Waga: )(\d+?)(<br>)/;
    weightInput.value = title.match(regexp)?.[2] ?? weightInput.value;
    // Oceny inne niż liczbowe, np. bz
    if (document.querySelectorAll(`#librusPro_grade option[value="${element.innerText}"]`).length === 0) {
      const option = document.createElement("OPTION");
      option.value = element.innerText;
      option.innerText = element.innerText;
      gradeInput.appendChild(option);
    }
    gradeInput.value = element.innerText;
    editButton.onclick = (e) => {
      gradeManagerOverlay.style.display = "none";
      modifyGrade(element, title);
    }
    removeButton.onclick = (e) => {
      gradeManagerOverlay.style.display = "none";
      removeGrade(element, options);
    }
  }
}

// Tymczasowe dodawanie oceny
function addCustomGrade(element, isFinal) {
  gradeManagerOverlay.style.display = "none";
  const gradeBox = document.createElement("SPAN");
  gradeBox.classList.add("grade-box");
  gradeBox.style.backgroundColor = GRADE_MANAGER_DEFAULT_COLOR;
  const grade = document.createElement("A");
  grade.classList.add("ocena", "librusPro_jqueryTitle");
  grade.innerText = document.getElementById("librusPro_grade").value;
  grade.style.cursor = "pointer";
  let weight = Number(document.getElementById("librusPro_weight").value);
  if (weight < 0) weight = 0;
  let comment = document.getElementById("librusPro_comment").value;
  grade.title = `Kategoria: LibrusPro<br>Data: 2137-02-30 (nd.)<br>Nauczyciel: Maks Kowalski<br>Licz do średniej: ${isFinal ? "nie" : "tak"}<br>${weight > 0 ? `Waga: ${weight}<br>` : ""}Dodał: Maks Kowalski<br>${comment.length > 0 ? `<br>Komentarz: ${comment}` : ""}`;
  gradeBox.appendChild(grade);
  element.insertBefore(gradeBox, element.lastElementChild);
  location.href = "javascript: librusPro_jqueryTitle()";
  gradeBox.isFinal = isFinal;
  grade.addEventListener("click", (event) => {
    if (!gradeManagerEnabled) {
      gradeManager.focus();
      return;
    };
    event.preventDefault();
    displayGradeManagerOverlay(event.target, element.librusPro_options, false);
  });
  element.classList.remove("cursor-pointer", "librusPro_no-grade");
  handleGrades(element.librusPro_options, true);
}

// Tymczasowa modyfikacja oceny
function modifyGrade(element, title) {
  element.innerText = document.getElementById("librusPro_grade").value;
  if (!element.parentElement.isFinal) {
    let weight = Number(document.getElementById("librusPro_weight").value).toFixed(0);
    if (weight < 0) weight = 0;
    const regexp = /(<br>Waga: )(\d+?)(<br>)/;
    const countToAverageRegExp = /<br>Licz do średniej: (tak|nie)<br>/;
    let newTitle = title.replace(regexp, "$1" + weight + "$3");
    if (!title.match(countToAverageRegExp)) {
      newTitle += `<br>Licz do średniej: tak<br>`;
    }
    if (!title.match(regexp)) {
      newTitle += `<br>Waga: ${weight}<br>`;
    }
    newTitle = newTitle.replace(/(<br(\/?)>){2,}/g, "<br>")
    element.title = newTitle;
    if (element.librusPro_options.modernizeTitles) modernizeTitle(element);
    element.dataset.title = btoa(unescape(encodeURIComponent(newTitle)));
  }
  handleGrades(element.librusPro_options, true);
}

// Tymczasowe usuwanie oceny
function removeGrade(element) {
  const grade = element.parentElement;
  let gradeParent = grade.parentElement;
  // Regeneracja dodania nowej oceny
  if (grade.isFinal) {
    const noGradesPlaceholder = document.createTextNode(ADD_SYMBOL);
    gradeParent.addEventListener("click", function addGrade(e) {
      if (!gradeManagerEnabled) {
        gradeManager.focus();
        return;
      }
      displayGradeManagerOverlay(e.target, element.librusPro_options, true, true);
      gradeParent.removeEventListener("click", addGrade);
    });
    gradeParent.appendChild(noGradesPlaceholder);
    gradeParent.classList.add("librusPro_no-grade", "cursor-pointer");
  // Poprawione znajdują się w dodatkowym spanie z []
} else if (gradeParent.tagName == "SPAN") {
    for (let u of gradeParent.childNodes) {
      if (u.nodeType === Node.TEXT_NODE) u.remove();
    }
    if (gradeParent.children.length <= 1) {
      if (gradeParent.parentElement.children.length <= 2) {
        const noGradesPlaceholder = document.createTextNode("Brak ocen");
        gradeParent.parentElement.insertBefore(noGradesPlaceholder, gradeParent.parentElement.firstElementChild);
      }
      gradeParent.remove();
    }
  // // Wstawianie "Brak ocen"
  } else if (gradeParent.children.length <= 2) {
    const noGradesPlaceholder = document.createTextNode("Brak ocen");
    gradeParent.insertBefore(noGradesPlaceholder, gradeParent.firstElementChild);
  }
  grade.remove();
  handleGrades(element.librusPro_options, true);
}

const TITLE_MODERNIZATION = [
  [/(Ocena:|Lekcja:) ([\D\d]*?)(<br\/?>|$)/g, '<span class="librusPro_title-grade">$2</span>$3'],
  [/(Kategoria:|Rodzaj:) (.*?)(<br ?\/?>|$)/g, '<span class="librusPro_title-type">$2</span>$3'],
  [/(Data(:| zapowiedzi:| realizacji:| dodania:| ostatniej modyfikacji:| wystawienia:)) (.*?)(<br ?\/?>|$)/g, '<span class="librusPro_title-date">$3</span>$4'],
  [/(Licz do średniej:|Obowiązek wyk. zadania:|Czy wycieczka:) (Tak|tak|TAK|Nie|nie|NIE)/g, '<span class="librusPro_title-$2">$2</span>'],
  [/(Nauczyciel:|Dodał:|Uczeń:) (.*?)(<br ?\/?>|$)/g, '<span class="librusPro_title-user">$2</span>$3'],
  [/(Waga:) (\d+?)(<br ?\/?>|$)/g, '<b><span class="librusPro_title-weight">$2</span></b>$3'],
  [/(Komentarz:|Temat zajęć:) ([\D\d]*?)(<br ?\/?>|$)/g, '<span class="librusPro_title-comment">$2</span>$3'],
  [/(Opis:) ([\D\d]*?)Data dodania:/g, '<span class="librusPro_title-comment">$2</span>Data dodania:'],
  [/(Poprawa oceny:) (.{0,2}) \((.*?)\)(<br ?\/?>|$)/g, '<b class="librusPro_title-improved">$2</b> <span class="librusPro_title-brackets">(<span class="librusPro_title-type">$3</span>)</span>$4'],
  [/(Godzina lekcyjna:) (\d+?)<\/b>(<br ?\/?>|$)/g, '<span class="librusPro_title-improved">$2</span>$3'],
]

function modernizeTitle(element) {
  let title = element.title;
  for (let i of TITLE_MODERNIZATION) {
    title = title.replaceAll(i[0], '<b class="librusPro_title-label">$1</b> ' + i[1]);
  }
  element.title = title;
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
              <div class="librusPro_twoField" id="twoField2">
                  <label class="librusPro_title" style="margin-top: 5px;" for="librusPro_time">Godzina:</label>
                  <input type="time" id="librusPro_time" class="librusPro_input librusPro_inputTime">
              </div> 
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_subject"  id="librusPro_subjectSelectLabel">Przedmiot:</label>
              <select id="librusPro_subjectSelect" class="librusPro_select" onchange="librusPro_onSelectChange('subject')">
                  <option value="">-- wybierz --</option>                  
                  <option value="Inny" id="librusPro_subjectSelect-other">Inny (Jaki?)</option>
              </select>
              <label id="librusPro_subjectTitle" class="librusPro_title" style="display: none" for="librusPro_subject">Przedmiot:</label>
              <input placeholder="Matematyka" type="text" id="librusPro_subject" class="librusPro_input" style="display: none;">
          </div>
          <div class="librusPro_field">
              <label class="librusPro_title" for="librusPro_typeSelect">Typ:</label>
              <select id="librusPro_typeSelect" class="librusPro_select" onchange="librusPro_onSelectChange('type')">
                  <option value="">-- wybierz --</option>
                  <option value="Sprawdzian" style="background-color: #ebebeb; color: #333333">Sprawdzian</option>
                  <option value="Kartkówka">Kartkówka</option>
                  <option value="Praca domowa" style="background-color: #ebebeb; color: #333333">Praca domowa</option>
                  <option value="Odpowiedź ustna">Odpowiedź ustna</option>
                  <option value="Inny" style="background-color: #ebebeb; color: #333333">Inny (Jaki?)</option>
              </select>
              <label id="librusPro_typeTitle" class="librusPro_title" style="display: none" for="librusPro_type">Typ:</label>
              <input placeholder="Zaliczenie" type="text" id="librusPro_type" class="librusPro_input" style="display: none;">
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
      function librusPro_onSelectChange(kind) {
        const select = document.getElementById("librusPro_" + kind + "Select").value;
        const inputTitle = document.getElementById("librusPro_" + kind + "Title");
        const input = document.getElementById("librusPro_" + kind);
        if (select == "Inny") {
          inputTitle.style.display = "block";
          input.style.display = "block";
          input.value = "";
        } else {
          inputTitle.style.display = "none";
          input.style.display = "none";
          input.value = select;
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
    subjectSelect.value = "";
    subject.value = "";
    if (subjectSelectLabel.style.display === "none") {
      subjectInputTitle.style.display = "block";
      subjectInput.style.display = "block";
    }
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
  const subjectSelectLabel = document.getElementById("librusPro_subjectSelectLabel");
  const subjectSelect = document.getElementById("librusPro_subjectSelect");
  const subjectSelectOther = document.getElementById("librusPro_subjectSelect-other");
  const subject = document.getElementById("librusPro_subject");
  const subjectInputTitle = document.getElementById("librusPro_subjectTitle");
  const subjectInput = document.getElementById("librusPro_subject");
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
        addButton.title = 'Dodaj nowe wydarzenie';
        addButton.classList.add("librusPro_addButton", "librusPro_jqueryTitle");
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
        cell.classList.add("no-border-left", "no-border-right", "librusPro_custom", "librusPro_jqueryTitle");

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
        if (options.modernizeTitles) modernizeTitle(cell);

        const removeButton = document.createElement("a");
        removeButton.innerText = REMOVE_SYMBOL;
        removeButton.classList += "librusPro_removeButton";
        addListenerToRemoveButton(removeButton, cellKey, i);

        const editButton = document.createElement("a");
        editButton.innerText = ADD_SYMBOL;
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
      }
      location.href = "javascript: librusPro_jqueryTitle()";
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
      subjectSelect.value = "Inny";
      if (subjectSelectLabel.style.display === "none") {
        subjectInputTitle.style.display = "block";
        subjectInput.style.display = "block";
      } else {
        for (let i = 0; i < subjectSelect.options.length; i++) {
          if (subjectSelect.options[i].value === event.subject) {
            subjectSelect.value = event.subject;
          }
        }
        if (subjectSelect.value == "Inny") {
          subjectInputTitle.style.display = "block";
          subjectInput.style.display = "block";
        }
      }
      type.value = event.type;
      typeSelect.value = "Inny";
      typeInputTitle.style.display = "none";
      typeInput.style.display = "none";
      description.value = event.description;
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

      if (options.darkTheme) {
        document.querySelectorAll(`[onclick*="/terminarz/szczegoly_wolne/"]`).forEach((e) => {
          if (!e.innerText.includes("Nieobecność:")) {
            e.parentElement.parentElement.parentElement.parentElement.parentElement.classList.add("weekend");
          }
        });
      }
    }

    document.querySelectorAll("#scheduleForm > div > div > div > table > tbody:nth-child(2) > tr > td > div > table > tbody > tr > td:not(.librusPro_custom)").forEach((e) => {
      adjustCellContent(e, options);
      if (options.modernizeTitles) modernizeTitle(e);
    });

    let plan = t["plan"];
    if (plan) {
      let h = 0;
      const przedmioty = new Set();
      for (let d in plan) {
        if (d == "dzwonki") continue;
        h += plan[d].length;
        plan[d].forEach((e) => {
          if (e) przedmioty.add(e[0]);
        });
      }
      if (h > 0) {
        document.querySelectorAll(".center:not(.weekend) > .kalendarz-dzien").forEach((e) => {
          const timetable = document.createElement("ARTICLE");
          timetable.innerText = "≡";
          timetable.classList.add("librusPro_timetable", "librusPro_jqueryTitle");
          e.insertBefore(timetable, e.querySelector(".kalendarz-numer-dnia"));

          const dzienTyg = [...e.parentElement.parentElement.children].indexOf(e.parentElement);
          const t = plan[dzienTyg];
          const u = [];
          for (let i = 0; i < t.length; i++) {
            if (!t[i]) {
              if (i != 0) {
                u.push(`<b style="color: #0791bb">${i}.</b> <i style="color: #aaaaaa">(${plan.dzwonki[i]})</i> -`);
              }
              continue;
            }
            u.push(`<b style="color: #0791bb">${i}.</b> <i style="color: #aaaaaa">(${plan.dzwonki[i]})</i> ${t[i].join(' ')}`);
          }
          timetable.title = 'Plan lekcji <i style="color: #bbbbbb">(z bieżącego tygodnia)</i>:<br>' + u.join("<br>");
        });
      }
      if (przedmioty.size > 0) {
        [...przedmioty].sort().forEach((e) => {
          const o = document.createElement("OPTION");
          o.value = e;
          o.innerText = e;
          subjectSelect.insertBefore(o, subjectSelectOther);
        })
      } else {
        subjectSelectLabel.style.display = "none";
        subjectSelect.style.display = "none";
        subjectInput.style.display = "block";
        subjectInputTitle.style.display = "block";
      }
    }
    location.href = "javascript: librusPro_jqueryTitle()";
  });
}