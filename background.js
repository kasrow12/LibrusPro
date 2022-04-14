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
const ERROR_COLOR = "#ff5555";
const TIMETABLE_WEEK_RANGE = 10;
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

// Kompatybilność
let browserAPI;
if (typeof chrome != null) browserAPI = chrome;
else browserAPI = browser;

let options = OPTIONS_DEFAULT;
browserAPI.storage.sync.get(["options"], (data) => {
  let userOptions = data["options"];
  if (userOptions) {
    options = userOptions;
  }
});

// Nasłuchiwanie zmian ciemnego motywu
browserAPI.storage.onChanged.addListener((changes, namespace) => {
  if (changes["options"] !== undefined) {
    options = changes.options.newValue;
  }
});

// Ciemny motyw
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (browserAPI.runtime.lastError) {
    console.log(browserAPI.runtime.lastError.message);
    return;
  }
  browserAPI.tabs.get(tabId, (t) => {
    if (browserAPI.runtime.lastError) {
      console.log(browserAPI.runtime.lastError.message);
      return;
    }
      if (t.url && t.url.indexOf(SYNERGIA_URL) > -1 && options.darkTheme) {
      browserAPI.tabs.insertCSS({
          file: DARKTHEME_CSS,
          runAt: "document_start"
        },
        () => { if (browserAPI.runtime.lastError) console.log(browserAPI.runtime.lastError.message); }
      );
    }
  });
});

browserAPI.tabs.onActivated.addListener((info) => {
  if (browserAPI.runtime.lastError) {
    console.log(browserAPI.runtime.lastError.message);
    return;
  }
  browserAPI.tabs.get(info.tabId, (tab) => {
    if (browserAPI.runtime.lastError) {
      console.log(browserAPI.runtime.lastError.message);
      return;
    }
    if (tab.url && tab.url.indexOf(SYNERGIA_URL) > -1 && options.darkTheme) {
      browserAPI.tabs.insertCSS({
          file: DARKTHEME_CSS,
          runAt: "document_start"
        },
        () => { if (browserAPI.runtime.lastError) console.log(browserAPI.runtime.lastError.message); }
      );
    }
  });
});

// Otwieranie changelogu po aktualizacji
browserAPI.runtime.onInstalled.addListener((data) => {
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
});

async function fetchFromApi(endpoint, func) {
  let req = await fetch(`${API}/${endpoint}`)
  .then(response => response.json())
  .then(data => {
    // "Attendances/Types" => "Types"
    data = data[endpoint.split("/").at(-1)];
    let result = {};
    for (let e of data) {
      func(result, e);
    }
    return result;
  })
  .catch(error => {
    console.log(error);
    return null;
  });
  return req || null;
}

// Pobieranie klasy oraz numerka z dziennika, wywoływane po każdym zalogowaniu oraz gdy nie ma zapisanych w storage
async function fetchStudentInfo() {
  await fetch(REFRESH_URL);
  let [userID, classID] = await fetch(`${API}/Me`)
  .then(response => response.json())
  .then(data => {return [data["Me"]["Account"]["UserId"], data["Me"]["Class"]["Id"]]})
  .catch(error => {
    console.log(error);
    return [null, null]
  });

  if (!userID || !classID) {
    return {
      number: null,
      class: null,
    }
  }

  let [classNumber, classSymbol, unitID] = await fetch(`${API}/Classes/${classID}`)
  .then(response => response.json())
  .then(data => {return [data["Class"]["Number"], data["Class"]["Symbol"], data["Class"]["Unit"]["Id"]]});

  let shortName = await fetch(`${API}/Units/${unitID}`)
  .then(response => response.json())
  .then(data => {return data["Unit"]["ShortName"]});

  let studentNumber = await fetch(`${API}/Users/${userID}`)
  .then(response => response.json())
  .then(data => {return data["User"]["ClassRegisterNumber"]});

  let studentClass = `${classNumber}${classSymbol} ${shortName}`;

  let studentInfo = {
    number: studentNumber,
    class: studentClass,
  }

  browserAPI.storage.sync.set({
    ["student"]: studentInfo
  });

  return studentInfo;
}

async function fetchMultipleTimetables(weekStart, prevOrNext) {
  let timetables = [];
  let week = weekStart;
  // x tygodni do przodu/tyłu
  for (let i = 0; i < TIMETABLE_WEEK_RANGE; i++) {
    let [timetable, url] = await fetch(`${TIMETABLE_API_URL}${week}`)
    .then(response => response.json())
    .then(data => {
      return [data["Timetable"], data["Pages"][prevOrNext].split("=")[1]];
    });
    timetables = {...timetables, ...timetable};
    week = url;
  }
  return timetables;
}

async function fetchTimetable(weekStart) {
  let url = `${API}/Timetables`;
  if (weekStart) url = `${TIMETABLE_API_URL}${weekStart}`;
  await fetch(REFRESH_URL);
  let [currentTimetable, prev, next] = await fetch(url)
  .then(response => response.json())
  .then(data => { return [data["Timetable"], data["Pages"]["Prev"].split("=")[1], data["Pages"]["Next"].split("=")[1]] })
  .catch(error => {
    console.log(error);
    return [null, null, null];
  });
  if (!currentTimetable) {
    return null;
  }

  let [prevTimetables, nextTimetables] = await Promise.all([fetchMultipleTimetables(prev, 'Prev'), fetchMultipleTimetables(next, 'Next')]);
  let timetables = {...prevTimetables, ...currentTimetable, ...nextTimetables};

  // Jeśli aktualny plan, zapisywanie go
  if (!weekStart) browserAPI.storage.local.set({ ["timetable"]: timetables });

  return timetables;
}

async function fetchConstants() {
  await fetch(REFRESH_URL);

  // Nauczyciele
  let users = await fetchFromApi("Users", (r, e) => { r[e["Id"]] = `${e["LastName"]} ${e["FirstName"]}` });
  browserAPI.storage.local.set({ ["users"]: users });

  // Nazwy przedmiotów
  let subjects = await fetchFromApi("Subjects", (r, e) => { r[e["Id"]] = e["Name"] });
  browserAPI.storage.local.set({ ["subjects"]: subjects });

  // Przedmioty
  let lessons = await fetchFromApi("Lessons", (r, e) => { 
    r[e["Id"]] = {
      t: e["Teacher"]["Id"], 
      s: e["Subject"]["Id"],
    }
  });
  browserAPI.storage.local.set({ ["lessons"]: lessons });

  // Kolory
  let colors = await fetchFromApi("Colors", (r, e) => { r[e["Id"]] = `#${e["RGB"]}` });
  browserAPI.storage.local.set({ ["colors"]: colors });

  // Typy ocen (1,1+,...)
  let gradeTypes = await fetchFromApi("Grades/Types", (r, e) => { r[e["Name"]] = e["Value"] });
  browserAPI.storage.local.set({ ["gradeTypes"]: gradeTypes });

  // Kategorie ocen
  let gradeCategories = await fetchFromApi("Grades/Categories", (r, e) => { 
    r[e["Id"]] = {
      name: e["Name"],
      color: e["Color"]["Id"],
      weight: e["Weight"],
      count: e["CountToTheAverage"],
    }
  });
  browserAPI.storage.local.set({ ["gradeCategories"]: gradeCategories });

  // Kategorie frekwencji
  let attendanceTypes = await fetchFromApi("Attendances/Types", (r, e) => { 
    r[e["Id"]] = {
      n: e["Name"],
      s: e["Short"],
      c: e["ColorRGB"] ? "#" + e["ColorRGB"] : colors[e["Color"]["Id"]],
    }
  });
  browserAPI.storage.local.set({ ["attendanceTypes"]: attendanceTypes });
}

async function fetchAttendances() {
  await fetch(REFRESH_URL);
  let attendances = await fetchFromApi("Attendances", (r, e) => {
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

  return attendances;
}

// Nasłuchiwanie skryptów ze stron
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (browserAPI.runtime.lastError) {
    console.log(browserAPI.runtime.lastError.message);
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
        await fetchStudentInfo();
        await fetchTimetable();
        await fetchConstants();
        sendResponse();
        break;
    }
  })();
  // Async
  return true;
});
