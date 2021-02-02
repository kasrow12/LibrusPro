// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

// key: '17 Październik 2019'
// value: [[nr lekcji, godz, przedmiot, typ, opis, hex color, hex color, url obrazka, data dodania, data ost. modyfikacji], [nr lekcji, godz, przedmiot, typ, opis, hex color, hex color, url obrazka, data dodania, data ost. modyfikacji]]
// value: [['4','','Historia','Kartkówka','zabawa','#xxxxxx','#xxxxxx','google.com/pic.png','31.01.2021, 13:36:29','31.01.2021, 13:40:29'],['','18:00','Historia','Kartkówka','zabawa','#xxxxxx','#xxxxxx','google.com/pic.png','31.01.2021, 13:36:29','31.01.2021, 13:40:29']]


let klasa;
browserAPI.storage.sync.get(["klasa"], function (r) {
  klasa = r["klasa"];
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
overlay.style.display = "none";
overlay.style.clear = "both";
overlay.style.width = "100vw";
overlay.style.height = "100vh";
overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.right = "0";
overlay.style.bottom = "0";
overlay.style.zIndex = "10000";
overlay.style.background = "#111111aa";
overlay.classList = "librusPro_body";
overlay.innerHTML = `
    <style> @media screen and (max-height: 680px) { .librusPro_pageBody { overflow: hidden !important; } .librusPro_body { overflow-y: scroll; } }
    body {overflow: visible;}
    @keyframes zabawa {0% {filter: invert(0);} 10% {filter: invert(0.3);} 20% {filter: invert(0);}}
    .librusPro_container {border: 1px solid black; width: 20vw; max-width: 270px; min-width: 230px; margin: 8vh auto 0 auto; background: #323232; padding: 10px 20px 30px 20px; border-radius: 5px; box-shadow: 2px 3px 5px #000000}
    .librusPro_text {text-shadow: 1px 1px 3px #111111;font-size: 19px; color: #dddddd; text-align:center; margin: 10px 0 5px 0}
    .librusPro_date {text-shadow: 1px 1px 3px #111111;font-size: 15px; color: #dddddd; text-align:center; padding-bottom: 10px; border-bottom: 1px solid #adadad; width: 90%; margin: 0 auto}
    .librusPro_field {width: 90%; margin: 0 auto}
    .librusPro_twoFieldContainer {width: 90%; margin: 0 auto; display: flex; }
    .librusPro_title {font-size: 13px; margin: 7px 0 3px 10px; color: #dddddd}
    .librusPro_input {box-shadow: 1px 1px 3px #000000;width: 100% !important; margin: 0 !important; background: #ffffff !important; color: #333333 !important; padding: 3px 10px !important; height: initial !important; border: 1px solid #222222 !important}
    .librusPro_input:focus {border: 1px solid #666666 !important}
    .librusPro_inputTime {max-width: 90px; height: 25px !important; border-radius: 5px; background: #454545 !important;}
    .librusPro_inputTime:focus {outline: none}
    .librusPro_select {box-shadow: 1px 1px 3px #111111;background: #ffffff; margin: 0 !important; width: 100%; padding: 7px 10px; height: initial; border: 1px solid #222222 !important}
    .librusPro_select:focus {border: 1px solid #666666 !important; }
    .librusPro_button {text-align: center; color: #333333; width: 70%; margin: 15px auto 0 auto; padding: 7px; border-radius: 5px; transition: background 0.2s; cursor: pointer; color: #eeeeee}
    .librusPro_button-add {background: #53b95c}
    .librusPro_button-edit {background: #2444ac}
    .librusPro_button-close {margin-top: 10px;background: #c44b4b}
    .librusPro_button:hover {background: #888888}
    #twoField1 {margin-right: 0; padding-right: 10px; border-right: 1px solid #8e8e8e00 !important}
    #twoField2 {margin-left: 0; padding-left: 10px;}
    .librusPro_error {color: #ff5555; text-align: center; font-size: 16px; margin: 5px 0}
    /*.librusPro_twoField::after {content: " "; position:relative; right: -10px; padding: 7px 0; border-right: 1px solid #8e8e8e}*/
    .librusPro_radioContainer {display: block; position: relative; width: 30px; height: 30px; margin: 5px auto 0 auto; cursor: pointer; font-size: 22px; user-select: none;}
    .librusPro_radioContainer input {position: absolute; opacity: 0; cursor: pointer;}
    .librusPro_radioSpan {position: absolute; top: 0; left: 0; height: 31px; width: 31px; background-color: #ffffff; border-radius: 50%; box-shadow: 1px 1px 3px #333333;}
    .librusPro_radioContainer .librusPro_radioSpan::after {top: 11px; left: 11px; width: 9px; height: 9px; border-radius: 50%; background: #ffffff;}
    .librusPro_radioContainer input:checked ~ .librusPro_radioSpan::after {display: block;}
    .librusPro_radioSpan::after {content: ""; position: absolute; display: none;}
    .librusPro_colorContainer {padding: 7px 0 12px 0 ; border-top: 1px solid #adadad; border-bottom: 1px solid #adadad; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 1px 1px; grid-template-areas: ". . . . . ." ". . . . . ." ". . . . . ."; width: 90%; margin: 12px auto 0 auto;}
    .librusPro_radioContainer .librusPro_darkDot::after {background: #222222}
    </style>
    <div class="librusPro_container">
        <div class="librusPro_text">Dodaj zdarzenie</div>
        <div class="librusPro_date" id="librusPro_date"></div>
        <div class="librusPro_error" id="librusPro_error"></div>
        <div class="librusPro_twoFieldContainer">
            <div class="librusPro_twoField" id="twoField1" style="width: 45%">
                <div class="librusPro_title" style="margin-top: 5px;">Nr lekcji:</div>
                <input type="text" id="librusPro_lesson" class="librusPro_input">
            </div>
            <div class="librusPro_twoField" id="twoField2" >
                <div class="librusPro_title" style="margin-top: 5px;">Godzina:</div>
                <input type="time" id="librusPro_time" class="librusPro_input librusPro_inputTime" style="color: #f5f5f5 !important">
            </div> 
        </div>
        <div class="librusPro_field">
            <div class="librusPro_title">Przedmiot:</div>
            <input type="text" id="librusPro_subject" class="librusPro_input">
        </div>
        <div class="librusPro_field">
            <div class="librusPro_title">Typ:</div>
                <select id="librusPro_typeSelect" class="librusPro_select" onchange="librusPro_onSelectChange()">
                    <option value="">-- wybierz --</option>
                    <option value="Sprawdzian" style="background-color: #ebebeb; color: #333333">Sprawdzian</option>
                    <option value="Kartkówka">Kartkówka</option>
                    <option value="Praca domowa" style="background-color: #ebebeb; color: #333333">Praca domowa</option>
                    <option value="Odpowiedź ustna">Odpowiedź ustna</option>
                    <option value="Inny" style="background-color: #ebebeb; color: #333333">Inny</option>
            </select>
            <div id="librusPro_typeTitle" class="librusPro_title" style="display: none">Typ:</div>
            <input type="text" id="librusPro_type" class="librusPro_input" style="display: none; /*margin-top: 15px*/">
        </div>
        <div class="librusPro_field">
            <div class="librusPro_title">Opis:</div>
            <input type="text" id="librusPro_description" class="librusPro_input">
        </div>
        <div class="librusPro_field">
            <div class="librusPro_title">URL obrazka:</div>
            <input type="text" id="librusPro_imageUrl" class="librusPro_input">
        </div>
        <div class="librusPro_colorContainer">
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
                <input type="radio" name="librusPro_color" value="#222222|#ffffff">
                <span class="librusPro_radioSpan" style="background: #222222"></span>
            </label>
        </div>
        <div class="librusPro_button librusPro_button-add" id="librusPro_add">Dodaj</div>
        <div class="librusPro_button librusPro_button-close" id="librusPro_close">Zamknij</div>
    </div>
`;
document.body.appendChild(overlay);

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
    // Niech sobie to tu posiedzi, może przyda się kiedyś
    // function pickTextColorBasedOnBgColorSimple(bgColor, lightColor, darkColor) {
    //     var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    //     var r = parseInt(color.substring(0, 2), 16);
    //     var g = parseInt(color.substring(2, 4), 16);
    //     var b = parseInt(color.substring(4, 6), 16);
    //     return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ?
    //       darkColor : lightColor;
    // }
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
year = year.options[year.selectedIndex].innerText;

// ---------------- "[+]" BUTTON LISTENER --------------------
function addListenerToAddButton(button, targetKey) {
  button.addEventListener("click", function () {
    displayOverlayForAdding(`${targetKey}`);
  });
}

// ---------------- "[+]" CLICKED --------------------
const overlayConfirmButton = document.getElementById("librusPro_add");
const overlayDate = document.getElementById("librusPro_date");
let listenerLambdaFunction;

function displayOverlayForAdding(cellKey) {
  document.body.classList.toggle("librusPro_pageBody");
  overlay.style.display = "block";
  overlayDate.innerText = cellKey;
  overlayConfirmButton.innerText = "Dodaj";
  overlayConfirmButton.classList.remove("librusPro_button-edit");
  overlayConfirmButton.classList.add("librusPro_button-add");
  lesson.value = "";
  subject.value = "";
  typeSelect.value = "";
  type.value = "";
  typeInputTitle.style.display = "none";
  typeInput.style.display = "none";
  description.value = "";
  imageUrl.value = "";
  firstRadioElement.checked = "true";
  if (listenerLambdaFunction != null) {
    overlayConfirmButton.removeEventListener("click", listenerLambdaFunction);
  }
  listenerLambdaFunction = function () {
    addCustomCell(`${cellKey}`);
  };
  overlayConfirmButton.addEventListener("click", listenerLambdaFunction);
}

// ---------------- "ADD" CLICKED INSIDE "[+]" --------------------
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

function addCustomCell(cellKey) {
  const colorRadioValue = document
    .querySelector("input[name=librusPro_color]:checked")
    .value.split("|");
  if (colorRadioValue == "") {
    document.getElementById("librusPro_error").innerText = "Wybierz kolor";
    return;
  }

  overlay.style.display = "none";

  browserAPI.storage.sync.get([cellKey], function (temp) {
    // Czy już są jakieś wydarzenia dla tego dnia
    if (isEmpty(temp)) {
      browserAPI.storage.sync.set({
        [cellKey]: [
          [
            lesson.value,
            time.value,
            subject.value,
            type.value,
            description.value,
            colorRadioValue[0],
            colorRadioValue[1],
            imageUrl.value,
            new Date().toLocaleString(),
            "",
          ],
        ],
      });
    } else {
      let t = temp[cellKey];
      t.push([
        lesson.value,
        time.value,
        subject.value,
        type.value,
        description.value,
        colorRadioValue[0],
        colorRadioValue[1],
        imageUrl.value,
        new Date().toLocaleString(),
        "",
      ]);
      browserAPI.storage.sync.set({ [cellKey]: t });
    }
  });
  window.location.reload();
}

// ------------------------ DISPLAYING CUSTOM CELLS (AND "[+]") --------------------
const days = document.getElementsByClassName("kalendarz-numer-dnia"); 
const date = new Date();
let setOpacity =
  monthId <= date.getMonth() && year.substring(1) <= date.getFullYear()
    ? true
    : false;
for (let i = 0; i < days.length; i++) {
  const day = days[i];
  const key = `${day.innerText} ${month}${year}`;
  day.style.width = "initial";
  day.style.float = "right";
  day.style.marginBottom = "10px";

  const addButton = document.createElement("a");
  addButton.innerText = "[+]"; 
  addButton.style.display = "inline-block";
  addButton.style.float = "left";
  addButton.style.marginTop = "5px";
  addButton.style.color = "#bbbbbb";
  addButton.style.fontWeight = "bold";
  addButton.style.cursor = "pointer";
  addListenerToAddButton(addButton, key);

  day.parentElement.insertBefore(addButton, day);
  if (day.parentElement.parentElement.classList.contains("today")) {
    setOpacity = false;
  }
  if (setOpacity) {
    day.parentElement.style.opacity = "0.5";
  }

  const clear = document.createElement("span");
  clear.style.clear = "both";
  clear.style.display = "none";
  day.parentElement.appendChild(clear);

  createCell(day, key);
}

// -------------------- CREATE CELL FUNCTION CALLED BY ASYNC FUNCTION ----------------
function createCell(cellDay, cellKey) {
  browserAPI.storage.sync.get([cellKey], function (result) {
    const dayCells = result[cellKey];
    if (dayCells == null) {
      return;
    }
    for (
      let margin = 0;
      margin < cellDay.parentElement.childNodes.length;
      margin++
    ) {
      if (cellDay.parentElement.childNodes[margin].tagName == "TABLE") {
        cellDay.parentElement.childNodes[margin].style.marginBottom = "0px";
        break;
      }
    }

    const table = document.createElement("table");
    table.style.marginTop = "0px";

    for (let i = 0; i < dayCells.length; i++) {
      const row = table.insertRow();
      const cell = row.insertCell();
      const info = dayCells[i];
      cell.style.background = info[5];
      cell.style.color = info[6];
      cell.style.overflowWrap = "break-word";
      cell.style.wordWrap = "break-word";
      cell.style.animation = "zabawa 3s infinite ease-in-out";
      cell.style.wordBreak = "break-word";
      cell.classList.add("no-border-left", "no-border-right");

      let temp = "";
      if (info[0] != "") temp += `Nr lekcji: ${info[0]}\n`;
      if (info[1] != "") temp += `Godz: ${info[1]}\n`;
      if (info[2] != "") {
        temp += info[2];
        if (info[3] == "") temp += "\n";
        else temp += ", ";
      }
      if (info[3] != "") temp += info[3] + "\n";

      if (klasa != undefined) {
        temp += klasa;
      } else {
        let klasaRegex = /<th class="big">Klasa <\/th>\n                <td>\n                (.*)\n                <\/td>/;
        let nrRegex = /<th class="big">Nr w dzienniku <\/th>\n                <td>\n                    (.*)\n                <\/td>/;

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            browserAPI.storage.sync.set({ ["klasa"]: this.responseText.match(klasaRegex)[1] });
            browserAPI.storage.sync.set({ ["nr"]: this.responseText.match(nrRegex)[1] });
            window.location.reload();
          }
        };
        xhttp.open("GET", "https://synergia.librus.pl/informacja", true);
        xhttp.send();
      }
      if (info[4] != "") {
        if (info[4].length > 200)
          temp += `\nOpis: ${info[4].slice(0, 250)}` + "\n[...]";
        else temp += `\nOpis: ${info[4]}`;
      }
      if (info[7] != "" && info[7] !== undefined) {
        // temp += `\n<img src="${info[7]}" style="width: 100%; filter: drop-shadow(3px 3px 2px #000000); border-radius: 5px; margin: 5px 0">`;
        const image = document.createElement("IMG");
        // image.src = info[7];
        image.style.width = "100%";
        image.style.filter = "drop-shadow(3px 3px 2px #000000)";
        image.style.borderRadius = "5px";
        image.style.margin = "5px 0";
        cell.appendChild(image);
        console.log(cell);
        console.log(image);
      }
      cell.innerText = temp;
      cell.title = "Data dodania: " + info[8];
      if (info[9] != "") cell.title += "\nData ostatniej modyfikacji: " + info[9];

      const removeButton = document.createElement("a");
      removeButton.innerText = "⨉";
      removeButton.style.position = "absolute";
      removeButton.style.top = "3px";
      removeButton.style.right = "5px";
      removeButton.style.color = "#bbbbbb";
      removeButton.style.fontWeight = "bold";
      removeButton.style.cursor = "pointer";
      removeButton.style.textShadow = "1px 1px 2px #333333";
      addListenerToRemoveButton(removeButton, cellKey, i);

      const editButton = document.createElement("a");
      editButton.innerText = "✎";
      editButton.style.position = "absolute";
      editButton.style.top = "1px";
      editButton.style.right = "20px";
      editButton.style.color = "#bbbbbb";
      editButton.style.fontWeight = "bold";
      editButton.style.cursor = "pointer";
      editButton.style.textShadow = "1px 1px 2px #333333";
      addListenerToEditButton(editButton, cellKey, i);

      cell.style.position = "relative";
      cell.appendChild(removeButton);
      cell.appendChild(editButton);
      cellDay.parentElement.appendChild(table);

      cell.onmouseenter = function () {
        this.style.background = "#666666";
        this.style.color = "#ffffff";
      };
      cell.onmouseleave = function () {
        this.style.background = `${info[5]}`;
        this.style.color = `${info[6]}`;
      };
      cell.removeEventListener()
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
      browserAPI.storage.sync.set({ [targetKey]: t });
    }
    window.location.reload();
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
  overlayConfirmButton.innerText = "Edytuj";
  overlayConfirmButton.classList.remove("librusPro_button-add");
  overlayConfirmButton.classList.add("librusPro_button-edit");
  overlayDate.innerText = targetKey;

  browserAPI.storage.sync.get([targetKey], function (r) {
    const editInfo = r[targetKey][editIndex];
    [lesson.value, time.value, subject.value, type.value, description.value] = r[targetKey][editIndex];
    typeSelect.value = "Inny";
    typeInputTitle.style.display = "none";
    typeInput.style.display = "none";
    for (let i = 0; i < typeSelect.options.length; i++) {
      if (typeSelect.options[i].value === editInfo[3]) {
        typeSelect.value = editInfo[3];
      }
    }
    if (typeSelect.value == "Inny") {
      typeInputTitle.style.display = "block";
      typeInput.style.display = "block";
    }
    imageUrl.value = editInfo[7];
    const color = editInfo[5] + "|" + editInfo[6];
    const colorInput = document.querySelector(`input[value="${color}"]`);
    if (colorInput !== null) {
      for (let x = 0; x < 18; x++) {
        if (color == colorInput.value) {
          colorInput.checked = "true";
          break;
        }
      }
    } else {
      firstRadioElement.checked = "true";
    }
    if (listenerLambdaFunction != null) {
      overlayConfirmButton.removeEventListener(
        "click",
        listenerLambdaFunction
      );
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
  if (colorSelectValue == "") {
    document.getElementById("librusPro_error").innerText = "Wybierz kolor";
    return;
  }
  overlay.style.display = "none";

  browserAPI.storage.sync.get([targetKey], function (tempResult) {
    const t = tempResult[targetKey];
    t[editIndex] = [
      lesson.value,
      time.value,
      subject.value,
      type.value,
      description.value,
      colorSelectValue[0],
      colorSelectValue[1],
      imageUrl.value,
      tempResult[targetKey][editIndex][8],
      new Date().toLocaleString(),
    ];
    browserAPI.storage.sync.set({ [targetKey]: t });
  });
  window.location.reload();
}

// ------------------- ADD DESCRIPTIONS TO ALL CELLS AND CHANGE "INNE" COLOR ---------------
const tdArray = document.getElementsByTagName("td");
for (let i = 0; i < tdArray.length; i++) {
  if (tdArray[i].title != null) {
    addDescriptionToCell(tdArray[i]);

    if (tdArray[i].style.backgroundColor == "rgb(189, 183, 107)")
      tdArray[i].style.backgroundColor = "#e0dd6b";
  }
}
function addDescriptionToCell(cell) {
  const cellTitle = cell.title;
  const regex = /Opis: (.+?)<br \/>Data/g;
  const res = cellTitle.match(regex);
  if (res != null) {
    const out = res[0].replace("<br />Data", "");
    // Opis z title na wierch, ucięcie zbyt długich.
    if (out.length > 200) {
      cell.innerText += "\n" + out.slice(0, 250).replaceAll("<br />", "\n") + "\n[...]";
    }
    else {
      cell.innerText += "\n" + out;
    }
  }
}

// ----------------------- DEBUG --------------------------------
// pogchamp.storage.sync.clear()
