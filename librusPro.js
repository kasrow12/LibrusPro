// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

// Config
const API = "https://synergia.librus.pl/gateway/api/2.0";
const DISCORD_LINK = "https://discord.gg/e9EkVEvsDr";
const CHROME_LINK = "https://chrome.google.com/webstore/detail/libruspro-rozszerzenie-do/hoceldjnkcboafconokadmmbijbegdkf";
const NO_DATA = "-";
const ADD_EDIT_SYMBOL = "✎";
const REMOVE_SYMBOL = "⨉";
const TIMETABLE_SYMBOL = "≡";
/*const PROXIMITY_COMMENTS_NUMBER = 100;*/
const TYPE_SUBJECT_LENGTH = 30;
const DESCRIPTION_LENGTH = 200;
const REGEXS = Object.freeze({
  gradeId: /https:\/\/synergia.librus.pl\/przegladaj_oceny\/szczegoly\/(\d*)/,
  weight: /(<br>Waga: )(\d+?)(<br>)/,
  category: /(Kategoria: )(.*?)(<br>)/,
  grade: /[0-6][+-]?/,
  countToAverage: /<br>Licz do średniej: (tak|nie)<br>/,
  gradeImprovement: /<br \/>Poprawa oceny:(.*)/,
  class: /^(([0-9\[\]](.+?))|([A-Za-z]{1,2}\d(.*?)))$/gm,
  proximityComment: /<tr class="line1"><td >(.*?)<\/td>/,
  homework: /(otworz_w_nowym_oknie\(\'\/moje_zadania\/podglad\/)(\d*?)(\',\'o1\',650,600\);)/,
  cancelled: /Odwołane zajęcia(\n.*) na lekcji nr: (\d+) \((.*)\)$/,
  substitution: /(Zastępstwo|Przesunięcie) z (.*) na lekcji nr: (\d+) \((.*)\)$/,
  description: /Opis: (.+?)(<br>|<br \/>)Data/,
  lastLogin: /(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}), IP: ((?:[0-9]{1,3}\.){3}[0-9]{1,3})<br \/>/g,
  lastLoginHeader: /<b>ostatnie (udane|nieudane) logowania:<\/b><br \/>(brak)?/g,
});
const URLS = Object.freeze({
  grades: "https://synergia.librus.pl/przegladaj_oceny/uczen",
  attendance: "https://synergia.librus.pl/przegladaj_nb/uczen",
  schedule: "https://synergia.librus.pl/terminarz",
  scheduleDetails: "https://synergia.librus.pl/terminarz/szczegoly",
  timetable: "https://synergia.librus.pl/przegladaj_plan_lekcji",
  homework: "https://synergia.librus.pl/moje_zadania",
  index: ["https://synergia.librus.pl/uczen/index", "https://synergia.librus.pl/rodzic/index"],
  comment: "https://synergia.librus.pl/komentarz_oceny/1",
  gradeDetails: "https://synergia.librus.pl/przegladaj_oceny/szczegoly",
  gdpr: "https://synergia.librus.pl/wydruki/wydruk_danych_osobowych/2137.pdf",
  newVersion: "https://synergia.librus.pl/gateway/ms/studentdatapanel/ui/",
  refreshSession: "https://synergia.librus.pl/refreshToken",
  notes: "https://synergia.librus.pl/uwagi",
  lessons: "https://synergia.librus.pl/zrealizowane_lekcje",
});
const ONLINE_LESSON = 'a[href^="https://liblink.pl/"]';
const OPTIONS_DEFAULT = Object.freeze({
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
  showTeacherFreeDays: true,
  enableGradeManager: true,
  averageValue: 1.80,
  insertTimetable: true,
  keepBlinker: false,
  hideFirstTerm: false,
});
const DEPRESSION_MODE_COLORS = Object.freeze({
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
});
const COLORS = Object.freeze({
  error: "#ff5555",
});
const TITLE_MODERNIZATION = Object.freeze([
  [/(Ocena:|Lekcja:) ([\D\d]*?)(<br\/?>|$)/g, '<span class="librusPro_title-grade">$2</span>$3'],
  [/(Kategoria:|Rodzaj:) (.*?)(<br ?\/?>|$)/g, '<span class="librusPro_title-type">$2</span>$3'],
  [/(Data(:| zapowiedzi:| realizacji:| dodania:| ostatniej modyfikacji:| wystawienia:)) (.*?)(<br ?\/?>|$)/g, '<span class="librusPro_title-date">$3</span>$4'],
  [/(Licz do średniej:|Obowiązek wyk. zadania:|Czy wycieczka:) (Tak|tak|TAK|Nie|nie|NIE)/g, '<span class="librusPro_title-$2">$2</span>'],
  [/(Nauczyciel:|Dodał:|Uczeń:) (.*?)(<br ?\/?>|$)/g, '<span class="librusPro_title-user">$2</span>$3'],
  [/(Waga:) (\d+?)(<br ?\/?>|$)/g, '<b><span class="librusPro_title-weight">$2</span></b>$3'],
  [/(Komentarz:|Temat zajęć:) ([\D\d]*?)($)/g, '<span class="librusPro_title-comment">$2</span>$3'],
  [/(Opis:) ([\D\d]*?)Data dodania:/g, '<span class="librusPro_title-comment">$2</span>Data dodania:'],
  [/(Poprawa oceny:) (.{0,2}) \((.*?)\)(<br ?\/?>|$)/g, '<b class="librusPro_title-improved">$2</b> <span class="librusPro_title-brackets">(<span class="librusPro_title-type">$3</span>)</span>$4'],
  [/(Godzina lekcyjna:) (\d+?)<\/b>(<br ?\/?>|$)/g, '<span class="librusPro_title-improved">$2</span>$3'],
]);
const PAGE_TITLES = Object.freeze({
  "default": "Synergia",
  "przegladaj_oceny": "Oceny",
  "przegladaj_nb": "Frekwencja",
  "wiadomosci": "Wiadomości",
  "ogloszenia": "Ogłoszenia",
  "terminarz": "Terminarz",
  "moje_zadania": "Zadania domowe",
  "plan_lekcji": "Plan lekcji",
  "gateway/api": "API",
  "zaplanowane_lekcje": "Zaplanowane",
  "zrealizowane_lekcje": "Zrealizowane",
});
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

let overlay;
let gradeManager;

// Kompatybilność
let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

// Od ostatniego logowania/w tym tygodniu
const gradesSinceLastLoginView = document.querySelector("form[name=\"PrzegladajOceny\"] > div > h2")?.innerText.includes("-") ?? false;

// Aktualizacja strony po zmianie ustawień
function registerOnStorageChange(isSchedule = false) {
  // Automatyczne odświeżanie po wszystkich zmianach (z pominięciem "Potwiedź ponowne przesłanie formularza")
  if (isSchedule) {
    browserAPI.storage.onChanged.addListener((changes, namespace) => {
      window.location.replace(window.location.href);
    });
    return;
  }

  // Tylko po zmianie opcji
  browserAPI.storage.onChanged.addListener((changes, namespace) => {
    if (changes["options"]) {
      window.location.replace(window.location.href);
    }
  });
}

// Wyświetlanie charakterystycznych dymków po najechaniu na dane elementy
function injectjQueryHook() {
  const code = `
    document.addEventListener('refreshjQueryTitles', () => {
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
      }).removeClass("librusPro_jqueryTitle");
    });`;
  const script = document.createElement('script');
  script.appendChild(document.createTextNode(code));
  (document.body || document.head || document.documentElement).appendChild(script);
}

// Dodawanie dymka do nowych elementów
function refreshjQueryTitles() {
  document.dispatchEvent(new CustomEvent('refreshjQueryTitles'));
}

// Wiadomość w konsoli
function printCreditsToConsole() {
  const code = `
    console.log("%cDzięki za korzystanie z rozszerzenia LibrusPro!", "color:#ce84c8;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold");
    console.log("%cJeżeli znajduje się tutaj cokolwiek czerwonego, bądź nie działa coś związanego z wtyczką, proszę zgłoś to.", "color:#d63d4a;font-size:1rem;font-weight:bold");
    console.log(" %cOficjalny Discord: ${DISCORD_LINK}", "color:#90e9f0;");
  `;
  const script = document.createElement('script');
  script.appendChild(document.createTextNode(code));
  (document.body || document.head || document.documentElement).appendChild(script);
}

// Świąteczne logo
function christmasBanner() {
  const banner = document.getElementById("top-banner");
  if (!banner) return;
  banner.src = browserAPI.runtime.getURL('img/christmas_banner.png');
  banner.style.setProperty("filter", "brightness(0.9) contrast(0.9)", "important");
  banner.title = "<b style='color: #fff823'>Poczuj magię świąt razem z <b style='color: #a96fe3'>LibrusPro</b>!</b>";
  banner.classList.add("librusPro_jqueryTitle");
}

// Pobieranie wykazu uczęszczania
async function getAttendanceLessonsStatistics(button) {
  try {
    await fetch(URLS.refreshSession);
    let userID = await fetch(`${API}/Me`)
    .then(response => response.json())
    .then(data => {return data["Me"]["Account"]["UserId"]});

    fetch(`${API}/Lessons`)
    .then(response => response.json())
    .then(async (lessons) => {
      document.querySelector(".librusPro_tfoot-text").innerText = "Widok przedstawia aktualne dane pobrane z dziennika Librus Synergia.";
      const container = document.getElementById("librusPro_lessonsAttendance");
      const template = document.createElement("template");
      const html = `
        <tr class="line0 bolded">
          <td></td>
          <td class="right">Razem</td>
          <td id="librusPro_totalAbsences">0</td>
          <td id="librusPro_totalAttendances">0</td>
          <td id="librusPro_totalAttendancePercent">%</td>
        </tr>`
      template.innerHTML = html.trim();
      container.insertBefore(template.content.firstChild, container.firstElementChild);
      const totalAbsencesEl = document.getElementById("librusPro_totalAbsences");
      const totalAttendancesEl = document.getElementById("librusPro_totalAttendances");
      const totalAttendancePercentEl = document.getElementById("librusPro_totalAttendancePercent");

      for (let lesson of lessons["Lessons"]) {
        fetch(`${API}/Attendances/LessonsStatistics/${lesson["Id"]}`)
        .then(response => response.json())
        .then(async (data) => {
          for (let lessonStats of data["LessonsStatistics"]) {
            if (lessonStats["Student"]["Id"] !== userID) continue;
            const subjectName = await fetch(`${API}/Subjects/${lesson["Subject"]["Id"]}`)
            .then(response => response.json())
            .then(data => {return data["Subject"]["Name"]});

            const teacherName = await fetch(`${API}/Users/${lesson["Teacher"]["Id"]}`)
            .then(response => response.json())
            .then(data => {return `${data["User"]["FirstName"]} ${data["User"]["LastName"]}`});

            const absences = lessonStats["Absences"];
            const attendances = lessonStats["Attendances"];
            const percent = ((attendances - absences) / attendances * 100).toFixed(2);

            const rowTemplate = document.createElement("template");
            const rowHtml = `
              <tr class="line0">
                <td>${subjectName}</td>
                <td>${teacherName}</td>
                <td>${absences}</td>
                <td>${attendances}</td>
                <td${percent < 50 ? ' class="librusPro_lessons-attendance-low"' : ""}>${percent}%</td$>
              </tr>`
            rowTemplate.innerHTML = rowHtml.trim();
            container.insertBefore(rowTemplate.content.firstChild, container.firstElementChild);

            totalAbsencesEl.innerText = +totalAbsencesEl.innerText + absences;
            totalAttendancesEl.innerText = +totalAttendancesEl.innerText + attendances;
            const totalPercent = ((+totalAttendancesEl.innerText - +totalAbsencesEl.innerText) / +totalAttendancesEl.innerText * 100).toFixed(2);
            totalAttendancePercentEl.innerText = totalPercent + "%";
          }
        });
      }
    });
  } catch(error) {
    console.log("%c[LibrusPro] » Wystąpił błąd przy pobieraniu statystyk frekwencji!", `color: ${COLORS.error};`);
    console.log(error);
    button.parentElement.parentElement.style.display = "table-row";
    const container = document.getElementById("librusPro_lessonsAttendance");
    const tr = document.createElement("TR");
    tr.classList.add("line0", "bolded");
    const errorMessage = document.createElement("td");
    errorMessage.innerText = "Wystąpił błąd!";
    errorMessage.colSpan = "5";
    errorMessage.classList.add("center");
    tr.appendChild(errorMessage);
    container.insertBefore(tr, container.firstElementChild);
    return;
  }
}

// Wyświetlanie komentarzy w pobliżu --- 10.01.22 fixed by Librus
/*function displayComments(comments) {
  // Pomijanie 'undefined' z początku i końca listy, ale pozostawienie ich w środku
  let start = comments.length;
  let end = 0;
  for (let i = 0; i < comments.length; i++) {
    if (comments[i] !== undefined) {
      end = i;
      if (i < start) start = i;
    }
  }
  const parent = document.querySelector(".container-background");
  if (start > end) {
    const header = document.createElement("H3");
    header.classList.add("center", "librusPro_header");
    header.innerText = "Nie znaleziono żadnych komentarzy w pobliżu!";
    parent.appendChild(header);
    return;
  }
  const template = document.createElement("template");
  const html = `
  <table class="decorated medium center">	
    <thead>
      <tr class="line1">
        <td style="width: 40px;">Pozycja</td>
        <td>Komentarz</td>
      </tr>
    </thead>
    <tbody id="librusPro_commentsBody">
    </tbody>
    <tfoot>
      <tr><td colspan="2">&nbsp;</td></tr>
    </tfoot>
  </table>`
  template.innerHTML = html.trim();
  parent.appendChild(template.content.firstChild);
  for (let i = start; i <= end; i++) {
    let pos = i - PROXIMITY_COMMENTS_NUMBER;
    const rowTemplate = document.createElement("template");
    const rowHtml = `
    <tr class="line1 ${pos === 0 ? "librusPro_comment-yours" : ""}">
      <td class="center">${(pos) > 0 ? "+" : ""}${pos}</td>
      <td>${comments[i] ?? ""}</td>
    </tr>`
    rowTemplate.innerHTML = rowHtml.trim();
    document.getElementById("librusPro_commentsBody").appendChild(rowTemplate.content.firstChild);
  }
}

// Pobieranie komentarzy w otoczeniu
async function getCommentsInProximity() {
  try {
    await fetch(URLS.refreshSession);
    const id = window.location.href.match(REGEXS.gradeId)?.[1] ?? 0;
    const comments = [];
    for (let i = 0; i <= 2 * PROXIMITY_COMMENTS_NUMBER; i++) {
      fetch(`${URLS.comment}/${+id + i - PROXIMITY_COMMENTS_NUMBER}`)
      .then(response => response.text())
      .then(data => {
        comments[i] = data.match(REGEXS.proximityComment)?.[1];

        // Jeśli wykonały się wszystkie poprzednie żądania, a to jest ostatnie, wyświetlamy
        if (Object.keys(comments).length > 2 * PROXIMITY_COMMENTS_NUMBER) {
          displayComments(comments);
        }
      });
    }
  } catch(error) {
    console.log(error);
    return;
  }
}

// Aktywacja komentarzy w pobliżu
function initCommentsInProximity() {
  const template = document.createElement("template");
  const html = `
  <div class="center">
    <input type="submit" id="librusPro_commentsButton" class="librusPro_comments-button ui-button ui-widget ui-state-default ui-corner-all" value="Wyświetl komentarze innych">
    <img class="tooltip helper-icon librusPro_jqueryTitle" title="<article class='librusPro_timetable-header'>LibrusPro <span class='librusPro_white'>|</span> <span class='librusPro_lightblue'>Podglądanie komentarzy</span></article><article style='text-align: justify;'>Jeżeli Twój nauczyciel wstawił oceny <span class='librusPro_lightgreen'>kilku osobom jednocześnie</span> np. ze sprawdzianu (dodawanie seryjne) i&nbsp;wpisał komentarze np. zawierające liczbę uzyskanych punktów przez każdego ucznia, bądź wynik procentowy, to korzystając z tego przycisku <span class='librusPro_water'>możesz podejrzeć te komentarze</span> ocen wpisanych w tym samym czasie co Tobie.</article><br><i class='librusPro_gray'>Przykładowa sytuacja:</i><article class='librusPro_seaweed librusPro_justify'>Nauczyciel wstawia wszystkim oceny ze sprawdzianu z&nbsp;rozdziału I. W komentarzu zamieścił informację ile miałeś(-aś) punktów na 20. Twój komentarz wygląda przykładowo:</article><b>&nbsp;Rozdział I - 19/20 95%</b><article class='librusPro_seaweed librusPro_justify'>Gdy użyjesz tego przycisku, wyświetli Ci się lista komentarzy wraz z odpowiednimi ich numerami.<br><span class='librusPro_lightgray'>&nbsp;-1 | Rozdział I - 15/20 75%<br>&nbsp;0 | Rozdział I - 19/20 95%<br>&nbsp;+1 | Rozdział I - 20/20 100%</span><br><span class='librusPro_white'>'0'</span> to Twój komentarz, więc te przed nim są wynikami osób <u>przed Tobą</u> na liście, a analogicznie za nim (z&nbsp;plusami), <u>po Tobie</u> na liście.</article><b class='librusPro_lightblue'>Podejrzeć możesz jedynie <u class='librusPro_greeno'>komentarze</u>!</b>" src="/images/pomoc_ciemna.png">
  </div>`
  template.innerHTML = html.trim();
  document.querySelector(".container-background").appendChild(template.content.firstChild);
  document.getElementById("librusPro_commentsButton").addEventListener("click", function(event) {
    event.target.parentElement.remove() ;
    getCommentsInProximity();
  });
}*/

// Aktywacja wykazu uczęszczania
function insertAttendanceStatistics() {
  let template = document.createElement('template');
  let html = `
  <h3 class="center librusPro_header">
    <div>Wykaz uczęszczania</div>
    <div class="librusPro_sub-header">Dzięki LibrusPro!</div>
  </h3>
  <table class="librusPro_attendance-table center big decorated" style="margin-bottom: 4em;">
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
      <td colspan="5"><input type="button" id="librusPro_attendanceButton" class="ui-button ui-widget ui-state-default ui-corner-all" value="Pobierz wykaz uczęszczania (Procenty frekwencji)"></td>
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
  const parent = document.querySelector(".container-background");
  parent.insertBefore(template.content.children[1], parent.firstChild);
  parent.insertBefore(template.content.firstChild, parent.firstChild);
  const button = document.getElementById("librusPro_attendanceButton");
  button.addEventListener("click", () => {
    button.parentElement.parentElement.style.display = "none";
    button.parentElement.parentElement.previousElementSibling?.remove();
    getAttendanceLessonsStatistics(button);
  });
}

// Pobranie indexów kolumn
function getGradeColumns() {
  document.querySelectorAll("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > thead > tr:nth-child(2) > td").forEach((e) => {
    const index = [...e.parentElement.children].indexOf(e);

    if (e.innerText === "Śr.I") INDICES.sredniaI = index;
    else if (e.innerText === "(I)") INDICES.proponowaneI = index;
    else if (e.innerText === "I") INDICES.srodroczneI = index;

    else if (e.innerText === "Śr.II") INDICES.sredniaII = index;
    else if (e.innerText === "(II)") INDICES.proponowaneII = index;
    else if (e.innerText === "II") INDICES.srodroczneII = index;

    else if (e.innerText === "Śr.R") INDICES.sredniaR = index;
    else if (e.innerText === "(R)") INDICES.proponowaneR = index;
    else if (e.innerText === "R") INDICES.roczne = index;

  });
  // Oceny bieżące są zawsze jeden przed średnimi
  INDICES.ocenyI = INDICES.sredniaI - 1;
  INDICES.ocenyII = INDICES.sredniaII - 1;
}

// Średnie
class Average {
  constructor(sum = 0, weights = 0) {
    this.sum = sum;
    this.weights = weights;
    this.calculate();
  }

  update() {
    this.calculate();
    return this;
  }

  calculate() {
    if (this.weights === 0) this.average = NO_DATA;
    else this.average = (Math.round(this.sum / this.weights * 100 + Number.EPSILON) / 100).toFixed(2);
  }

  // Liczenie średniej ze średnich (roczna)
  static combine(a, b) {
    if (a.weights + b.weights === 0) return new Average();
    return new Average(a.sum + b.sum, a.weights + b.weights);
  }

  // Liczenie średniej arytmetycznej np. do proponowanych
  static getMean(elements, background, options) {
    let sum = 0;
    let count = 0;
    elements.forEach((e) => {
      if (options.depressionMode) e.parentElement.style.background = background;
      e.parentElement.isFinal = true;
      if (!e.dataset.title) {
        e.dataset.title = btoa(encodeURIComponent(e.title));
        if (options.modernizeTitles) modernizeTitle(e);
      }
      if (!options.countZeros && e.innerText[0] === "0") return;
      if (!REGEXS.grade.test(e.innerText)) return;

      sum += +e.innerText[0];
      count++;
      if (e.innerText.length > 1) {
        if (e.innerText[1] === "+") sum += +options.plusValue;
        else if (e.innerText[1] === "-") sum -= +options.minusValue;
      }
    });
    if (count === 0) return new Average();
    return new Average(sum, count);
  }

  // Liczenie średniej ważonej, zwracając uwagę na parametr "Licz do średniej:"
  static getWeighted(elements, options) {
    if (elements.length < 1) return new Average();
    let sum = 0;
    let weights = 0;
    elements.forEach((e) => {
      let elementTitle;
      if (e.dataset.title) {
        elementTitle = decodeURIComponent(atob(e.dataset.title));
      } else {
        elementTitle = e.title;
        e.dataset.title = btoa(encodeURIComponent(e.title));
        if (options.modernizeTitles) modernizeTitle(e);
      }
      if (REGEXS.grade.test(e.innerText)) {
        let liczDoSredniej = elementTitle.match(REGEXS.countToAverage)?.[1] ?? "nie";
        if ((liczDoSredniej === "nie" && !options.countToAverage) || (!options.countZeros && e.innerText[0] === "0")) {
          if (options.depressionMode) {
            e.parentElement.style.setProperty("background", DEPRESSION_MODE_COLORS.other, "important");
          }
          return;
        }

        let weight;
        if (liczDoSredniej === "nie" && options.countToAverage) {
          weight = 1;
          weights++;
        } else {
          weight = elementTitle.match(REGEXS.weight)?.[2] ?? 0;
          if (weight === 0) {
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

        if (e.innerText.length === 1) sum += (+e.innerText) * weight;
        else if (e.innerText[1] === "+") sum += (+e.innerText[0] + +options.plusValue) * weight;
        else if (e.innerText[1] === "-") sum += (+e.innerText[0] - +options.minusValue) * weight;

      } else if (options.depressionMode) {
        e.parentElement.style.setProperty("background", DEPRESSION_MODE_COLORS.other, "important");
      }
    });

    if (sum < 0 || weights <= 0)
      return new Average();
    return new Average(sum, weights);
  }
}

// Wiersz Brak ocen
function insertNoGrades() {
  const noNewGrades = document.createElement("TR");
  noNewGrades.classList = "bolded line1 librusPro_no-grades-row";
  noNewGrades.innerHTML = `<td colspan="64" style="text-align: center;">Brak ocen <span class="emoji">😎</span></td>`;
  const ref = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > tbody");
  if (ref) {
    ref.insertBefore(noNewGrades, ref.firstElementChild);
  }
}

// System powiązanch modułów z ocenami
function handleGrades(options, recalculate = false) {
  const tbody = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type:not(#tabSource) > tbody");
  tbody.parentElement.classList.add("librusPro_grades-table");

  if (!document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > tbody > tr:nth-child(1):not([name=przedmioty_all])")) {
    insertNoGrades();
    return;
  }

  // Tworzenie wiersza ze średnimi
  let srednieTr;
  if (recalculate) {
    srednieTr = document.getElementById("librusPro_average");
  } else {
    srednieTr = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > tbody > tr:nth-child(1)").cloneNode(true);
    if (srednieTr.classList.contains("bolded")) {
      insertNoGrades();
      return;
    }
  }

  const midtermGrades = {
    srodroczneI: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.srodroczneI + OFFSET_CSS}) > span > a`),
    srodroczneII: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.srodroczneII + OFFSET_CSS}) > span > a`),
    roczne: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.roczne + OFFSET_CSS}) > span > a`),
    proponowaneI: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneI + OFFSET_CSS}) > span > a`),
    proponowaneII: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneII + OFFSET_CSS}) > span > a`),
    proponowaneR: tbody.querySelectorAll(`tr:not(.bolded) > td:nth-child(${INDICES.proponowaneR + OFFSET_CSS}) > span > a`),
  };

  const averages = [];
  const rows = document.querySelectorAll('form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type:not(#tabSource) > tbody > tr:not(.bolded, [id^="przedmioty"], .librusPro_average)');

  // Średnia z I i II okresu
  let avgI = new Average();
  let avgII = new Average();
  let errors = [];
  // Średnie dla poszczególnych przedmiotów 
  for (let i = 0; i < rows.length; i++) {
    // Możliwość dodawania nowych ocen
    if (!recalculate && gradeManager) {
      // (Proponowane) (śród)roczne
      for (let u of Object.keys(midtermGrades).filter((e) => { return INDICES[e] >= 0})) {
        const td = rows[i].children[INDICES[u] + OFFSET_JS];
        // Jeśli nie ma oceny, dodajemy po kliknięciu nową
        if (!td.firstElementChild) {
          td.onclick = (e) => {
            if (gradeManager && !gradeManager.enabled) {
              gradeManager.switch.focus();
              return;
            };
            gradeManager.showOverlay(e.target, true, true);
          };
          td.classList.add("librusPro_no-grade");
        }
      }
      // Dodawanie nowych ocen cząstkowych
      for (let u of ["ocenyI", "ocenyII"]) {
        const td = rows[i].children[INDICES[u] + OFFSET_JS];
        const plus = document.createElement("DIV");
        plus.innerText = ADD_EDIT_SYMBOL;
        plus.title = '<article class="librusPro_timetable-header">LibrusPro <span class="librusPro_white">|</span> <span class="librusPro_greeno">Dodaj tymczasowo</span></article>';
        plus.addEventListener("click", (e) => {
          if (gradeManager && !gradeManager.enabled) {
            gradeManager.switch.focus();
            return;
          };
          gradeManager.showOverlay(e.target.parentElement);
        });
        td.appendChild(plus);
        plus.classList.add("librusPro_add-grade", "librusPro_jqueryTitle");
      }
    }
    const averageI = Average.getWeighted(rows[i].querySelectorAll(`td:nth-child(${INDICES.ocenyI + OFFSET_CSS}) span.grade-box > a`), options);
    const averageII = Average.getWeighted(rows[i].querySelectorAll(`td:nth-child(${INDICES.ocenyII + OFFSET_CSS}) span.grade-box > a`), options);
    const averageR = Average.combine(averageI, averageII);
    averages[i] = [averageI, averageII, averageR];
    avgI.sum += averageI.sum;
    avgI.weights += averageI.weights;
    avgII.sum += averageII.sum;
    avgII.weights += averageII.weights;
    rows[i].children[INDICES.ocenyI + OFFSET_JS].librusPro_avg = averageI;
    rows[i].children[INDICES.ocenyII + OFFSET_JS].librusPro_avg = averageII;

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
    console.log(`%c${wrongAverageMessage}`, `color: ${COLORS.error};`);
    const legend = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > div.legend.left.stretch > h3");
    if (!options.averageWarn) {
      legend.innerText = wrongAverageMessage;
      legend.id = "error_legend";
      const closeButton = document.createElement("DIV");
      closeButton.innerText = REMOVE_SYMBOL;
      closeButton.addEventListener("click", function()  {
        document.getElementById("error_legend").style.display = "none";
        browserAPI.storage.sync.get(["options"], function (t) {
          let temp = t["options"];
          temp.averageWarn = true;
          browserAPI.storage.sync.set({
            ["options"]: temp
          });
        });
      });
      closeButton.classList.add("librusPro_error-close");
      legend.appendChild(closeButton);
    }
  }
  if (!recalculate) {
    // Możliwość modyfikacji ocen
    if (gradeManager) {
      document.querySelectorAll(".grade-box:not(#Ocena0, .positive-behaviour, .negative-behaviour) > a").forEach((e) => {
        e.addEventListener("click", (event) => {
          if (!gradeManager.enabled) {
            gradeManager.switch.focus();
            return;
          };
          event.preventDefault();
          gradeManager.showOverlay(event.target, false);
        });
      });
    }
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
  srednieTr.children[INDICES.sredniaI + OFFSET_JS].innerText = avgI.update().average;
  srednieTr.children[INDICES.sredniaII + OFFSET_JS].innerText = avgII.update().average;
  srednieTr.children[INDICES.sredniaR + OFFSET_JS].innerText = Average.combine(avgI, avgII).average;

  // Wypisanie średnich z proponowanych i (śród)rocznych
  for (let u in midtermGrades) {
    if (INDICES[u] > 0) {
      const proposedOrFinal = u[0] === "p" ? "proposed" : "final";
      srednieTr.children[INDICES[u] + OFFSET_JS].innerText = Average.getMean(midtermGrades[u], DEPRESSION_MODE_COLORS[proposedOrFinal], options).average;
    }
  }

  // Poświetlenie średniej zaliczającej się na czerwony pasek
  if (!gradesSinceLastLoginView) {
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

// Obrazki i bordery w css ustawione przez librusa na important
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

  if (window.location.href.indexOf(URLS.timetable) > -1) {
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

    // Ukrywanie soboty i niedzieli
    const saturdaysSundays = document.querySelectorAll("#timetableEntryBox:nth-child(8), #timetableEntryBox:nth-child(9)");
    if ([...saturdaysSundays].every((e) => e.children.length <= 0)) {
      saturdaysSundays.forEach((e) => e.remove());
      // Ukrywanie nagłówków
      document.querySelector("#body > div > div > form > table.decorated.plan-lekcji > thead > tr > td:nth-child(8)").remove();
      document.querySelector("#body > div > div > form > table.decorated.plan-lekcji > thead > tr > td:nth-child(8)").remove();
    }
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

// Ukrywanie ocen i średnich z I semestru
function hideFirstTermGrades() {
  // Oceny i średnie
  const gradeRows = document.querySelectorAll('.librusPro_grades-table > tbody > tr:not(.bolded, #przedmioty_zachowanie, [name="przedmioty_all"])');
  const firstTermIndices = [INDICES.ocenyI, INDICES.sredniaI, INDICES.srodroczneI];
  if (INDICES.proponowaneI > -1) firstTermIndices.push(INDICES.proponowaneI);
  gradeRows.forEach((e) => {
    for (let i of firstTermIndices) {
      e.children?.[i + OFFSET_JS].classList.toggle("librusPro_hidden");
    }
  });
  const behaviourRow = document.querySelector('.librusPro_grades-table > tbody > tr.bolded:not(.librusPro_no-grades-row)');
  behaviourRow?.children[0 + OFFSET_JS].classList.toggle("librusPro_hidden");
  const proposedOrFinalBehavior = behaviourRow?.children[1 + OFFSET_JS];
  proposedOrFinalBehavior?.classList.toggle("librusPro_hidden");
  if (proposedOrFinalBehavior?.classList.contains("librusPro_proposed-behavior")) {
    behaviourRow?.children[2 + OFFSET_JS].classList.toggle("librusPro_hidden");
  }
  // 'Okres 1'
  document.querySelector(".librusPro_grades-table > thead > tr:nth-child(1) > td:nth-child(3)")?.classList.toggle("librusPro_hidden");
  // 'Oceny bieżące, Śr.I., (I), I'
  const gradeRowsHeader = document.querySelector(".librusPro_grades-table > thead > tr:nth-child(2)");
  for (let i of firstTermIndices) {
    gradeRowsHeader?.children?.[i].classList.toggle("librusPro_hidden");
  }
}

// Ukrywanie frekwencji z I semestru
function hideFirstTermAbsence() {
  const absenceRows = document.querySelectorAll("#absence_form > div > div > table.center.big.decorated:not(.librusPro_attendance-table) > tbody > tr");
  let deleting = false;
  for (let i = 0; i < absenceRows.length; i++) {
    if (absenceRows[i].querySelector("td.center.bolded")?.innerText == "Okres 1") deleting = true;
    if (deleting) absenceRows[i].classList.add("librusPro_hidden");
  }
}

// Usuwanie jedynek
function hideOnes() {
  // Oceny poprawione (w dodatkowym spanie)
  document.querySelectorAll("span > .grade-box > a:not(#ocenaTest)").forEach((e) => {
    if (/[0-1][+-]?/.test(e.innerText)) {
      [...e.parentElement.parentElement.childNodes].forEach(elm => elm.nodeType !== 1 && elm.parentNode.removeChild(elm));
      const b = e.parentElement.nextElementSibling;
      if (b) b.firstElementChild.title = b.firstElementChild.title.replace(REGEXS.gradeImprovement, "");
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
      e.innerText = "2";
    }
  });
  removeBlinker();
}

// Wyłączenie mrugania zagrożeń
function removeBlinker() {
  document.querySelectorAll('span.grade-box + script').forEach((e) => {
    let gradeBox = e.previousElementSibling;
    e.parentElement.appendChild(gradeBox.cloneNode(true));
    gradeBox.remove();
  })
}

// Inne rozszerzenia - kompatybilność (a raczej jej brak)
function otherAddons() {
  if (document.getElementById(atob("TGlicGx1cw=="))) {
    alert(decodeURIComponent(atob("JTVCTGlicnVzUHJvJTVEJTIwJUMyJUJCJTIwV3lrcnl0byUyMGlubmUlMjByb3pzemVyemVuaWUlMjB6d2klQzQlODV6YW5lJTIweiUyMGZ1bmtjam9ub3dhbmllbSUyMGR6aWVubmlrYSUyMExpYnJ1cyUyMChMaWJQbHVzKS4lMjBBYnklMjB1bmlrbiVDNCU4NSVDNCU4NyUyMHBvdGVuY2phbG55Y2glMjBwcm9ibGVtJUMzJUIzdyUyMGklMjBrb25mbGlrdCVDMyVCM3clMjB6JTIwTGlicnVzUHJvJTJDJTIwd3klQzUlODIlQzQlODVjeiUyMHByb3N6JUM0JTk5JTIwcG96b3N0YSVDNSU4MmUlMjByb3pzemVyemVuaWElMjBkbyUyMExpYnJ1c2Eu")));
  }

  if (document.getElementsByTagName("TBODY")?.[5]?.lastElementChild?.innerText === decodeURIComponent(atob("JUM1JTlBcmVkbmlhJTIwb3JheiUyMEZyZWt3ZW5jamElMjBvYmxpY3pvbmElMjBkemklQzQlOTlraSUyMG9wcm9ncmFtb3dhbml1JTIwRG9taW5pa2ElMjBTenBpbHNraWVnbyUyMGklMjBQYXclQzUlODJhJTIwU3pld2N6eWth"))) {
    alert(decodeURIComponent(atob("JTVCTGlicnVzUHJvJTVEJTIwJUMyJUJCJTIwV3lrcnl0byUyMGlubmUlMjByb3pzemVyemVuaWUlMjB6d2klQzQlODV6YW5lJTIweiUyMGZ1bmtjam9ub3dhbmllbSUyMGR6aWVubmlrYSUyMExpYnJ1cyUyMChBc3lzdGVudCUyMExpYnJ1cykuJTIwQWJ5JTIwdW5pa24lQzQlODUlQzQlODclMjBwb3RlbmNqYWxueWNoJTIwcHJvYmxlbSVDMyVCM3clMjBpJTIwa29uZmxpa3QlQzMlQjN3JTIweiUyMExpYnJ1c1BybyUyQyUyMHd5JUM1JTgyJUM0JTg1Y3olMjBwcm9zeiVDNCU5OSUyMHBvem9zdGElQzUlODJlJTIwcm96c3plcnplbmlhJTIwZG8lMjBMaWJydXNhLg==")));
  }
}

// Proponowane zachowanie do tabeli głównej
function insertProposedBehavior() {
  const proposedBehaviors = document.querySelector("#przedmioty_zachowanie > td:nth-child(2) > table:first-of-type > tbody")?.querySelectorAll("[colspan='3']");

  // Wartości proponowanego zachowania
  propZachSrodroczne = proposedBehaviors?.[0]?.innerText.split(': ')[1];
  propZachRoczne = proposedBehaviors?.[2]?.innerText.split(': ')[1];
  if (!propZachSrodroczne && !propZachRoczne) return;

  // Elementy zachowania (śród)rocznego (i proponowanego) [niezmienne od proponowanych ocen I, II i R]
  const zachSrodroczneElement = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > tbody > tr.bolded > td:nth-child(4)");
  const zachRoczneElement = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > tbody > tr.bolded > td:nth-child(6)");
  const propZachSrodroczneElement = zachSrodroczneElement.cloneNode(true);
  const propZachRoczneElement = zachRoczneElement.cloneNode(true);

  // "-", bądź ocena z zachowania
  propZachSrodroczneElement.innerText = propZachSrodroczne;
  propZachRoczneElement.innerText = propZachRoczne;

  // Stylizacja proponowanych zachowań
  propZachSrodroczneElement.classList.add("librusPro_proposed-behavior");
  propZachRoczneElement.classList.add("librusPro_proposed-behavior");

  // Wstawienie stworzonych elementów
  zachSrodroczneElement.parentElement.insertBefore(propZachSrodroczneElement, zachSrodroczneElement);
  zachRoczneElement.parentElement.insertBefore(propZachRoczneElement, zachRoczneElement);

  // Zwężenie komórek, aby zrobić miejsce na nowe i wypełnić wiersz
  document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > tbody > tr.bolded > td:nth-child(3)").colSpan = "1";
  propZachSrodroczneElement.colSpan = INDICES.proponowaneI != -1 ? "2" : "1";
  zachSrodroczneElement.nextElementSibling.colSpan = "1";
  propZachRoczneElement.colSpan = INDICES.proponowaneII != -1 ? "3" : "2";
  zachRoczneElement.colSpan = INDICES.proponowaneR != -1 ? "3" : "2";
}

// Schowanie paska z zachowaniem
function collapseBehavior() {
  if (gradesSinceLastLoginView) {
    // Ukrycie zachowania, jeśli nie zostało zmienione
    const zachowanieTr = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table > tbody > tr.bolded");
    let toHide = true;
    zachowanieTr.querySelectorAll(".center:not(:first-child)").forEach((e) => {
      if (e.innerText !== "-") toHide = false;
    })
    if (toHide) zachowanieTr.style.display = "none";
  } else {
    // Zwinięcie zachowania
    let injectedCode = 'showHide.ShowHide("zachowanie")';
    if (document.getElementById("przedmioty_OP_zachowanie_node")) injectedCode += ',showHideOP.ShowHide("zachowanie");';
    const script = document.createElement('script');
    script.appendChild(document.createTextNode(injectedCode));
    (document.body || document.head || document.documentElement).appendChild(script);
  }
}

function adjustNavbar() {
  const ref = document.querySelector("#icon-oceny")?.parentElement;
  if (!ref) return;
  
  // Plan lekcji z Organizacji do głównego menu
  const timetableIcon = document.createElement("template");
  const html = `
  <li>
    <a href="javascript:void(window.open('${URLS.timetable}'))" id="icon-planlekcji">
      <span class="circle"></span>
      Plan lekcji
    </a>
  </li>`
  timetableIcon.innerHTML = html.trim();
  ref.parentElement.insertBefore(timetableIcon.content.firstChild, ref);

  // Ankiety zamiast planu lekcji w Organizaci, usunięcie pomocy i książęk
  document.querySelectorAll("#main-menu > ul > li > a").forEach((e) => {
    if (e.innerText == "Ankiety") e.parentElement.style.display = "none";
    if (e.innerText == "Pomoc") e.parentElement.style.display = "none";
    if (e.innerText == "Książki") e.parentElement.style.display = "none";
    if (e.innerText == "Organizacja") {
      const oldTimetable = e.parentElement.children[1].firstElementChild.firstElementChild;
      oldTimetable.href = "/ankiety_admin_ankiety";
      oldTimetable.innerText = "Ankiety";
    }
  })
}

// Wyświetlanie numeru z dziennika obok szczęśliwego + informacja gdy nim jest Twój
function displayStudentNumber(student) {
  const luckyNumber = document.querySelector("#user-section > span.luckyNumber");
  const luckyNumberDisabled = document.querySelector("#user-section > a > span.luckyNumber");

  let studentNumberWrapper = document.createElement("SPAN");
  studentNumberWrapper.innerText = "Twój numerek w dzienniku: ";
  const studentNumberEl = document.createElement("B");
  studentNumberEl.classList.add("librusPro_yourNumber");
  studentNumberWrapper.appendChild(studentNumberEl);
  
  studentNumberEl.innerText = student.number ?? "?";
  if (luckyNumber) {
    if (+document.querySelector("#user-section > span.luckyNumber > b").innerText === student.number) {
      const congratulations = document.createElement("SPAN");
      congratulations.classList.add("librusPro_congratulations")
      congratulations.innerText = "GRATULACJE!";
      studentNumberWrapper.appendChild(congratulations);
    }
    luckyNumber.parentElement.insertBefore(studentNumberWrapper, luckyNumber.nextSibling);
  } else if (luckyNumberDisabled) {
    studentNumberWrapper.style.marginLeft = "5px";
    luckyNumberDisabled.parentElement.parentElement.insertBefore(studentNumberWrapper, luckyNumberDisabled.parentElement.nextSibling);
  }

  studentNumberWrapper.classList.add("librusPro_jqueryTitle");
  studentNumberWrapper.title = "<article class='librusPro_timetable-header'>LibrusPro <span class='librusPro_white'>|</span> <span class='librusPro_lightblue'>Twój numerek</span></article><b style='color: #b6dc3f'>Funkcja dostępna tylko z rozszerzeniem <b class='librusPro_accent'>LibrusPro</b>!</b>";
  if (student.number === null) {
    studentNumberWrapper.title = `<b class="librusPro_error">Nie udało się pobrać Twojego numerka!</b>`;
  }
  refreshjQueryTitles();
}

// GDPR, delikatne zmiany headera oraz zmiana tytułu i ikony strony
function adjustHeader() {
  let lastLogin = document.querySelectorAll("#user-section > .tooltip");
  if (lastLogin.length > 0) {
    let title = lastLogin[0].title;
    const locations = ['Zimbabwe', 'Rosja', 'Afganistan', 'Białoruś', 'Czechy', 'Rumunia', 'Meksyk', 'Kuwejt', 'Indie', 'Niemcy', 'Czad', 'Bhutan', 'Sri Lanka', 'Somalia', 'Wietnam', 'Boliwia', 'Etiopia', 'Kanada', 'Lesotho', 'Mozambik', 'Peru', 'Sudan', 'Ukraina', 'Palestyna'];
    title = title.replaceAll(REGEXS.lastLoginHeader, '<b class="librusPro_title-$1">ostatnie $1 logowania:</b><article class="librusPro_last-login-header"><span class="librusPro_title-user">data</span> <span class="librusPro_title-type">godzina</span> <span class="librusPro_title-nie">adres IP</span> <span class="librusPro_greeno">lokalizacja</span></article>');
    title = title.replaceAll(REGEXS.lastLogin, '<article class="librusPro_last-login-row"><span class="librusPro_title-user">$1</span><span class="librusPro_title-type">$2</span><span class="librusPro_title-nie">$3</span><span class="librusPro_greeno">ajcazilakol</span></article>');
    title += '<article class="librusPro_last-login-row"><span class="librusPro_title-user">2005-04-02</span><span class="librusPro_title-type">21:37:00</span><span class="librusPro_title-nie">127.0.0.1</span><span class="librusPro_greeno">Watykan</span></article>';
    title = title.replace('ajcazilakol', 'Polska').replace('ajcazilakol', 'Polska');
    for (let i = 0; i < 9; i++) {
      title = title.replace('ajcazilakol', locations[Math.floor(Math.random()*locations.length)]);
    }
    lastLogin[0].title = title;
    lastLogin[1].title = title;
  }

  const gdprLink = document.querySelector("#user-section > b");
  if (gdprLink) {
    gdprLink.onclick = () => window.open(URLS.gdpr, '_blank').focus();
  }

  const loggedInAs = document.querySelector("#user-section > b > img");
  if (loggedInAs) {
    loggedInAs.title = `<b class="librusPro_lightgreen">Dzięki za korzystanie z rozszerzenia <b class='librusPro_accent'>LibrusPro</b>!</b><br><b class="librusPro_yellow">Jeżeli Ci się spodobało, nie zapomnij zostawić<br>5 gwiazdek w sklepie oraz polecić znajomym!</b><br><b class="librusPro_salmon"><i>Jedz Buraczki!</i></b>`;
  }

  document.querySelector('a[title="Bezpieczny Uczeń"]')?.parentElement?.remove();

  // Zmiana title
  let pageTitle = "LibrusPro | ";

  // Ilość nowych rzeczy
  let num = [...document.querySelectorAll(".button.counter")].reduce((total, e) => total + +e.innerText, 0);
  if (num > 0) {
    pageTitle = `(${num}) ${pageTitle}`;
  }

  // W zależności od podstrony
  let pageType = PAGE_TITLES.default;
  for (const e in PAGE_TITLES) {
    if (location.href.includes(e)) pageType = PAGE_TITLES[e];
  }
  document.title = pageTitle + pageType;

  // Zamiana favicon
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = browserAPI.runtime.getURL('img/icon.png');
}

// YYYY-MM-DD
function getYYYYMMDD(year, month, date) {
  return `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

// Copyright
function insertFooter() {
  const footer = document.getElementById("footer");
  if (!footer) return;
  footer.innerHTML = `
  <hr>
  <span id="bottom-logo"></span>
  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" class="librusPro_icon" style="background: url(&quot;${browserAPI.runtime.getURL('img/icon.png')}&quot;);"></a>
  <div class="librusPro_footer">
    <span class="librusPro_greeno">» Podoba się wtyczka? <a href="https://chrome.google.com/webstore/detail/libruspro-rozszerzenie-do/hoceldjnkcboafconokadmmbijbegdkf" target="_blank" class="librusPro_link">Zostaw 5<span style="font-size: 11px;">⭐</span></a></span>
    <div class="librusPro_water">» Wbijaj na oficjalny <a href="${DISCORD_LINK}" target="_blank" class="librusPro_link">Discord</a>!</div>
    
    <div>» <span style="font-style: italic">LibrusPro © ${new Date().getFullYear()} Maks Kowalski</span></div>
  </div>`;
}

function insertNote() {
  const lastNote = document.querySelector("#body > div > div > table > tbody > tr:last-child");
  if (lastNote) {
    let date = new Date();
    date = getYYYYMMDD(date.getFullYear(), date.getMonth() + 1, date.getDate());
    lastNote.insertAdjacentHTML('afterend', `
    <tr class="line1">
      <td>Korzystanie z wtyczki LibrusPro</td>
      <td class="small">${date}</td>
      <td>Maks Kowalski</td>
      <td>pozytywna</td>
      <td>inna</td>
    </tr>
    `);
  } else {
    const e = document.querySelector(".container.border-red.resizeable.center");
    if (!e) return;
    e.outerHTML = `
    <table class="decorated big center">
      <thead><tr><td>Uwaga</td><td>Data</td><td>Kto dodał</td><td>Rodzaj uwagi</td><td>Kategoria</td></tr></thead>
      <tbody>
          <tr class="line1">
            <td>Korzystanie z wtyczki LibrusPro</td>
            <td class="small">2022-01-09</td>
            <td>Maks Kowalski</td>
            <td>pozytywna</td>
            <td>inna</td>
          </tr>
      </tbody>
      <tfoot><tr><td colspan="5">&nbsp;</td></tr></tfoot>
    </table>`;
  }
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
  if (gradesSinceLastLoginView) {
    pp = 5;
  }
  document.querySelectorAll("form[name=\"PrzegladajOceny\"] > div > div > table:first-of-type > tbody > tr > td:nth-child(2)").forEach((e) => {
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
  refreshjQueryTitles();
}

// Prace domowe
function adjustHomeworks() {
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
    e.outerHTML = e.outerHTML.replace(REGEXS.homework, `window.open('https://synergia.librus.pl/moje_zadania/podglad/$2');`);
  });
}

// Automatyczne ładowanie strony w tle co 20 min, aby utrzymać sesję
function disableAutoLogout() {
  // Załadowanie strony w tle co 20 minut, aby nie wylogowywało
  const code = `function refreshLibrus() {
    fetch('https://synergia.librus.pl/wiadomosci', { cache: 'no-cache', credentials: 'same-origin' });
    fetch('${URLS.refreshSession}');
  }
  setInterval(refreshLibrus, 20*60*1000);`;
  const refreshScript = document.createElement('script');
  refreshScript.appendChild(document.createTextNode(code));
  (document.body || document.head || document.documentElement).appendChild(refreshScript);
}

// Modernizacja dymka
function modernizeTitle(element) {
  let title = element.title;
  for (let i of TITLE_MODERNIZATION) {
    title = title.replaceAll(i[0], '<b class="librusPro_title-label">$1</b> ' + i[1]);
  }
  element.title = title;
}

// szósteczki - maybe kiedyś
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach((e) => {if (/[0-6][+-]?/.test(e.innerText)) e.innerText = "6"});
// document.querySelectorAll(".grade-box > a:not(#ocenaTest)").forEach((e) => {
//   if (/[0-6][+-]?/.test(e.innerText))
//     e.innerText = Math.floor(Math.random() * (7 - 4) + 4)
//   if (Math.random() < 0.2) {
//     e.innerText += "+";
//   } else if (Math.random() < 0.2) {
//     e.innerText += "-";
//   }
// });
// document.querySelectorAll("form[name=\"PrzegladajOceny\"] > div > div > table > tbody > tr:not(.bolded) > td:nth-child(4)").forEach((e) => {e.innerText = "6.00"});
// document.querySelectorAll("form[name=\"PrzegladajOceny\"] > div > div > table > tbody > tr:not(.bolded) > td:nth-child(10)").forEach((e) => {e.innerText = "6.00"});
// document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table > tbody > tr.bolded.line1 > td:nth-child(5)").innerText = "wzorowe";
// document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table > tbody > tr.bolded.line1 > td:nth-child(4)").innerText = "wzorowe";

class GradeManager {
  constructor(parent, options) {
    this.options = options;
    parent.insertAdjacentHTML("afterend", `
    <td class="librusPro_grade-manager-icon">
      <img src="${browserAPI.runtime.getURL('img/pen.png')}">
    </td>
    <td class="librusPro_grade-manager">
      <label class="librusPro_grade-manager-label">
        <span>Tymczasowa modyfikacja ocen:</span>
        <input type="checkbox" id="librusPro_gradeManagerCheckbox">
        <img class="tooltip helper-icon librusPro_jqueryTitle" title="<article class='librusPro_timetable-header'>LibrusPro <span class='librusPro_white'>|</span> <span class='librusPro_lightblue'>Modifykacja ocen</span></article><article class='librusPro_justify'>Gdy to ustawienie jest <b class='librusPro_title-tak'>włączone</b>, możesz tymczasowo, <u>lokalnie</u> <span class='librusPro_lightgreen'>dodawać</span> nowe oceny, bądź <span class='librusPro_lightblue'>edytować</span> i&nbsp;<span class='librusPro_salmon'>usuwać</span> bieżące, aby sprawdzić jaką miał(a)byś wtedy średnią.</article><article class='librusPro_seaweed librusPro_justify librusPro_italic'>(Po odświeżeniu strony <span class='librusPro_yellow'>wszystko wraca</span> do stanu sprzed modyfikacji! Wszystkie zmiany zachodzą jedynie lokalnie i <span class='librusPro_salmon'>nie mają wpływu na Twoje rzeczywiste oceny!</span>)</article><article class='librusPro_lightgreen librusPro_justify'>W menu dodawania ocen cząstkowych możesz zobaczyć <span class='librusPro_white'>ile jeszcze jedynek</span> możesz zdobyć, aby uzyskać daną średnią.</article><article class='librusPro_water librusPro_justify librusPro_italic'>Domyślną średnią dla tego widoku możesz zmienić w&nbsp;<u>ustawieniach rozszerzenia</u>, jak i całkowicie wyłączyć tymczasową modyfikację ocen.</article><b class='librusPro_lightblue'>Oceny możesz dodawać dzięki '<span class='librusPro_white'>${ADD_EDIT_SYMBOL}</span>',<br>a modyfikować po prostu <span class='librusPro_white'>klikając na daną ocenę</span>.</b>" src="/images/pomoc_ciemna.png">
      </label>
      <div class="librusPro_grade-manager-advice">(Najedź, aby dowiedzieć się więcej)</div>
    </td>
    <div class="librusPro_overlay-body" id="librusPro_gradeManagerOverlay">
      <div class="librusPro_overlay-container">
          <div class="librusPro_header-container">
            <img src="${browserAPI.runtime.getURL('img/icon.png')}" class="librusPro_overlay-logo">
            <div class="librusPro_overlay-header-column">
              <div class="librusPro_overlay-header librusPro_overlay-header-adding">Dodaj ocenę</div>
              <div class="librusPro_overlay-header librusPro_overlay-header-editting">Edytuj ocenę</div>
              <div class="librusPro_overlay-header librusPro_overlay-header-normal-grade">cząstkową</div>
              <div class="librusPro_overlay-header librusPro_overlay-header-final-grade">śródroczną</div>
            </div>
          </div>
          <label class="librusPro_overlay-input-label">
            <div class="librusPro_overlay-input-title">Ocena:</div>
            <select class="librusPro_overlay-input" id="librusPro_grade">
              <option value="nb">nieobecny</option>
            </select>
          </label>
          <label class="librusPro_overlay-input-label">
            <div class="librusPro_overlay-input-title">Kategoria:</div>
            <select class="librusPro_overlay-input" id="librusPro_category">
              <option value="">-- wybierz --</option>
            </select>
          </label>
          <div class="librusPro_overlay-input-two-label" id="librusPro_categoryDetailsLabel">
            <label class="librusPro_overlay-input-label">
              <div class="librusPro_overlay-input-title">Waga:</div>
              <input placeholder="2" type="number" step="1" min="0" max="999" id="librusPro_weight" class="librusPro_overlay-input">
            </label>
            <label class="librusPro_overlay-input-label">
              <div class="librusPro_overlay-input-title">Licz do średniej:</div>
              <select class="librusPro_overlay-input" id="librusPro_countToTheAverage">
                <option value="true" selected>Tak</option>
                <option value="false">Nie</option>
              </select>
            </label>
          </div>
          <label class="librusPro_overlay-input-label" id="librusPro_commentLabel">
            <div class="librusPro_overlay-input-title">Komentarz:</div>
            <textarea placeholder="Rodział 4" id="librusPro_comment"
              class="librusPro_overlay-input librusPro_overlay-input-textarea" rows="2"></textarea>
          </label>
          <div class="librusPro_overlay-button-container">
            <button type="button" class="librusPro_overlay-button librusPro_overlay-button-add"
              id="librusPro_addGrade">Dodaj</button>
            <button type="button" class="librusPro_overlay-button librusPro_overlay-button-edit"
              id="librusPro_editGrade">Edytuj</button>
            <button type="button" class="librusPro_overlay-button librusPro_overlay-button-remove"
              id="librusPro_removeGrade">Usuń</button>
            <button type="button" class="librusPro_overlay-button librusPro_overlay-button-close"
              id="librusPro_closeButton">Zamknij</button>
          </div>
          <div class="librusPro_overlay-header librusPro_overlay-section-header">Kalkulator jedynek</div>
          <div class="librusPro_overlay-input-two-label" id="librusPro_onesContainer">
            <label class="librusPro_overlay-input-label">
              <div class="librusPro_overlay-input-title">Ile jedynek:</div>
              <input placeholder="16" type="number" step="1" min="0" max="999" id="librusPro_ones" class="librusPro_overlay-input">
            </label>
            <label class="librusPro_overlay-input-label">
              <div class="librusPro_overlay-input-title">Średnia:</div>
              <input value="1.80" placeholder="1.80" type="number" step="0.01" min="1" max="6" id="librusPro_onesAverage" class="librusPro_overlay-input">
            </label>
          </div>
          <div class="librusPro_overlay-footer">
            <div class="librusPro_overlay-footer-text">© <span id="librusPro_currentYear"></span></div>
            <a href="${CHROME_LINK}"
              target="_blank" class="librusPro_overlay-footer-link">Zostaw 5<span style="font-size: 11px;">⭐</span></a>
            <a class="librusPro_overlay-footer-link" target="_blank" href="${DISCORD_LINK}">Discord</a>
            <div class="librusPro_overlay-footer-text">v <span id="librusPro_currentVersion"></span></div>
          </div>
        </div>
      </div>`);
    this.switch = document.getElementById("librusPro_gradeManagerCheckbox");
    this.overlay = document.getElementById("librusPro_gradeManagerOverlay");
    this.gradeInput = document.getElementById("librusPro_grade");
    this.weightInput = document.getElementById("librusPro_weight");
    this.categoryInput = document.getElementById("librusPro_category");
    this.countInput = document.getElementById("librusPro_countToTheAverage");
    this.commentInput = document.getElementById("librusPro_comment");
    this.addButton = document.getElementById("librusPro_addGrade");
    this.editButton = document.getElementById("librusPro_editGrade");
    this.removeButton = document.getElementById("librusPro_removeGrade");
    this.onesInput = document.getElementById("librusPro_ones");
    this.onesAverageInput = document.getElementById("librusPro_onesAverage");
    document.getElementById("librusPro_currentYear").innerText = new Date().getFullYear();
    document.getElementById("librusPro_currentVersion").innerText = browserAPI.runtime.getManifest().version;
  
    document.addEventListener("click", (event) => {
      // Jeśli nie jest przyciskiem dodawania/edycji oraz kliknięte poza overlayem, bądź na przycisk zamknij
      if (!event.target.matches(".librusPro_add-grade, .librusPro_no-grade, .ocena, .grade-box") 
        && (event.target.matches("#librusPro_closeButton") 
        || !event.target.closest(".librusPro_overlay-container"))) {
          this.overlay.style.display = "none";
          this.overlay.classList.remove("librusPro_overlay-adding");
          this.overlay.classList.remove("librusPro_overlay-editting");
          this.overlay.classList.remove("librusPro_overlay-grade-final");
        }
    }, false);
  
    this.switch.onchange = (e) => {
      this.enabled = this.switch.checked;
      document.querySelectorAll(".librusPro_no-grade").forEach((el) => {
        el.innerText = this.enabled ? ADD_EDIT_SYMBOL : NO_DATA;
        el.classList.toggle("cursor-pointer");
      });    
      document.querySelectorAll(".librusPro_add-grade").forEach((el) => {
        el.classList.toggle("librusPro_add-grade-enabled");
      });    
    }

    browserAPI.storage.local.get(["colors", "gradeTypes", "gradeCategories"], (data) => {
      if (!data["colors"] || !data["gradeTypes"] || !data["gradeCategories"]) {
        browserAPI.runtime.sendMessage({msg: 'fetchGradeManagerValues'}, ([c, t, g]) => { this.populateOverlay(c,t,g) });
        return;
      }
      this.populateOverlay(data["colors"], data["gradeTypes"], data["gradeCategories"]);
    });
  }

  populateOverlay(colors, types, categories) {
    this.colors = colors;
    this.categories = categories;

    for (let e in types) {
      const option = document.createElement("OPTION");
      option.innerText = e;
      option.value = types[e];
      this.gradeInput.appendChild(option);
    }

    for (let e in this.categories) {
      const option = document.createElement("OPTION");
      option.innerText = this.categories[e].name;
      option.value = e;
      this.categoryInput.appendChild(option);
      const color = this.colors[this.categories[e].color];
      const useLight = isLightFontColorForBackground(color);
      option.style.setProperty("background-color", color, "important");
      if (useLight) {
        option.style.setProperty("color", "#fff", "important");
      } else {
        option.style.setProperty("color", "#333", "important");
      }
    }

    this.categoryInput.onchange = () => {
      const id = this.categoryInput.value;
      const e = this.categories[id] ?? {
        count: true,
        weight: 1,
        color: 1,
      };
      this.countInput.value = e.count;
      this.weightInput.value = e.weight ?? 0;
      this.selectedColor = this.colors[e.color];
      if (this.categories[id]) {
        this.categoryInput.style.setProperty("background-color", this.selectedColor, "important");
        this.categoryInput.style.setProperty("color", this.categoryInput.options[this.categoryInput.selectedIndex].style.color, "important");
        this.categoryInput.style.filter = "brightness(0.6)";
      } else {
        this.categoryInput.style.background = "";
        this.categoryInput.style.color = "";
        this.categoryInput.style.filter = "";
      }
    }
  }

  showOverlay(element, isNew = true, isFinal = false) {
    this.overlay.style.display = "block";
    this.overlay.classList.remove("librusPro_overlay-adding", "librusPro_overlay-editting", "librusPro_overlay-grade-final");
    this.overlay.classList.add(`librusPro_overlay-${isNew ? "adding" : "editting"}`);
    if (isFinal || element.parentElement.isFinal) this.overlay.classList.add("librusPro_overlay-grade-final");
    this.categoryInput.value = "";
    this.categoryInput.style.background = "";
    this.categoryInput.style.color = "";
    this.categoryInput.style.filter = "";
    this.countInput.value = "true";
    this.selectedColor = this.colors[1];
    this.weightInput.value = isFinal ? "0" : "1";
    this.commentInput.value = "";
    if (isNew) {
      this.gradeInput.value = "1";
      this.addButton.onclick = (e) => {
        if (isFinal) {
          element.onclick = null;
        }
        // Usuwanie "Brak ocen"
        if (element.firstElementChild?.tagName == "SCRIPT") {
          element.firstElementChild?.remove();
          element.childNodes.forEach(n => n.remove());
        } else if (element.childNodes[0]?.nodeType === 3) {
          element.childNodes[0].remove();
        }
        this.addGrade(element, isFinal);
        this.overlay.style.display = "none";
      }

      // Liczenie ile jedynek
      if (element.librusPro_avg) {
        this.onesAverageInput.value = this.options.averageValue;
        const ones = GradeManager.calculateOnesAverage(element.librusPro_avg, this.onesAverageInput.value);
        this.onesInput.value = ones.ones;
        this.onesAverageInput.value = ones.avg ?? 0;

        this.onesInput.onchange = () => {
          const ones = GradeManager.calculateOnesAverage(element.librusPro_avg, null, this.onesInput.value);
          this.onesAverageInput.value = ones.avg;
        }

        this.onesAverageInput.onchange = () => {
          const ones = GradeManager.calculateOnesAverage(element.librusPro_avg, this.onesAverageInput.value);
          this.onesInput.value = ones.ones;
        }
      }
    } else {
      let title = decodeURIComponent(atob(element.dataset.title));
      this.weightInput.value = title.match(REGEXS.weight)?.[2] ?? this.weightInput.value;
      this.countInput.value = title.match(REGEXS.countToAverage)?.[1] === "tak" ? true : false;
      let cat = title.match(REGEXS.category)?.[2];
      for (let c in this.categories) {
        if (this.categories[c].name === cat
          && this.categoryInput.querySelector(`[value="${c}"]`).style.backgroundColor === element.parentElement.style.backgroundColor) {
          this.categoryInput.value = c;
          this.selectedColor = this.colors[this.categories[c].color];
          this.categoryInput.style.setProperty("background-color", this.selectedColor, "important");
          this.categoryInput.style.setProperty("color", this.categoryInput.options[this.categoryInput.selectedIndex].style.color, "important");
          this.categoryInput.style.filter = "brightness(0.6)";
        }
      }
      this.gradeInput.value = element.innerText;
      this.editButton.onclick = (e) => {
        this.modifyGrade(element, title);
        this.overlay.style.display = "none";
      }
      this.removeButton.onclick = (e) => {
        this.removeGrade(element);
        this.overlay.style.display = "none";
      }
    }
  }

  addGrade(element, isFinal) {
    const gradeBox = document.createElement("SPAN");
    gradeBox.classList.add("grade-box");
    gradeBox.style.backgroundColor = this.selectedColor;
    const grade = document.createElement("A");
    grade.classList.add("ocena", "librusPro_jqueryTitle");
    grade.innerText = this.gradeInput.value;
    grade.style.cursor = "pointer";
    if (isFinal) {
      grade.title = `Kategoria: ${this.categoryInput.selectedOptions[0].innerText}<br>Data: 2137-02-30 (nd.)<br>Nauczyciel: Maks Kowalski<br>Licz do średniej: nie<br>Dodał: Maks Kowalski`;
    } else {
      let weight = Number(this.weightInput.value);
      if (weight < 0) weight = 0;
      const comment = this.commentInput.value;
      const count = this.countInput.value === "true";
      grade.title = `Kategoria: ${this.categoryInput.selectedOptions[0].innerText}<br>Data: 2137-02-30 (nd.)<br>Nauczyciel: Maks Kowalski<br>Licz do średniej: ${count ? "tak" : "nie"}<br>Waga: ${weight}<br>Dodał: Maks Kowalski<br>${comment.length > 0 ? `<br>Komentarz: ${comment}` : ""}`;
    }
    gradeBox.appendChild(grade);
    element.insertBefore(gradeBox, element.lastElementChild);
    refreshjQueryTitles();
    gradeBox.isFinal = isFinal;
    grade.addEventListener("click", (event) => {
      if (!this.enabled) {
        this.switch.focus();
        return;
      };
      event.preventDefault();
      this.showOverlay(event.target, false);
    });
    element.classList.remove("cursor-pointer", "librusPro_no-grade");
    handleGrades(this.options, true);
  }

  modifyGrade(element, title) {
    element.innerText = this.gradeInput.value;
    element.parentElement.style.backgroundColor = this.selectedColor;
    let newTitle = title.replace(REGEXS.category, "$1" + this.categoryInput.selectedOptions[0].innerText + "$3");
    if (!element.parentElement.isFinal) {
      let weight = Number(this.weightInput.value).toFixed(0);
      if (weight < 0) weight = 0;
      newTitle = newTitle.replace(REGEXS.weight, "$1" + weight + "$3");
      const count = this.countInput.value === "true" ? "tak" : "nie";
      newTitle = newTitle.replace(REGEXS.countToAverage, `<br>Licz do średniej: ${count}<br>`);
      if (!title.match(REGEXS.countToAverage)) {
        newTitle += `<br>Licz do średniej: ${count}<br>`;
      }
      if (!title.match(REGEXS.weight)) {
        newTitle += `<br>Waga: ${weight}<br>`;
      }
      newTitle = newTitle.replace(/(<br(\/?)>){2,}/g, "<br>");
    }
    element.title = newTitle;
    if (this.options.modernizeTitles) modernizeTitle(element);
    element.dataset.title = btoa(encodeURIComponent(newTitle));
    handleGrades(this.options, true);
  }

  removeGrade(element) {
    const grade = element.parentElement;
    let gradeParent = grade.parentElement;
    // Regeneracja dodania nowej oceny (śród)rocznej
    if (grade.isFinal) {
      const noGradesPlaceholder = document.createTextNode(ADD_EDIT_SYMBOL);
      gradeParent.onclick = (e) => {
        if (!this.enabled) {
          this.switch.focus();
          return;
        }
        this.showOverlay(e.target, true, true);
      };
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
    // Wstawianie "Brak ocen"
    } else if (gradeParent.children.length <= 2) {
      const noGradesPlaceholder = document.createTextNode("Brak ocen");
      gradeParent.insertBefore(noGradesPlaceholder, gradeParent.firstElementChild);
    }
    grade.remove();
    handleGrades(this.options, true);
  }

  static calculateOnesAverage(avg, wantedAvg, ones) {
    if (!ones && wantedAvg <= "1") {
      return {
        ones: 0,
        avg: +wantedAvg,
      };
    }
    if (wantedAvg > avg.average || ones < 0) {
      return {
        ones: 0,
        avg: avg.average === NO_DATA ? 0 : avg.average,
      };
    }
    let t = new Average(avg.sum, avg.weights);
    if (wantedAvg) {
      let n = 0;
      let lastAvg = avg.average;
      while (t.average > wantedAvg) {
        lastAvg = t.average;
        n++;
        t.sum++;
        t.weights++;
        t.calculate();
      }
      return {
        ones: n - 1,
        avg: lastAvg,
      };
    } else {
      t.sum += +ones;
      t.weights += +ones;
      t.calculate();
      return {
        ones: ones,
        avg: t.average === NO_DATA ? 0 : t.average,
      };
    }
  }
}


// --------------------------------- TERMINARZ ---------------------------------

// Czy biała czcionka dla danego tła
function isLightFontColorForBackground(bgColor) {
  const color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
  if (color.toLowerCase() === "f00" || color.toLowerCase() === "ff0000") return true;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const uicolors = [r / 255, g / 255, b / 255];
  const c = uicolors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92;
    }
    return Math.pow((col + 0.055) / 1.055, 2.4);
  });
  const l = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
  return (l > 0.179) ? false : true;
}

class CustomScheduleEvent {
  constructor() {
    const [background, color] = document.querySelector('input[name="librusPro_color"]:checked').value.split("|");
    this.lesson = overlay.lesson.value;
    this.time = overlay.time.value;
    this.subject = overlay.subject.value;
    this.type = overlay.type.value;
    this.description = overlay.description.value;
    this.url = overlay.imageUrl.value;
    this.background = background;
    this.color = color;
    this.dateAdded = new Date().toLocaleString();
  }
  updateDate(dateAdded) {
    this.dateAdded = dateAdded;
    this.dateModified = new Date().toLocaleString();
  }
}

class ScheduleOverlay {
  constructor() {
    this.insert();

    // Pola
    this.date = document.getElementById("librusPro_date");
    this.lesson = document.getElementById("librusPro_lesson");
    this.time = document.getElementById("librusPro_time");
    this.subjectSelect = document.getElementById("librusPro_subjectSelect");
    this.subject = document.getElementById("librusPro_subject");
    this.otherSubject = document.getElementById("librusPro_otherSubject");
    this.typeSelect = document.getElementById("librusPro_typeSelect");
    this.type = document.getElementById("librusPro_type");
    this.otherType = document.getElementById("librusPro_otherType");
    this.description = document.getElementById("librusPro_description");
    this.imageUrl = document.getElementById("librusPro_imageUrl");
    this.firstColor = document.getElementById("librusPro_firstColor");
    this.customColorPreview = document.getElementById("librusPro_customColorPreview");
    this.customColor = document.getElementById("librusPro_customColor");
    this.customColorInput = document.getElementById("librusPro_customColorInput");
    this.addCustomEventButton = document.getElementById("librusPro_addCustomEventButton");
    this.editCustomEventButton = document.getElementById("librusPro_editCustomEventButton");
    
    this.addLogic();
  }

  insert() {
    this.overlay = document.createElement("div");
    this.overlay.classList = "librusPro_overlay-body";
    this.overlay.innerHTML = `
    <div class="librusPro_overlay-container">
      <div class="librusPro_header-container">
        <img src="${browserAPI.runtime.getURL('img/icon.png')}" class="librusPro_overlay-logo">
        <div class="librusPro_overlay-header-column">
          <div class="librusPro_overlay-header librusPro_overlay-header-adding librusPro_margin-bottom-9">Dodaj wydarzenie</div>
          <div class="librusPro_overlay-header librusPro_overlay-header-editting librusPro_margin-bottom-9">Edytuj wydarzenie</div>
          <input class="librusPro_overlay-input" id="librusPro_date" type="date">
        </div>
      </div>
      <div class="librusPro_overlay-input-two-label">
        <label class="librusPro_overlay-input-label">
          <div class="librusPro_overlay-input-title">Nr lekcji:</div>
          <input placeholder="3" type="text" id="librusPro_lesson" class="librusPro_overlay-input">
        </label>
        <label class="librusPro_overlay-input-label">
          <div class="librusPro_overlay-input-title">Godzina:</div>
          <input type="time" id="librusPro_time" class="librusPro_overlay-input">
        </label>
      </div>
      <label class="librusPro_overlay-input-label" id="librusPro_subjectLabel">
        <div class="librusPro_overlay-input-title">Przedmiot:</div>
        <select class="librusPro_overlay-input" id="librusPro_subjectSelect">
          <option value="">-- wybierz --</option>
          <option value="Inny">Inny (Jaki?)</option>
        </select>
      </label>
      <label class="librusPro_overlay-input-label" id="librusPro_otherSubject">
        <div class="librusPro_overlay-input-title">Przedmiot:</div>
        <input placeholder="Matematyka" type="text" id="librusPro_subject" class="librusPro_overlay-input">
      </label>
      <label class="librusPro_overlay-input-label">
        <div class="librusPro_overlay-input-title">Typ:</div>
        <select class="librusPro_overlay-input" id="librusPro_typeSelect">
          <option value="">-- wybierz --</option>
          <option value="Sprawdzian">Sprawdzian</option>
          <option value="Kartkówka">Kartkówka</option>
          <option value="Praca domowa">Praca domowa</option>
          <option value="Odpowiedź ustna">Odpowiedź ustna</option>
          <option value="Projekt">Projekt</option>
          <option value="Inny">Inny (Jaki?)</option>
        </select>
      </label>
      <label class="librusPro_overlay-input-label" id="librusPro_otherType">
        <div class="librusPro_overlay-input-title">Typ:</div>
        <input placeholder="Zaliczenie" type="text" id="librusPro_type" class="librusPro_overlay-input">
      </label>
      <label class="librusPro_overlay-input-label">
        <div class="librusPro_overlay-input-title">Opis <span class="librusPro_italic">(HTML dozwolony)</span>:</div>
        <textarea placeholder="Rozdział 2" id="librusPro_description"
          class="librusPro_overlay-input librusPro_overlay-input-textarea" rows="3"></textarea>
      </label>
      <label class="librusPro_overlay-input-label">
        <div class="librusPro_overlay-input-title">URL obrazka/GIFa:</div>
        <input placeholder="https://www.google.com/logo.png" type="text" id="librusPro_imageUrl"
          class="librusPro_overlay-input">
      </label>
      <div class="librusPro_overlay-color-container">
        <label class="librusPro_overlay-color-label">
          <input type="radio" id="librusPro_firstColor" name="librusPro_color" value="#ae3737|#ffffff" checked>
          <span class="librusPro_overlay-color-preview" style="background: #ae3737"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#ff0000|#ffffff">
          <span class="librusPro_overlay-color-preview" style="background: #ff0000"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#ff4d00|#ffffff">
          <span class="librusPro_overlay-color-preview" style="background: #ff4d00"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#ff9529|#ffffff">
          <span class="librusPro_overlay-color-preview" style="background: #ff9529"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#fff700|#333333">
          <span class="librusPro_overlay-color-preview librusPro_overlay-dark-dot" style="background: #fff700"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#a9ff00|#333333">
          <span class="librusPro_overlay-color-preview librusPro_overlay-dark-dot" style="background: #a9ff00"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#007009|#ffffff">
          <span class="librusPro_overlay-color-preview" style="background: #007009"></span>
        </label>

        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#00ffb8|#333333">
          <span class="librusPro_overlay-color-preview librusPro_overlay-dark-dot" style="background: #00ffb8"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#00f3ff|#333333">
          <span class="librusPro_overlay-color-preview librusPro_overlay-dark-dot" style="background: #00f3ff"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#0043bc|#ffffff">
          <span class="librusPro_overlay-color-preview" style="background: #0043bc"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#6200cd|#ffffff">
          <span class="librusPro_overlay-color-preview" style="background: #6200cd"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#ff00d4|#ffffff">
          <span class="librusPro_overlay-color-preview" style="background: #ff00d4"></span>
        </label>
        <label class="librusPro_overlay-color-label">
          <input type="radio" name="librusPro_color" value="#ffffff|#333333">
          <span class="librusPro_overlay-color-preview librusPro_overlay-dark-dot" style="background: #ffffff"></span>
        </label>
        <label class="librusPro_overlay-color-label" for="librusPro_customColorInput">
          <input type="color" id="librusPro_customColorInput" value="#010101">
          <input type="radio" name="librusPro_color" value="#aaaaaa|#333333" id="librusPro_customColor">
          <span class="librusPro_overlay-color-preview "
            style="background: linear-gradient(216deg, #f00 0%, #ff7300 23%, #f9ff00 43%, #00ff73 64%, #0023ff 85%)"
            id="librusPro_customColorPreview"></span>
        </label>
      </div>
      <div class="librusPro_overlay-button-container">
        <button class="librusPro_overlay-button librusPro_overlay-button-add"
          id="librusPro_addCustomEventButton">Dodaj</button>
        <button class="librusPro_overlay-button librusPro_overlay-button-edit"
          id="librusPro_editCustomEventButton">Edytuj</button>
        <button class="librusPro_overlay-button librusPro_overlay-button-close"
          id="librusPro_closeButton">Zamknij</button>
      </div>
      <div class="librusPro_overlay-footer">
        <div class="librusPro_overlay-footer-text">© <span id="librusPro_currentYear"></span></div>
        <a href="${CHROME_LINK}"
          target="_blank" class="librusPro_overlay-footer-link">Zostaw 5<span style="font-size: 11px;">⭐</span></a>
        <a class="librusPro_overlay-footer-link" target="_blank" href="${DISCORD_LINK}">Discord</a>
        <div class="librusPro_overlay-footer-text">v <span id="librusPro_currentVersion"></span></div>
      </div>
    </div>`;
    document.body.appendChild(this.overlay);
    document.getElementById("librusPro_currentYear").innerText = new Date().getFullYear();
    document.getElementById("librusPro_currentVersion").innerText = browserAPI.runtime.getManifest().version;
  }

  addLogic() {
    // Logika overlaya: eventy do przycisków
    this.addCustomEventButton.addEventListener("click", () => {
      if (!this.date.value) {
        alert("Wybierz datę!");
        return;
      }
      CustomSchedule.addCustomEvent(this.date.value);
    });

    this.editCustomEventButton.addEventListener("click", () => {
      if (!this.date.value) {
        alert("Wybierz datę!");
        return;
      }
      CustomSchedule.editCustomEvent();
    });

    document.addEventListener("click", (event) => {
      // Jeśli nie jest przyciskiem dodawania/edycji oraz kliknięte poza overlayem, bądź na przycisk zamknij
      if (!event.target.matches(".librusPro_new-event-button, .librusPro_edit-event-button") 
        && (event.target.matches("#librusPro_closeButton") 
        || !event.target.closest(".librusPro_overlay-container"))) {
          this.overlay.style.display = "none";
          this.overlay.classList.remove("librusPro_overlay-adding");
          this.overlay.classList.remove("librusPro_overlay-editting");
          document.body.classList.remove("librusPro_overlay");
      }
    }, false);

    // Ukrywanie/Pokazywanie inputa dla "Inny" w select
    this.typeInputHidden = true;
    this.subjectInputHidden = true;
    this.customColorInput.addEventListener("change", () => this.updateOverlayColorValue());
    this.subjectSelect.addEventListener("change", () => this.displayInputIfOtherSelected());
    this.typeSelect.addEventListener("change", () => this.displayInputIfOtherSelected());
  }

    // Ukrywanie/Pokazywanie inputa dla "Inny" w select
  displayInputIfOtherSelected() {
    if (!this.noSubjectSelect) {
      if (this.subjectSelect.value === "Inny" && this.subjectInputHidden) {
        this.otherSubject.style.display = "block";
        this.subject.value = "";
        this.subjectInputHidden = false;
      } else if (this.subjectSelect.value !== "Inny") {
        if (!this.subjectInputHidden) {
          this.otherSubject.style.display = "none";
          this.subjectInputHidden = true;
        }
        this.subject.value = this.subjectSelect.value;
      }
    }

    if (this.typeSelect.value === "Inny" && this.typeInputHidden) {
      this.otherType.style.display = "block";
      this.type.value = "";
      this.typeInputHidden = false;
    } else if (this.typeSelect.value !== "Inny") {
      if (!this.typeInputHidden) {
        this.otherType.style.display = "none";
        this.typeInputHidden = true;
      }
      this.type.value = this.typeSelect.value;
    }
  }

  // Logika wybierania dowolnego koloru
  updateOverlayColorValue() {
    const color = this.customColorInput.value;
    this.customColorPreview.style.background = color;
    let useLight = isLightFontColorForBackground(color);
    if (useLight) {
      this.customColorPreview.classList.remove("librusPro_overlay-dark-dot");
      this.customColor.value = color + "|#ffffff";
    } else {
      this.customColorPreview.classList.add("librusPro_overlay-dark-dot");
      this.customColor.value = color + "|#222222";
    }
    this.customColor.checked = true;
  }

  // Otwieranie overlaya i jego reset
  openForAdding(date) {
    document.body.classList.add("librusPro_overlay");
    this.overlay.classList.add("librusPro_overlay-adding");
    this.date.value = date;
    this.lesson.value = "";
    this.time.value = "";
    this.subjectSelect.value = "";
    this.subject.value = "";
    this.typeSelect.value = "";
    this.type.value = "";
    this.description.value = "";
    this.imageUrl.value = "";
    this.firstColor.checked = "true";
    this.customColor.value = "#aaaaaa|#ffffff";
    this.customColorInput.value = "#010101";
    this.customColorPreview.style.background = "linear-gradient(225deg, #f00 0%, #ff7300 23%, #f9ff00 43%, #00ff73 64%, #0023ff 85%)";
    this.displayInputIfOtherSelected();

    this.overlay.style.display = "block";
  }

  // Otwieranie overlaya, ustawianie na wartości wydarzenia
  openForEditting(date, event, index) {
    this.edittingIndex = index;
    this.edittingDate = date;
    this.edittingDateAdded = event.dateAdded;
    document.body.classList.add("librusPro_overlay");
    this.overlay.classList.add("librusPro_overlay-editting");
    this.date.value = date;
    this.lesson.value = event?.lesson;
    this.time.value = event?.time;
    this.subjectSelect.value = "Inny";
    for (let option of this.subjectSelect.options) {
      if (option.value === event?.subject) {
        this.subjectSelect.value = event?.subject;
        this.subjectInputHidden = false;
      }
    }
    this.typeSelect.value = "Inny";
    for (let option of this.typeSelect.options) {
      if (option.value === event?.type) {
        this.typeSelect.value = event?.type;
        this.typeInputHidden = false;
      }
    }
    this.displayInputIfOtherSelected();
    this.subject.value = event?.subject;
    this.type.value = event?.type;
    this.description.value = event?.description;
    this.imageUrl.value = event?.url;

    const color = event.background + "|" + event.color;
    const colorInput = document.querySelector(`input[value="${color}"]`);
    if (colorInput) {
      colorInput.checked = true;
    } else {
      this.customColor.checked = true;
      this.customColor.value = color;
      this.customColorInput.value = event.background;
      this.customColorPreview.style.background = event.background;
      this.customColorPreview.style.color = event.color;
      this.updateOverlayColorValue();
    }

    this.overlay.style.display = "block";
  }

  // Dodanie przedmiotów do listy wybierania przy tworzeniu wydarzeń
  insertSubjects(subjects) {
    if (subjects.size > 0) {
      [...subjects].sort().forEach((e) => {
        const o = document.createElement("OPTION");
        o.value = e;
        o.innerText = e;
        this.subjectSelect.insertBefore(o, this.subjectSelect.lastElementChild);
      })
    } else {
      this.noSubjectSelect = true;
      this.subjectSelect.parentElement.style.display = "none";
      this.otherSubject.style.display = "block";
    }
  }
}

// Terminarz
class CustomSchedule {
  constructor(options, studentClass) {
    this.options = options;
    this.studentClass = studentClass;
    this.month = document.getElementsByName("miesiac")[0].value;
    this.year = document.getElementsByName("rok")[0].value;

    const daysIds = document.getElementsByClassName("kalendarz-numer-dnia");

    // Przyciemnianie przeszłych wydarzeń
    let setOpacity = false;
    const now = new Date();
    if (this.year < now.getFullYear()) {
      setOpacity = true;
    }
    else if ((this.month - 1) <= now.getMonth() && this.year == now.getFullYear()) {
      setOpacity = true;
    }

    // Wersja depresyjna terminarza
    if (this.options.depressionMode) {
      document.querySelector(".kalendarz").classList.add("librusPro_depression-mode");
    }

    // Modernizacja terminarza
    if (this.options.modernizeSchedule) {
      document.querySelector(".kalendarz").classList.add("librusPro_modernized-schedule");
    }

    // Plan lekcji do overlaya oraz kafelków
    if (this.options.insertTimetable) {
      this.insertTimetable(daysIds);
    }

    // [+] template
    const newEventButton = document.createElement("a");
    newEventButton.innerText = "[+]";
    newEventButton.title = "<article class='librusPro_timetable-header'>LibrusPro <span class='librusPro_white'>|</span> <span class='librusPro_lightblue'>Dodaj nowe wydarzenie</span></article>";
    newEventButton.classList.add("librusPro_new-event-button", "librusPro_jqueryTitle");

    for (const dayId of daysIds) {
      const events = dayId.parentElement.querySelectorAll("td");
      events.forEach((event) => {
        // Ukrywanie nieobecności nauczycieli
        if (!this.options.showTeacherFreeDays && event.innerText.includes("Nieobecność:")) {
          event.remove();
          return;
        }

        // Zaciemnianie dni wolnych
        if (this.options.darkTheme && event.outerHTML.indexOf(`onclick="location.href='/terminarz/szczegoly_wolne/`) > -1 && !event.innerText.includes("Nieobecność:")) {
          dayId.parentElement.parentElement.classList.add("weekend");
        }

        // Modernizacja i dodawanie opisów
        this.adjustEventContent(event);

        // Modernizacja dymków
        if (this.options.modernizeTitles) modernizeTitle(event);
      });

      // Klucz
      const date = getYYYYMMDD(this.year, this.month, dayId.innerText);

      // [+]
      const _newEventButton = dayId.parentElement.insertBefore(newEventButton.cloneNode(true), dayId);
      _newEventButton.addEventListener("click", () => {
        CustomSchedule.openOverlayForAdding(date);
      });

      // Zaciemnianie przeszłych dni
      if (dayId.parentElement.parentElement.classList.contains("today")) {
        setOpacity = false;
      }
      if (setOpacity) {
        dayId.parentElement.classList.add("librusPro_past");
      }

      this.displayEvents(dayId, date);
    }
  }

  static openOverlayForAdding(date) {
    overlay.openForAdding(date);
  }

  static openOverlayForEditting(date, index) {
    browserAPI.storage.sync.get([date], (data) => {
      const event = data[date][index];
      overlay.openForEditting(date, event, index);
    });
  }

  static addCustomEvent(date, dateAdded = null) {
    browserAPI.storage.sync.get(date, (data) => {
      let events = data[date];
      const event = new CustomScheduleEvent();
      if (dateAdded) {
        event.updateDate(dateAdded);
      }
      if (!events) {
        browserAPI.storage.sync.set({ [date]: [event] });
      } else {
        events.push(event);
        browserAPI.storage.sync.set({ [date]: events });
      }
    });
    
  }

  static removeCustomEvent(date, index) {
    browserAPI.storage.sync.get([date], (data) => {
      if (data[date].length <= 1) {
        browserAPI.storage.sync.remove([date]);
      } else {
        data[date].splice(index, 1);
        browserAPI.storage.sync.set({ [date]: data[date] });
      }
  });
  }

  static editCustomEvent() {
    const event = new CustomScheduleEvent();
    event.updateDate(overlay.edittingDateAdded);
    const date = overlay.date.value;

    // Jeśli wydarzenie nie zostało przeniesione
    if (date === overlay.edittingDate) {
      browserAPI.storage.sync.get([date], (data) => {
        data[date][overlay.edittingIndex] = event;
        browserAPI.storage.sync.set({ [date]: data[date] });
      });
    } else {
      CustomSchedule.addCustomEvent(date, overlay.edittingDateAdded);
      CustomSchedule.removeCustomEvent(overlay.edittingDate, overlay.edittingIndex);
    }
  }

  displayEvents(day, date) {
    browserAPI.storage.sync.get(date, (data) => {
      const events = data[date];
      if (!events) return;

      const table = document.createElement("table");
      table.classList.add("librusPro_events-table");

      // Nazwa do title
      const uczen = document.querySelector("#user-section > b").innerText.split("(")[0];

      // ✎ template
      const editEventButton = document.createElement("a");
      editEventButton.innerText = ADD_EDIT_SYMBOL;
      editEventButton.classList += "librusPro_edit-event-button";

      // ⨉ template
      const removeEventButton = document.createElement("a");
      removeEventButton.innerText = REMOVE_SYMBOL;
      removeEventButton.classList += "librusPro_remove-event-button";

      for (let i = 0; i < events.length; i++) {
        let event = events[i];
        const row = table.insertRow();
        const eventEl = document.createElement("td");
        row.appendChild(eventEl);
        eventEl.style.background = event.background;
        eventEl.style.color = event.color;
        eventEl.classList.add("no-border-left", "no-border-right", "librusPro_custom-event", "librusPro_jqueryTitle");

        eventEl.title = "Uczeń: " + uczen + "<br />";

        let temp = [];
        // Nr lekcji
        if (event.lesson) {
          if (event.lesson.length > TYPE_SUBJECT_LENGTH) {
            temp.push(`Nr lekcji: ${event.lesson.slice(0, TYPE_SUBJECT_LENGTH)} [...]`);
          } else {
            temp.push(`Nr lekcji: ${event.lesson}`);
          }
        }

        // Godzina
        if (event.time) {
          temp.push(`Godz: ${event.time}`);
        }

        if (this.options.modernizeSchedule) {
          eventEl.innerText = temp.join("\n");

          // Przedmiot
          if (event.subject) {
            const s = document.createElement("ARTICLE");
            if (event.subject.length > TYPE_SUBJECT_LENGTH) {
              s.innerText = event.subject.slice(0, TYPE_SUBJECT_LENGTH) + ' [...]';
            } else {
              s.innerText = event.subject;
            }
            s.classList.add("librusPro_event-subject");
            eventEl.appendChild(s);
          }

          // Typ
          if (event.type) {
            const s = document.createElement("ARTICLE");
            if (event.type.length > TYPE_SUBJECT_LENGTH) {
              s.innerText = event.type.slice(0, TYPE_SUBJECT_LENGTH) + '[...]';
            } else {
              s.innerText = event.type;
            }
            s.classList.add("librusPro_event-type");
            eventEl.appendChild(s);
          }

          // Klasa
          if (((!eventEl.innerText && (!event.description || !this.options.addDescriptions)) && !event.url) || !this.options.removeClasses) {
            const s = document.createElement("ARTICLE");
            s.innerText = this.studentClass ?? NO_DATA;
            eventEl.appendChild(s);
          }

          // Opis
          if (event.description && this.options.addDescriptions) {
            const s = document.createElement("ARTICLE");
            if (event.description.length > DESCRIPTION_LENGTH) {
              s.innerHTML = `Opis: ${event.description.replaceAll("\n", "<br />").slice(0, DESCRIPTION_LENGTH)}\n[...]`;
            } else {
              s.innerHTML = `Opis: ${event.description.replaceAll("\n", "<br />")}`;
            }
            eventEl.appendChild(s);
          }
        } else {
          // Przedmiot
          if (event.subject) {
            if (event.subject.length > TYPE_SUBJECT_LENGTH) {
              temp.push(`${event.subject.slice(0, TYPE_SUBJECT_LENGTH)} [...]`);
            } else {
              temp.push(`${event.subject}`);
            }

            if (event.type) {
              temp[temp.length - 1] += ", ";
            }
          }

          // Typ
          if (event.type) {
            if (event.type.length > TYPE_SUBJECT_LENGTH) {
              if (!event.subject) {
                temp.push(`${event.type.slice(0, TYPE_SUBJECT_LENGTH)} [...]`);
              } else {
                temp[temp.length - 1] += `${event.type.slice(0, TYPE_SUBJECT_LENGTH)} [...]`;
              }
            } else {
              if (!event.subject) {
                temp.push(`${event.type}`);
              } else {
                temp[temp.length - 1] += `${event.type}`;
              }
            }
          }

          // Klasa
          if ((temp.length === 0 && !event.description) || !this.options.removeClasses) {
            temp.push(this.studentClass ?? NO_DATA);
          }

          // Opis
          if (event.description && this.options.addDescriptions) {
            if (event.description.length > DESCRIPTION_LENGTH) {
                temp.push(`Opis: ${event.description.replaceAll("<br />", "\n").slice(0, DESCRIPTION_LENGTH)}` + "\n[...]");
            } else {
                temp.push(`Opis: ${event.description.replaceAll("<br />", "\n")}`);
            }
          }
          eventEl.innerText = temp.join("\n");
        }

        if (event.url) {
          const image = document.createElement("IMG");
          image.src = event.url;
          image.classList.add("librusPro_event-image");
          eventEl.appendChild(image);
        }

        if (event.description) eventEl.title += "Opis: " + event.description + "<br />";
        eventEl.title += "Data dodania: " + event.dateAdded;
        if (event.dateModified) eventEl.title += "<br />Data ostatniej modyfikacji: " + event.dateModified;

        if (this.options.modernizeTitles) modernizeTitle(eventEl);

        // ✎
        const _editEventButton = eventEl.appendChild(editEventButton.cloneNode(true));
        _editEventButton.addEventListener("click", () => {
          CustomSchedule.openOverlayForEditting(date, i);
        });

        // ⨉
        const _removeEventButton = eventEl.appendChild(removeEventButton.cloneNode(true));
        _removeEventButton.addEventListener("click", () => {
          CustomSchedule.removeCustomEvent(date, i);
        });

        day.parentElement.appendChild(table);
      }
      refreshjQueryTitles();
    });
  }

  adjustEventContent(event) {
    // Ukrywanie klasy
    if (this.options.removeClasses) {
      [...event.childNodes].forEach((e) => {
        if (e.nodeValue?.match(REGEXS.class)) {
          e.previousSibling?.remove();
          e.remove();
        }
      });
    }

    // Modernizacja
    if (this.options.modernizeSchedule) {
      // Typ (np. sprawdzian)
      [...event.childNodes].forEach((e) => {
        if (e.nodeValue?.[0] === ",") {
          let el;
          if (event.querySelector(`${ONLINE_LESSON}:last-child`)) {
            el = document.createElement("SPAN");
            el.style.textDecoration = "underline";
            el.style.fontSize = "13px";
            el.innerText = "\n" + e.nodeValue.slice(2);
          } else {
            if (e.nextSibling?.nodeName === "BR") e.nextSibling.remove();
            el = document.createElement("ARTICLE");
            el.innerText = e.nodeValue.slice(2);
            el.classList.add("librusPro_event-type");
          }
          e.after(el);
          e.remove();
        }
      });

      // Odwołania
      const cancelled_res = event.innerText.match(REGEXS.cancelled);
      if (event.innerText && cancelled_res) {
        event.innerText = "Odwołane zajęcia na lekcji nr: " + cancelled_res[2];
        const el = document.createElement("ARTICLE");
        el.classList.add("librusPro_event-subject");
        el.innerText = cancelled_res[3];
        event.appendChild(el);
      }

      // Zastępstwa/przesunięcia
      const substitution_res = event.innerText.match(REGEXS.substitution);
      if (event.innerText && substitution_res) {
        event.innerText = substitution_res[1] + " na lekcji nr: " + substitution_res[3];
        const el = document.createElement("ARTICLE");
        el.classList.add("librusPro_event-subject");
        el.innerText = substitution_res[4];
        event.appendChild(el);
        const el2 = document.createElement("ARTICLE");
        el2.innerText = `(${substitution_res[2]})`;
        // Tryb incognito, do screenów
        // el2.innerText = `(${randomName()})`;
        el2.classList.add("librusPro_event-teacher");
        event.appendChild(el2);
      }

      // Odchudzenie nieobecności nauczycieli
      if (event.innerText.includes("\nNauczyciel:")) {
        event.innerText = event.innerText.replace("\nNauczyciel:", "");
        // Tryb incognito, do screenshotów
        // event.innerText = event.innerText.replace(/\nNauczyciel:.*/, " " + randomName());
      }

      // Usuwanie linków ze starych lekcji online
      document.querySelectorAll(`.librusPro_past ${ONLINE_LESSON}`).forEach((e) => {
        e.remove();
      });
    }

    // Dodawanie opisów z title na wierzch, ucięcie zbyt długich
    if (this.options.addDescriptions) {
      let desc_res = event.title.match(REGEXS.description);
      if (desc_res) {
        let desc = ("Opis: " + desc_res[1]).replaceAll("<br />", "\n").replaceAll("<br>", "\n");
        if (desc.length > 200) {
          desc = desc.slice(0, 200) + "\n[...]";
        }
        const l = event.querySelector(`${ONLINE_LESSON}:last-child`);
        if (l) {
          const el = document.createElement("SPAN");
          el.innerText = "\n" + desc;
          event.insertBefore(el, l);
        } else {
          const el = document.createElement("ARTICLE");
          el.innerText = desc;
          event.appendChild(el);
        }
      }
    }
  }

  static getTimetableEntry(lesson, entry) {
    let text = [`<b class="librusPro_timetable-lessonNo">${lesson}.</b>`];
    if (!entry) {
      text.push("-");
    } else {
      text.push(`<span class="librusPro_timetable-time">${entry["HourFrom"]}-${entry["HourTo"]}</span>`);
      text.push(`<span class="${entry["IsCanceled"] ? ' librusPro_timetable-cancelled' : ''} ${entry["IsSubstitutionClass"] ? ' librusPro_timetable-info' : ''}">${entry["Subject"]["Name"]}</span>`);
      if (entry["VirtualClassName"]) {
        text.push(`<span class="librusPro_timetable-class">${entry["VirtualClassName"]}</span>`);
      }
      if (entry["IsCanceled"]) {
        text.push(`<span class="librusPro_timetable-info">Odwołane</span>`);
      }
      if (entry["IsSubstitutionClass"]) {
        text.push(`<span class="librusPro_timetable-teacher">(${entry["Teacher"]["FirstName"]} ${entry["Teacher"]["LastName"]})</span>`);
      }
      // TODO: idk z przesunięciami
    }

    return "<article>" + text.join(" ") + "</article>";
  }

  // TODO: idk jeśli nie udostępniony
  insertTimetable(days, requestedTimetable) {
    browserAPI.storage.local.get(["timetable"], (data) => {
      let timetable = data["timetable"];
      if (!timetable) {
        browserAPI.runtime.sendMessage({msg: 'fetchTimetable'}, () => { this.insertTimetable(days) });
        return;
      }

      if (requestedTimetable) {
        timetable = requestedTimetable;
      }

      const subjects = new Set();
      for (let day of days) {
        const timetableElement = document.createElement("ARTICLE");
        timetableElement.innerText = TIMETABLE_SYMBOL;
        timetableElement.classList.add("librusPro_lesson-plan", "librusPro_jqueryTitle");

        if (requestedTimetable === null) {
          timetableElement.title = '<article class="librusPro_timetable-header">LibrusPro <span class="librusPro_white">|</span> <span class="librusPro_error">Wystąpił błąd!</span></article><article>Skontaktuj się z developerem!</article>';
          day.after(timetableElement);
          continue;
        }

        const date = getYYYYMMDD(this.year, this.month, day.innerText);

        let dayTimetable = timetable[date];
        if (!dayTimetable) {
          let d = new Date(date);
          let day = d.getDay(),
          diff = d.getDate() - day + (day == 0 ? -6:1); // niedziela
          d.setDate(diff);
          const key = getYYYYMMDD(d.getFullYear(), d.getMonth() + 1, d.getDate());
          browserAPI.runtime.sendMessage({msg: 'fetchTimetable', data: key},
            (_requestedTimetable) => { this.insertTimetable(days, _requestedTimetable) });
          return;
        }

        let lastLesson = 0;
        for (let lesson in dayTimetable) {
          let entry = dayTimetable[lesson]?.[0];
          if (entry) lastLesson = lesson;
        }
        const timetableText = [];
        for (let lesson in dayTimetable) {
          let entry = dayTimetable[lesson]?.[0];
          // Jeśli okienko i nie zerowa
          if (!entry && lesson !== "0" && +lesson < lastLesson) {
            timetableText.push(CustomSchedule.getTimetableEntry(lesson));
          } else if (entry) {
            timetableText.push(CustomSchedule.getTimetableEntry(lesson, entry));
            subjects.add(entry["Subject"]["Name"]);
          }
        }
        if (timetableText.length <= 0) continue;

        timetableElement.title = '<article class="librusPro_timetable-header">LibrusPro <span class="librusPro_white">|</span> <span class="librusPro_lightblue">Plan lekcji:</span></article>' + timetableText.join("");
        day.after(timetableElement);
      }

      refreshjQueryTitles();
      overlay.insertSubjects(subjects);
    });
  }
}

// Do screenów, tryb incognito
function randomName() {
  let x = ["Adam Zając", "Paweł Kowalski", "Jan Krzysztof Duda", "Zenek Martyniuk", "Barbara Nowak", "Maria Lewandowska", "Szymon Wójcik", "Krystyna Woźniak"];
  return x[Math.floor(Math.random() * x.length)];
}

// Tu się dzieje cała magia
function main() {
  setTimeout(otherAddons, 500);
  setTimeout(otherAddons, 2000);
  setTimeout(otherAddons, 5000);

  if (window.location.href.indexOf(URLS.newVersion) > -1) {
    alert("[LibrusPro] » Rozszerzenie nie jest przeznaczone do widoku alternatywnego systemu Librus Synergia, który nie jest i nie będzie wspierany. Po zamknięciu tego komunikatu powrócisz do widoku standardowego. Jeżeli jednak chcesz skorzystać z nowszej wersji dziennika, wyłącz na ten czas rozszerzenie LibrusPro.");
    window.location.replace(URLS.schedule);
    return;
  }

  registerOnStorageChange(window.location.href.indexOf(URLS.schedule) > -1);
  injectjQueryHook();

  // Co to po komu ta strona startowa?
  if (URLS.index.some((e) => window.location.href.indexOf(e) > -1)) {
    // Przekierowanie i aktualizacja danych
    browserAPI.runtime.sendMessage({msg: 'fetchAll'});
    document.location.replace(URLS.grades);
    return;
  }

  getGradeColumns();

  // Nie wymagające opcji
  printCreditsToConsole();
  adjustHeader();
  adjustNavbar();
  insertFooter();
  disableAutoLogout();

  // Świąteczny banner (połowa grudnia -> połowa stycznia)
  let isChristmas = new Date();
  if ((isChristmas.getMonth() === 11 && isChristmas.getDate() >= 14) || (isChristmas.getMonth() === 0 && isChristmas.getDate() <= 14)) christmasBanner();

  // Oceny
  if (window.location.href.indexOf(URLS.grades) > -1) {
    collapseBehavior();

    if (!gradesSinceLastLoginView) {
      insertProposedBehavior();
    }
  }

  // Prace domowe
  if (window.location.href.indexOf(URLS.homework) > -1) {
    adjustHomeworks();
  }

  /*// Szczegóły oceny
  if (window.location.href.indexOf(URLS.gradeDetails) > -1) {
    initCommentsInProximity();
  }*/

  // Frekwencja
  if (window.location.href.indexOf(URLS.attendance) > -1) {
    insertAttendanceStatistics();
  }

  // Uwagi
  if (window.location.href.indexOf(URLS.notes) > -1) {
    insertNote();
  }

  // Pobranie opcji i danych
  browserAPI.storage.sync.get(["student", "options", "aprilfools"], (data) => {
    let options = data["options"];
    let student = data["student"];

    if (!data["aprilfools"]) {
      const d = new Date();
      if (d.getMonth() === 3 && d.getDate() === 1) aprilfools();
    }

    if (!options) {
      browserAPI.storage.sync.set({ ["options"]: OPTIONS_DEFAULT });
      return;
    } else {
      for (let p in OPTIONS_DEFAULT) {
        if (!options.hasOwnProperty(p)) {
          let t = OPTIONS_DEFAULT;
          for (let u in options) {
            t[u] = options[u];
          }
          browserAPI.storage.sync.set({ ["options"]: t });
          return;
        }
      }
    }

    // Oceny
    if (window.location.href.indexOf(URLS.grades) > -1) {
      // Tymczasowa modyfikacja ocen
      if (options.enableGradeManager && options.calculateAverages) {
        const gradeManagerParent = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > div.container-icon > table > tbody > tr > td:nth-child(2) > p")?.parentElement;
        if (gradeManagerParent) {
          gradeManager = new GradeManager(gradeManagerParent, options);
        }
      }

      // Ukrywanie jedynek
      if (options.hideOnes) hideOnes();

      // Wyłączenie mrugania zagrożeń
      if (!options.keepBlinker) removeBlinker();

      // Ukrywanie przedmiotów bez ocen
      if (options.hideSubjects) hideSubjects();

      // Wstawianie średnich i dostosowanie kolorów w wersji depresyjnej
      handleGrades(options);

      // Ukrywanie ocen i średnich z I semestru
      if (options.hideFirstTerm) hideFirstTermGrades();
    }

    // Frekwencja
    if (window.location.href.indexOf(URLS.attendance) > -1) {
      // Modernizacja dymków
      if (options.modernizeTitles) document.querySelectorAll(".box > .ocena").forEach(e => modernizeTitle(e));

      // Ukrywanie frekwencji z I semestru
      if (options.hideFirstTerm) hideFirstTermAbsence();
    }

    // Zrealizowane lekcje
    if (window.location.href.indexOf(URLS.lessons) > -1) {
      if (options.modernizeTitles) document.querySelectorAll(".box > .ocena").forEach(e => modernizeTitle(e));
    }

    // Ciemny motyw
    if (options.darkTheme) {
      finalizeDarkTheme();
    }

    // Numerek z dziennika
    if (student && student.number !== null && student.class !== null) {
      displayStudentNumber(student);
    } else {
      browserAPI.runtime.sendMessage({msg: 'fetchStudentInfo'}, displayStudentNumber);
    }

    // Terminarz
    if (window.location.href.indexOf(URLS.schedule) > -1 && window.location.href.indexOf(URLS.scheduleDetails) < 0) {
      overlay = new ScheduleOverlay();
      const schedule = new CustomSchedule(options, student?.class ?? "[klasa]");
    }

    // Debug
    if (options.debug) {
      console.log("[LibrusPro] » Debugging enabled.");
      browserAPI.storage.sync.get(null, function (result) {
        console.log("[LibrusPro] » Chrome storage sync data:", result);
        // console.log("[LibrusPro] » Chrome storage data:", JSON.stringify(result));
      });
      browserAPI.storage.local.get(null, function (result) {
        console.log("[LibrusPro] » Chrome storage local data:", result);
      });
    }

    refreshjQueryTitles();
  });
  refreshjQueryTitles();
}

// Niech się dzieje wola nieba, 
// z nią się zawsze zgadzać trzeba.
main();

// To już jest koniec, nie ma już nic.