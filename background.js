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
  if (tab.url != null && tab.url.indexOf(SYNERGIA_URL) > -1 && options.darkTheme) {
    browserAPI.tabs.insertCSS({
        file: DARKTHEME_CSS,
        runAt: "document_start"
      },
      () => { if (browserAPI.runtime.lastError) console.log(browserAPI.runtime.lastError.message); }
    );
  }
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
    if (tab.url != null && tab.url.indexOf(SYNERGIA_URL) > -1 && options.darkTheme) {
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
browserAPI.runtime.onInstalled.addListener((reason) => {
  if (options.debug === true) return;
  if (reason["reason"] === browserAPI.runtime.OnInstalledReason.INSTALL) {
    // chrome.tabs.create({
    //   url: 'welcome.html'
    // });
  } else if (reason["reason"] === browserAPI.runtime.OnInstalledReason.UPDATE) {
    browserAPI.tabs.create({
      url: CHANGELOG_URL
    });
    // Pre 3.0
    browserAPI.storage.sync.remove(["dane"]);
    browserAPI.storage.sync.remove(["plan"]);
  }
});

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

async function fetchGradeManagerValues() {
  await fetch(REFRESH_URL);
  let colors = await fetch(`${API}/Colors`)
  .then(response => response.json())
  .then(data => {
    data = data["Colors"];
    let _colors = {};
    for (let e of data) {
      _colors[e["Id"]] = `#${e["RGB"]}`;
    }
    return _colors;
  })
  .catch(error => {
    console.log(error);
    return null;
  });
  if (!colors) {
    return null;
  }
  browserAPI.storage.local.set({ ["colors"]: colors });

  let types = await fetch(`${API}/Grades/Types`)
  .then(response => response.json())
  .then(data => {
    data = data["Types"];
    let _types = {};
    for (let e of data) {
      _types[e["Name"]] = e["Value"];
    }
    return _types;
  })
  .catch(error => {
    console.log(error);
    return null;
  });
  if (!types) {
    return null;
  }
  browserAPI.storage.local.set({ ["gradeTypes"]: types });

  let categories = await fetch(`${API}/Grades/Categories`)
  .then(response => response.json())
  .then(data => {
    data = data["Categories"];
    let _categories = {};
    for (let e of data) {
      _categories[e["Id"]] = {
        name: e["Name"],
        color: e["Color"]["Id"],
        weight: e["Weight"],
        count: e["CountToTheAverage"],
      };
    }
    return _categories;
  })
  .catch(error => {
    console.log(error);
    return null;
  });
  if (!categories) {
    return null;
  }
  browserAPI.storage.local.set({ ["gradeCategories"]: categories });

  return [colors, types, categories];
}

// Nasłuchiwanie skryptów ze stron
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (browserAPI.runtime.lastError) {
    console.log(browserAPI.runtime.lastError.message);
    return;
  }
  if (request.msg === "fetchStudentInfo") {
    (async () => {
      let studentInfo = await fetchStudentInfo();
      sendResponse(studentInfo);
    })();
  } else if (request.msg === "fetchTimetable") {
    (async () => {
      let timetable = await fetchTimetable(request.data);
      sendResponse(timetable);
    })();
  } else if (request.msg === "fetchGradeManagerValues") {
    (async () => {
      let val = await fetchGradeManagerValues();
      sendResponse(val);
    })();
  } else if (request.msg === "fetchAll") {
    fetchStudentInfo();
    fetchTimetable();
    fetchGradeManagerValues();
  }
  // Async
  return true;
});
