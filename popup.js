// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

/*
key: 'options'
value: {
  hideSubjects: true,
  calculateAverages: true,
  depressionMode: false,
  hideOnes: false,
  plusValue: 0.5,
  minusValue: 0.25,
}
*/

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

let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

function clear() {
  if (confirm('Na pewno?')) browserAPI.storage.sync.clear();
}

function restoreDefaults() {
  browserAPI.storage.sync.set({
    ["options"]: OPTIONS_DEFAULT
  });
  browserAPI.storage.sync.remove(["aprilfools"]);
  // Janusz, nie przeładowuję, żeby animacja przycisku się dokończyła
  document.getElementById('hideSubjects').checked = OPTIONS_DEFAULT.hideSubjects;
  document.getElementById('calculateAverages').checked = OPTIONS_DEFAULT.calculateAverages;
  document.getElementById('depressionMode').checked = OPTIONS_DEFAULT.depressionMode;
  document.getElementById('modernizeSchedule').checked = OPTIONS_DEFAULT.modernizeSchedule;
  document.getElementById('removeClasses').checked = OPTIONS_DEFAULT.removeClasses;
  document.getElementById('addDescriptions').checked = OPTIONS_DEFAULT.addDescriptions;
  document.getElementById('darkTheme').checked = OPTIONS_DEFAULT.darkTheme;
  document.getElementById('hideOnes').checked = OPTIONS_DEFAULT.hideOnes;
  document.getElementById('countZeros').checked = OPTIONS_DEFAULT.countZeros;
  document.getElementById('countToAverage').checked = OPTIONS_DEFAULT.countToAverage;
  document.getElementById('plusValue').value = OPTIONS_DEFAULT.plusValue;
  document.getElementById('minusValue').value = OPTIONS_DEFAULT.minusValue;
}

// Prepare
browserAPI.storage.sync.get(["options"], function (t) {
  let options = t["options"];
  if (!options) {
    restoreDefaults();
    return;
  } else {
    for (let p in OPTIONS_DEFAULT) {
      if (!options.hasOwnProperty(p)) {
        restoreDefaults();
        return;
      }
    }
  }
  document.getElementById('hideSubjects').checked = options.hideSubjects;
  document.getElementById('calculateAverages').checked = options.calculateAverages;
  document.getElementById('depressionMode').checked = options.depressionMode;
  document.getElementById('modernizeSchedule').checked = options.modernizeSchedule;
  document.getElementById('removeClasses').checked = options.removeClasses;
  document.getElementById('addDescriptions').checked = options.addDescriptions;
  document.getElementById('darkTheme').checked = options.darkTheme;
  document.getElementById('hideOnes').checked = options.hideOnes;
  document.getElementById('countZeros').checked = options.countZeros;
  document.getElementById('countToAverage').checked = options.countToAverage;
  document.getElementById('plusValue').value = options.plusValue;
  document.getElementById('minusValue').value = options.minusValue;
});

const resetButton = document.getElementById("resetButton");
let resetButtonInUse = false;

function validateReset() {
  setTimeout(function () {
    resetButton.classList.remove("onclick");
    resetButton.classList.add("validate");
    restoreDefaults();
    setTimeout(callbackReset, 250);
  }, 100);
}

function callbackReset() {
  resetButton.classList.remove("validate");
  resetButtonInUse = false;
  setTimeout(function () {
    window.location.replace(window.location.href);
  }, 350);
}
resetButton.onclick = () => {
  if (!resetButtonInUse) {
    resetButton.classList.add("onclick");
    resetButtonInUse = true;
    setTimeout(validateReset, 150);
  }
  return false;
};

// Saving logic
let saveButtonInUse = false;
const saveButton = document.getElementById("saveButton");

function validate() {
  setTimeout(function () {
    saveButton.classList.remove("onclick");
    saveButton.classList.add("validate");
    browserAPI.storage.sync.set({
      ["options"]: {
        hideSubjects: document.getElementById('hideSubjects').checked,
        calculateAverages: document.getElementById('calculateAverages').checked,
        depressionMode: document.getElementById('depressionMode').checked,
        modernizeSchedule: document.getElementById('modernizeSchedule').checked,
        removeClasses: document.getElementById('removeClasses').checked,
        addDescriptions: document.getElementById('addDescriptions').checked,
        darkTheme: document.getElementById('darkTheme').checked,
        hideOnes: document.getElementById('hideOnes').checked,
        countZeros: document.getElementById('countZeros').checked,
        countToAverage: document.getElementById('countToAverage').checked,
        plusValue: document.getElementById('plusValue').value,
        minusValue: document.getElementById('minusValue').value,
        debug: false,
      }
    }, () => {
      setTimeout(callback, 450);
    });
  }, 300);
}

function callback() {
  setTimeout(function () {
    saveButton.classList.remove("validate");
    saveButtonInUse = false;
  }, 750);
}

function updateOptions() {
  if (!saveButtonInUse) {
    saveButton.classList.add("onclick");
    saveButtonInUse = true;
    setTimeout(validate, 250);
  }
  return false;
}
document.getElementById('form').onsubmit = updateOptions;

// Update details
browserAPI.storage.sync.get(["dane"], function (t) {
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

          if (!t["dane"] || nr != t["dane"].nr || klasa != t["dane"].currentClass) {
            let temp = DANE_DEFAULT;
            if (klasa != null) temp.currentClass = klasa;
            if (nr != null) temp.nr = nr;
            browserAPI.storage.sync.set({
              ["dane"]: temp
            });
          }
        }
      };
      xhttpKlasa.open("GET", "https://synergia.librus.pl/przegladaj_oceny/uczen", true);
      xhttpKlasa.send();
    }
  };
  xhttpNr.open("GET", "https://synergia.librus.pl/informacja", true);
  xhttpNr.send();
});


// Extras
document.getElementById("ver").innerText = browserAPI.runtime.getManifest().version;
document.getElementById('copyright-year').innerText = new Date().getFullYear();

let counter = 0;

function debugCounter() {
  counter++;
  if (counter >= 7) {
    browserAPI.storage.sync.get(["options"], function (t) {
      let temp = t["options"];
      temp.debug = !temp.debug;
      browserAPI.storage.sync.set({
        ["options"]: temp
      });
    });
    counter = 0;
  }
}
document.getElementById("debugButton").addEventListener("click", debugCounter);


// ----------------------------- DEBUG -------------------------
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