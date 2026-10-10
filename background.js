// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

// Config
const API = "https://synergia.librus.pl/gateway/api/2.0";
const TIMETABLE_API_URL = `${API}/Timetables?weekStart=`;
const REFRESH_URL = `https://synergia.librus.pl/refreshToken`;
const SYNERGIA_URL = "https://synergia.librus.pl/";
const CHANGELOG_URL = "changelog.html";
const DARKTHEME_CSS = "darkTheme.css";
const DEFAULT_TIMETABLE_WEEK_RANGE = 10;
const ADDITIONAL_TIMETABLE_WEEK_RANGE = 5;
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
  incognitoMode: false,
  hideGrades: false,
});

// Kompatybilność
const browserAPI = typeof chrome !== "undefined" ? chrome : browser;

// Ogranicznik równoległych zapytań, żeby nie zasypywać serwera Librusa
const MAX_PARALLEL_REQUESTS = 4;
let activeRequests = 0;
const requestQueue = [];

async function apiFetch(url) {
  if (activeRequests < MAX_PARALLEL_REQUESTS) activeRequests++;
  // Miejsce zostanie przekazane przez kończące się zapytanie
  else await new Promise(resolve => requestQueue.push(resolve));

  try {
    const response = await fetch(url);
    return await response.json();
  } finally {
    const next = requestQueue.shift();
    if (next) next();
    else activeRequests--;
  }
}

async function getOptions() {
  const data = await browserAPI.storage.sync.get(["options"]);
  return { ...OPTIONS_DEFAULT, ...data["options"] };
}

// Ciemny motyw jako content script od document_start - bez białego mignięcia przy ładowaniu strony
const DARK_THEME_SCRIPT_ID = "librusPro_darkTheme";

// Zwraca true, jeśli motyw został właśnie zarejestrowany
async function syncDarkTheme(enabled) {
  const registered = await browserAPI.scripting.getRegisteredContentScripts({ ids: [DARK_THEME_SCRIPT_ID] });
  if (enabled && registered.length === 0) {
    await browserAPI.scripting.registerContentScripts([{
      id: DARK_THEME_SCRIPT_ID,
      matches: [`${SYNERGIA_URL}*`],
      css: [DARKTHEME_CSS],
      runAt: "document_start",
    }]);
    return true;
  }
  if (!enabled && registered.length > 0) {
    await browserAPI.scripting.unregisterContentScripts({ ids: [DARK_THEME_SCRIPT_ID] });
  }
  return false;
}

getOptions().then(options => syncDarkTheme(options.darkTheme)).catch(console.error);

browserAPI.storage.onChanged.addListener((changes, namespace) => {
  if (changes["options"] !== undefined) {
    const darkTheme = changes.options.newValue?.darkTheme ?? OPTIONS_DEFAULT.darkTheme;
    syncDarkTheme(darkTheme).catch(console.error);
  }
});

// Zabezpieczenie na wypadek, gdyby rejestracja nie przetrwała restartu przeglądarki
browserAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading" || !tab.url?.startsWith(SYNERGIA_URL)) return;

  try {
    const options = await getOptions();
    if (await syncDarkTheme(options.darkTheme)) {
      await browserAPI.scripting.insertCSS({
        target: { tabId },
        files: [ DARKTHEME_CSS ],
      });
    }
  } catch (err) {
    console.error(`Failed to insert CSS: ${err}`);
  }
});


// Otwieranie changelogu po aktualizacji
/*browserAPI.runtime.onInstalled.addListener((data) => {
  if (data.reason === browserAPI.runtime.OnInstalledReason.INSTALL) {
    // chrome.tabs.create({
    //   url: 'welcome.html'
    // });
  } else if (data.reason === browserAPI.runtime.OnInstalledReason.UPDATE) {
    // Nie pokazywać changeloga jeśli tylko różnią się patchem aka 3.0.0 -> 3.0.1
    const currentVersion = chrome.runtime.getManifest().version.match(/(.*)\.\d+/)[1];
    const previousVersion = data.previousVersion.match(/(.*)\.\d+/)[1];
    if (currentVersion === previousVersion) return;

    browserAPI.tabs.create({
      url: CHANGELOG_URL
    });
    // Pre 3.0
    browserAPI.storage.sync.remove(["dane"]);
    browserAPI.storage.sync.remove(["plan"]);
  }
});*/

async function fetchFromApi(endpoint, func) {
  try {
    // "Attendances/Types" => "Types"
    const data = (await apiFetch(`${API}/${endpoint}`))[endpoint.split("/").at(-1)];
    let result = {};
    for (let e of data) {
      func(result, e);
    }
    return result;
  } catch (error) {
    console.error(error);
  }

  return null;
}

// Pobieranie klasy oraz numerka z dziennika
// Wywoływane po każdym zalogowaniu (np. mogła wystąpić zmiana konta na inne dziecko) oraz gdy nie ma zapisanych w storage
async function fetchStudentInfo(refresh = true) {
  try {
    if (refresh) await fetch(REFRESH_URL);

    const me = (await apiFetch(`${API}/Me`))["Me"];
    const userID = me["Account"]["UserId"];
    const classID = me["Class"]["Id"];

    const [classData, userData] = await Promise.all([
      apiFetch(`${API}/Classes/${classID}`),
      apiFetch(`${API}/Users/${userID}`),
    ]);
    const { Number: classNumber, Symbol: classSymbol, Unit: { Id: unitID } } = classData["Class"];
    const studentNumber = userData["User"]["ClassRegisterNumber"];

    const schoolInitials = (await apiFetch(`${API}/Units/${unitID}`))["Unit"]["ShortName"];

    let studentClass = `${classNumber}${classSymbol} ${schoolInitials}`;

    let studentInfo = {
      number: studentNumber,
      class: studentClass,
    };

    browserAPI.storage.sync.set({
      ["student"]: studentInfo
    });

    return studentInfo;
  } catch (error) {
    console.error(error);
  }

  return {
    number: null,
    class: null,
  }
}

// "https://.../Timetables?weekStart=2024-09-16" => "2024-09-16"
function getWeekStart(pageUrl) {
  return pageUrl.split("=")[1];
}

// Przesunięcie daty YYYY-MM-DD o podaną liczbę tygodni (w UTC, żeby zmiana czasu nie przesuwała dni)
function shiftWeek(weekStart, weeks) {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 7 * weeks);
  return date.toISOString().slice(0, 10);
}

async function fetchWeekTimetable(weekStart) {
  try {
    return (await apiFetch(`${TIMETABLE_API_URL}${weekStart}`))["Timetable"];
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Stara metoda: kolejny tydzień brany z odpowiedzi API (wolniejsza, tydzień po tygodniu)
async function fetchMultipleTimetablesSequentially(weekStart, prevOrNext, timetableWeeks) {
  let timetables = {};
  let week = weekStart;
  for (let i = 0; i < timetableWeeks; i++) {
    const data = await apiFetch(`${TIMETABLE_API_URL}${week}`);
    timetables = {...timetables, ...data["Timetable"]};
    week = getWeekStart(data["Pages"][prevOrNext]);
  }
  return timetables;
}

// x tygodni do przodu/tyłu, równolegle
async function fetchMultipleTimetables(weekStart, prevOrNext, timetableWeeks) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return fetchMultipleTimetablesSequentially(weekStart, prevOrNext, timetableWeeks);
  }

  const direction = prevOrNext === "Prev" ? -1 : 1;
  const weeks = Array.from({ length: timetableWeeks }, (_, i) => shiftWeek(weekStart, direction * i));
  const timetables = await Promise.all(weeks.map(fetchWeekTimetable));
  return Object.assign({}, ...timetables);
}

async function fetchTimetable(weekStart, refresh = true) {
  let url = `${API}/Timetables`;
  let timetableWeeks = DEFAULT_TIMETABLE_WEEK_RANGE;
  if (weekStart) {
    url = `${TIMETABLE_API_URL}${weekStart}`;
    timetableWeeks = ADDITIONAL_TIMETABLE_WEEK_RANGE;
  }

  try {
    if (refresh) await fetch(REFRESH_URL);
    const data = await apiFetch(url);
    const currentTimetable = data["Timetable"];

    if (!currentTimetable) {
      console.log(`Brak planu na tydzień (${weekStart ?? "aktualny"})!`);
      return null;
    }

    let [prevTimetables, nextTimetables] = await Promise.all([
      fetchMultipleTimetables(getWeekStart(data["Pages"]["Prev"]), 'Prev', timetableWeeks),
      fetchMultipleTimetables(getWeekStart(data["Pages"]["Next"]), 'Next', timetableWeeks)
    ]);
    let timetables = {...prevTimetables, ...currentTimetable, ...nextTimetables};

    // Jeśli aktualny plan, zapisujemy go
    if (!weekStart)
      browserAPI.storage.local.set({ ["timetable"]: timetables });

    return timetables;
  } catch (error) {
    console.error(error);
  }

  return null;
}

async function fetchConstants(refresh = true) {
  try {
    if (refresh) await fetch(REFRESH_URL);

    const [users, subjects, lessons, colors, gradeTypes, gradeCategories, attendanceTypes] = await Promise.all([
      // Nauczyciele
      fetchFromApi("Users", (r, e) => { r[e["Id"]] = `${e["LastName"]} ${e["FirstName"]}` }),
      // Nazwy przedmiotów
      fetchFromApi("Subjects", (r, e) => { r[e["Id"]] = e["Name"] }),
      // Przedmioty
      fetchFromApi("Lessons", (r, e) => {
        r[e["Id"]] = {
          t: e["Teacher"]["Id"],
          s: e["Subject"]["Id"],
        }
      }),
      // Kolory
      fetchFromApi("Colors", (r, e) => { r[e["Id"]] = `#${e["RGB"]}` }),
      // Typy ocen (1,1+,...)
      fetchFromApi("Grades/Types", (r, e) => { r[e["Name"]] = e["Value"] }),
      // Kategorie ocen
      fetchFromApi("Grades/Categories", (r, e) => {
        r[e["Id"]] = {
          name: e["Name"],
          color: e["Color"]["Id"],
          weight: e["Weight"],
          count: e["CountToTheAverage"],
        }
      }),
      // Kategorie frekwencji (kolor uzupełniany niżej, gdy już są pobrane kolory)
      fetchFromApi("Attendances/Types", (r, e) => {
        r[e["Id"]] = {
          n: e["Name"],
          s: e["Short"],
          c: e["ColorRGB"] ? "#" + e["ColorRGB"] : null,
          colorId: e["Color"]?.["Id"],
        }
      }),
    ]);

    if (attendanceTypes) {
      for (const type of Object.values(attendanceTypes)) {
        type.c ??= colors?.[type.colorId];
        delete type.colorId;
      }
    }

    browserAPI.storage.local.set({ users, subjects, lessons, colors, gradeTypes, gradeCategories, attendanceTypes });
  } catch (error) {
    console.error(error);
  }
}

async function fetchAttendances() {
  try {
    await fetch(REFRESH_URL);
    return await fetchFromApi("Attendances", (r, e) => {
      const tripId = e["Trip"]?.["Id"];
      const attendance = {
        // Id frekwencji z 'Czy wycieczka: Tak' jest formatu "t00000"
        id: tripId ? e["Id"].slice(1) : e["Id"],
        lessonId: e["Lesson"]["Id"],
        lessonNo: e["LessonNo"],
        semester: e["Semester"],
        typeId: e["Type"]["Id"],
        userId: e["AddedBy"]["Id"],
        tripId: tripId,
      };
      if (!r[e["Date"]]) {
        r[e["Date"]] = [attendance];
      } else {
        r[e["Date"]].push(attendance);
      }
    });
  } catch (error) {
    console.error(error);
  }

  return null;
}

// Nasłuchiwanie skryptów ze stron
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (browserAPI.runtime.lastError) {
    console.error(browserAPI.runtime.lastError.message);
    return;
  }
  (async () => {
    switch (request.msg) {
      case "fetchTimetable":
        sendResponse(await fetchTimetable(request.data));
        break;
      case "fetchAttendances":
        sendResponse(await fetchAttendances());
        break;
      case "fetchConstants":
        sendResponse(await fetchConstants());
        break;
      case "fetchStudentInfo":
        sendResponse(await fetchStudentInfo());
        break;
      case "fetchAll":
        await fetch(REFRESH_URL).catch(console.error);
        await Promise.all([
          fetchStudentInfo(false),
          fetchTimetable(undefined, false),
          fetchConstants(false),
        ]);
        sendResponse();
        break;
    }
  })();
  // Async
  return true;
});
