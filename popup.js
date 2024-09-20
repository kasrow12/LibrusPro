// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

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
  showTeacherFreeDays: true,
  enableGradeManager: true,
  averageValue: 1.80,
  insertTimetable: true,
  keepBlinker: false,
  hideFirstTerm: false,
  incognitoMode: false,
  hideGrades: false,
};
const CHANGELOG_URL = "changelog.html";

let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

const boolOptions = ['hideSubjects', 'calculateAverages', 'depressionMode', 'modernizeSchedule', 'removeClasses', 'addDescriptions', 'darkTheme', 'hideOnes', 'countZeros', 'countToAverage', 'modernizeTitles', 'debug', 'averageWarn', 'showTeacherFreeDays', 'enableGradeManager', 'insertTimetable', 'keepBlinker', 'hideFirstTerm', 'incognitoMode', 'hideGrades'];
const valueOptions = ['plusValue', 'minusValue', 'averageValue'];
const extraOptions = ['debug', 'averageWarn'];

function restoreDefaults() {
  browserAPI.storage.sync.set({
    ["options"]: OPTIONS_DEFAULT
  }, function() {
    browserAPI.storage.sync.remove(["aprilfools"], () => {
      browserAPI.storage.local.remove(["messageTemplate", "customColor"], () => {
        window.location.replace(window.location.href);
      });
    });
  });
}

// Setup
browserAPI.storage.sync.get(["options"], function (t) {
  let options = t["options"];
  if (!options) {
    restoreDefaults();
    return;
  } else {
    let optionMissing = false;
    for (let p in OPTIONS_DEFAULT) {
      if (!options.hasOwnProperty(p)) {
        optionMissing = true;
        options[p] = OPTIONS_DEFAULT[p];
      }
    }

    if (optionMissing) {
      browserAPI.storage.sync.set({
        ["options"]: options
      }, () => { window.location.reload(); });
      return;
    }
  }
  for (let e of boolOptions) {
    let el = document.getElementById(e);
    if (el) el.checked = options[e];
  }
  for (let e of valueOptions) {
    let el = document.getElementById(e);
    if (el) el.value = options[e];
  }
  if (options.debug) document.getElementById("debugButton").classList.add("debug");
});

// Restore default button
document.getElementById("resetButton").onclick = () => {
  restoreDefaults();
  return false;
};

document.getElementById("changelog").onclick = () => {
  browserAPI.tabs.create({
    url: CHANGELOG_URL
  });
  return false;
};

document.getElementById("form").onsubmit = () => {
  const t = {};
  for (let e of boolOptions) {
    let el = document.getElementById(e);
    if (el) t[e] = el.checked;
  }
  for (let e of valueOptions) {
    let el = document.getElementById(e);
    if (el) t[e] = el.value;
  }
  for (let e of extraOptions) {
    t[e] = OPTIONS_DEFAULT[e];
  }
  browserAPI.storage.sync.set({ ["options"]: t });
  return false;
};

// Display version and copyright
document.getElementById("ver").innerText = browserAPI.runtime.getManifest().version;
document.getElementById("copyrightYear").innerText = new Date().getFullYear();

// Enable/disable debugging
let counter = 0;
function debugCounter() {
  counter++;
  if (counter >= 7) {
    browserAPI.storage.sync.get(["options"], function (t) {
      let temp = t["options"];
      temp.debug = !temp.debug;
      browserAPI.storage.sync.set({
        ["options"]: temp
      }, () => { window.location.reload(); });
    });
    counter = 0;
  }
}
document.getElementById("debugButton").addEventListener("click", debugCounter);

// Handle options' pages in popup
const optionsPages = {
  "optionsGeneral": document.getElementById("optionsGeneralElement"),
  "optionsSchedule": document.getElementById("optionsScheduleElement"),
  "optionsGrades": document.getElementById("optionsGradesElement"),
}
for (let e in optionsPages) {
  document.getElementById(e).addEventListener("click", () => {displayOptions(e)});
}

function displayOptions(name) {
  for (let a in optionsPages) {
    optionsPages[a].style.display = "none";
  }
  optionsPages[name].style.display = "block";
}

// ----------------------------- DEBUG -------------------------
function clearStorageData() {
  if (confirm('Na pewno?')) browserAPI.storage.sync.clear();
}

// browserAPI.storage.sync.get(null, function(result){
// 	console.log(result);
// 	for (var x in result)
// 	{
// 		var y = document.createElement("div");
// 		y.innerText = x + ' => ' + result[x];
// 		console.log(result[x]);
// 		y.style.marginBottom = "10px";
// 		document.body.appendChild(y);
// 	}
// })