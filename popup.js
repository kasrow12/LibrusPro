/*

key: 'options'
value: {
  hideSubjects: true,
  depressionMode: false,
  plusValue: 0.5,
  minusValue: 0.25,
}

*/

// let clearButtonInUse = false;
// const clearButton = document.getElementById("clearButton");
// clearButton.addEventListener("click", () => {
//   if (!clearButtonInUse) {
//     clearButton.classList.add("onclic");
//     clearButtonInUse = true;
//     setTimeout(validate2, 250);
//   }
// })
// function validate2() {
//   setTimeout(function() {
//     clearButton.classList.remove("onclic");
//     clearButton.classList.add( "validate" );
//     setTimeout(callback2, 450);

//   }, 1050 );
// }
// function callback2() {
//   setTimeout(function() {
//     clearButton.classList.remove( "validate" );
//     clearButtonInUse = false;
//     }, 1250 );
//   }

let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

function clear() {
  if (confirm('Na pewno?'))
  browserAPI.storage.sync.clear();
}
// document.getElementById('clear').addEventListener('click', clear);

function hideSubjects() {
  browserAPI.storage.sync.get(["options"], function (r) {
    const options = r["options"];
    options.hideSubjects = document.getElementById('hideSubjects').checked;
    browserAPI.storage.sync.set({ ["options"]: options });
  });
}
function depressionMode() {
  browserAPI.storage.sync.get(["options"], function (r) {
    const options = r["options"];
    options.depressionMode = document.getElementById('depressionMode').checked;
    browserAPI.storage.sync.set({ ["options"]: options });
  });
}

browserAPI.storage.sync.get(["options"], function (t) {
  options = t["options"];
  document.getElementById('hideSubjects').checked = options.hideSubjects;
  document.getElementById('depressionMode').checked = options.depressionMode;
  document.getElementById('plusValue').value = options.plusValue;
  document.getElementById('minusValue').value = options.minusValue;
});

let saveButtonInUse = false;
const saveButton = document.getElementById("saveButton");

function validate() {
  setTimeout(function() {
    saveButton.classList.remove("onclick");
    saveButton.classList.add( "validate" );
    browserAPI.storage.sync.set({ ["options"]: {
        hideSubjects: document.getElementById('hideSubjects').checked,
        depressionMode: document.getElementById('depressionMode').checked,
        plusValue: document.getElementById('plusValue').value,
        minusValue: document.getElementById('minusValue').value,
      }
    }, () => {
      setTimeout(callback, 450);
    });
  }, 300 );
}
function callback() {
  setTimeout(function() {
    saveButton.classList.remove( "validate" );
    saveButtonInUse = false;
  }, 1250 );
}

function updateOptions() {
  if (!saveButtonInUse) {
    saveButton.classList.add("onclick");
    saveButtonInUse = true;
    setTimeout(validate, 250);
  }
  return false;
}
// document.getElementById('hideSubjects').addEventListener('change', hideSubjects);
// document.getElementById('depressionMode').addEventListener('change', depressionMode);
document.getElementById('form').onsubmit = updateOptions;



// Update number and class
const klasaRegex = /<th class="big">Klasa <\/th>\n                <td>\n                (.*)\n                <\/td>/;
const nrRegex = /<th class="big">Nr w dzienniku <\/th>\n                <td>\n                    (.*)\n                <\/td>/;

const xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    if (this.responseText.match(klasaRegex) != null)
      browserAPI.storage.sync.set({ ["klasa"]: this.responseText.match(klasaRegex)[1] });
    if (this.responseText.match(nrRegex) != null)
      browserAPI.storage.sync.set({ ["nr"]: this.responseText.match(nrRegex)[1] });
  }
};
xhttp.open("GET", "https://synergia.librus.pl/informacja", true);
xhttp.send();

// Insert extension version
document.getElementById("ver").innerText = browserAPI.runtime.getManifest().version;

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
