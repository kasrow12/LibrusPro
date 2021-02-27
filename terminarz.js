// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

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


// Klasa do wklejania do każdego własnego wydarzenia np. XD LO
let currentClass;
browserAPI.storage.sync.get(["dane"], function (t) {
  dane = t["dane"];
  if (dane != null && dane.currentClass != null) {
    currentClass = dane.currentClass;
  } else {
    updateDetails(dane, "https://synergia.librus.pl/terminarz");
  }
});

browserAPI.storage.onChanged.addListener(function(changes, namespace) {
  // window.location.reload();

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
    @-webkit-keyframes zabawa {0% {-webkit-filter: invert(0);filter: invert(0);} 10% {-webkit-filter: invert(0.3);filter: invert(0.3);} 20% {-webkit-filter: invert(0);filter: invert(0);}}
    @keyframes zabawa {0% {-webkit-filter: invert(0);filter: invert(0);} 10% {-webkit-filter: invert(0.3);filter: invert(0.3);} 20% {-webkit-filter: invert(0);filter: invert(0);}}
    .librusPro_container {border: 1px solid black; width: 20vw; max-width: 270px; min-width: 270px; margin: 8vh auto 0 auto; background: #323232; padding: 10px 20px 7px 20px; border-radius: 5px; -webkit-box-shadow: 2px 3px 5px #000000; box-shadow: 2px 3px 5px #000000}
    .librusPro_text {text-shadow: 1px 1px 3px #390a3c;font-size: 19px; color: #dddddd; text-align:center; margin: 10px 0 5px 0}
    .librusPro_date {text-shadow: 1px 1px 3px #111111;font-size: 15px; color: #dddddd; text-align:center; padding-bottom: 10px; border-bottom: 1px solid #adadad; width: 90%; margin: 0 auto}
    .librusPro_field {width: 90%; margin: 0 auto}
    .librusPro_twoFieldContainer {width: 90%; margin: 0 auto; display: -webkit-box; display: -ms-flexbox; display: flex; }
    .librusPro_title {display: block; font-size: 12px; margin: 10px 0 3px 10px; color: #dddddd}
    .librusPro_input {-webkit-box-shadow: 1px 1px 3px #000000;box-shadow: 1px 1px 3px #000000;width: 100% !important; margin: 0 !important; background: #454545; color: #dddddd; padding: 3px 10px !important; height: initial !important; border: 1px solid #222222 !important;}
    .librusPro_input:focus {border: 1px solid #666666 !important}
    .librusPro_inputTime {max-width: 90px; height: 25px !important; border-radius: 5px; background: #454545 !important;}
    .librusPro_inputTime:focus {outline: none}
    .librusPro_select {-webkit-box-shadow: 1px 1px 3px #111111;box-shadow: 1px 1px 3px #111111;background: #ffffff; margin: 0 !important; width: 100%; padding: 7px 7px; height: initial; border: 1px solid #222222 !important; font-size: 13px;}
    .librusPro_select:focus {border: 1px solid #666666 !important; }
    .librusPro_button {text-align: center; color: #333333; width: 70%; margin: 15px auto 0 auto; padding: 7px; border-radius: 5px; -webkit-transition: background 0.2s; -o-transition: background 0.2s; transition: background 0.2s; cursor: pointer; color: #eeeeee; -webkit-filter: brightness(0.9); filter: brightness(0.9);}
    .librusPro_button-add {background: #429148}
    .librusPro_button-edit {background: #2444ac}
    .librusPro_button-close {margin-top: 10px;background: #c44b4b}
    .librusPro_button-add:hover {background: #35743a}
    .librusPro_button-edit:hover {background: #1c327c}
    .librusPro_button-close:hover {background: #7e3030}
    #twoField1 {margin-right: 0; padding-right: 10px; border-right: 1px solid #8e8e8e00 !important}
    #twoField2 {margin-left: 0; padding-left: 10px;}
    .librusPro_error {color: #ff5555; text-align: center; font-size: 16px; margin: 5px 0}
    .librusPro_radioContainer {display: block; position: relative; width: 30px; height: 30px; margin: 5px auto 0 auto; cursor: pointer; font-size: 22px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-filter: brightness(0.8); filter: brightness(0.8);}
    .librusPro_radioContainer input {position: absolute; opacity: 0; cursor: pointer;}
    .librusPro_radioSpan {position: absolute; top: 0; left: 0; height: 31px; width: 31px; background-color: #ffffff; border-radius: 50%; -webkit-box-shadow: 1px 1px 3px #333333; box-shadow: 1px 1px 3px #333333;}
    .librusPro_radioContainer .librusPro_radioSpan::after {top: 11px; left: 11px; width: 9px; height: 9px; border-radius: 50%; background: #ffffff;}
    .librusPro_radioContainer input:checked ~ .librusPro_radioSpan::after {display: block;}
    .librusPro_radioSpan::after {content: ""; position: absolute; display: none;}
    .librusPro_colorContainer {padding: 7px 0 12px 0 ; border-top: 1px solid #adadad; border-bottom: 1px solid #adadad; display: -ms-grid; display: grid; -ms-grid-columns: 1fr 1px 1fr 1px 1fr 1px 1fr 1px 1fr 1px 1fr; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; -ms-grid-rows: 1fr 1px 1fr 1px 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 1px 1px; grid-template-areas: ". . . . . ." ". . . . . ." ". . . . . ."; width: 90%; margin: 12px auto 0 auto;}
    .librusPro_radioContainer .librusPro_darkDot::after {background: #222222}
    .librusPro_removeButton {display: none; position: absolute; top: 3px; right: 5px; color: #ffffff; font-weight: bold; cursor: pointer; text-shadow: 1px 1px 2px #333333;}
    .librusPro_editButton {display: none; position: absolute; top: 1px; right: 20px; color: #ffffff; font-weight: bold; cursor: pointer; text-shadow: 1px 1px 2px #333333; }
    th:hover > .librusPro_removeButton {display: block;}
    th:hover > .librusPro_editButton {display: block;}
    textarea {resize: none; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 17px; font-size: 13px; scrollbar-color: dark;}
    #librusPro_lesson, #librusPro_subject, #librusPro_imageUrl, #librusPro_type {font-size: 13px !important;}
    #librusPro_datePicker {background: #454545; color: #dddddd; padding: 2px 8px; outline: none; -webkit-box-shadow: 1px 1px 3px #111111; box-shadow: 1px 1px 3px #111111; border-radius: 5px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px;}
    #librusPro_datePicker:focus {border: 1px solid #666666 !important}
    .librusPro_footer {font-size: 11px; text-align: center; margin-top: 17px; color: #626262}
    </style>
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
                <input type="time" id="librusPro_time" class="librusPro_input librusPro_inputTime" style="color: #f5f5f5 !important">
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
                <option value="Inny" style="background-color: #ebebeb; color: #333333">Inny</option>
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
                <input type="color" name="librusPro_colorHex" style="visibility: hidden;" onchange="librusPro_eventHexColor(this.value)" id="librusPro_inputColor" value="#010101">
                <input type="radio" name="librusPro_color" value="#aaaaaa|#ffffff" id="librusPro_hexRadio">
                <span class="librusPro_radioSpan librusPro_darkDot" style="background: linear-gradient(216deg, rgba(255,0,0,1) 0%, rgba(255,115,0,1) 23%, rgba(249,255,0,1) 43%, rgba(0,255,115,1) 64%, rgba(0,35,255,1) 85%)" id="librusPro_colorHexSpan"></span>
            </label>
        </div>
        <div class="librusPro_button librusPro_button-add" id="librusPro_add">Dodaj</div>
        <div class="librusPro_button librusPro_button-close" id="librusPro_close">Zamknij</div>
        <div class="librusPro_footer">LibrusPro © 2021</div>
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
        [overlayDate.value]: [
          {
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
          },
        ]
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
      browserAPI.storage.sync.set({ [overlayDate.value]: t });
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

for (let i = 0; i < days.length; i++) {
  const day = days[i];
  const key = `${year}-${(monthId + 1) < 10 ? "0" + (monthId + 1) : monthId + 1}-${day.innerText < 10 ? "0" + day.innerText : day.innerText}`;
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

// -------------------- CREATE CELL ASYNC FUNCTION  ----------------
function createCell(cellDay, cellKey) {
  browserAPI.storage.sync.get([cellKey], function (result) {
    const events = result[cellKey];
    if (events == null) {
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

    for (let i = 0; i < events.length; i++) {
      const row = table.insertRow();
      // 'th' dlatego, aby był title przeglądarkowy, bo Librus ma z***any system custom title :)
      const cell = document.createElement("th");
      row.appendChild(cell);
      const event = events[i];
      cell.style.background = event.background;
      cell.style.color = event.color;
      cell.style.overflowWrap = "break-word";
      cell.style.wordWrap = "break-word";
      cell.style.animation = "zabawa 4s infinite ease-in-out";
      cell.style.wordBreak = "break-word";
      cell.classList.add("no-border-left", "no-border-right");

      cell.title = "";

      let temp = "";
      // Nr lekcji
      if (event.lesson != "") {
        if (event.lesson.length > 30) {
          temp += `Nr lekcji: ${event.lesson.slice(0, 30)}[...]\n`;
        } else {
          temp += `Nr lekcji: ${event.lesson}\n`;
        }
      }

      // Godzina
      if (event.time != "") {
        temp += `Godz: ${event.time}\n`;
      }

      // Przedmiot
      if (event.subject != "") {
        if (event.subject.length > 30) {
          temp += `${event.subject.slice(0, 30)}[...]`;
        } else {
          temp += `${event.subject}`;
        }

        temp += (event.type == "") ?  "\n" : ", ";

        cell.title += `${event.subject}` + ((event.type == "") ?  "\n" : `, ${event.type}\n`);
      } else {        
        cell.title += ((event.type == "") ?  "" : `${event.type}\n`);
      }

      // Typ
      if (event.type != "") {
        if (event.type.length > 30) {
          temp += `${event.type.slice(0, 30)}[...]\n`;
        } else {
          temp += `${event.type}\n`;
        }
      }

      // Klasa
      if (currentClass != undefined) {
        temp += currentClass;
      }

      // Opis
      if (event.description != "") {
        if (event.description.length > 200) {
          temp += `\nOpis: ${event.description.replaceAll("<br />", "\n").slice(0, 250)}` + "\n[...]";
        } else {
          temp += `\nOpis: ${event.description.replaceAll("<br />", "\n")}`;
        }
      }
      cell.innerText = temp;

      if (event.url != "" && event.url !== undefined) {
        // temp += `\n<img src="${info.url}" style="width: 100%; filter: drop-shadow(3px 3px 2px #000000); border-radius: 5px; margin: 5px 0">`;
        const image = document.createElement("IMG");
        image.src = event.url;
        image.style.width = "80%";
        image.style.display = "block";
        image.style.margin = "5px auto";
        image.style.filter = "drop-shadow(2px 2px 1px #333333)";
        image.style.borderRadius = "5px";
        cell.appendChild(image);
      }

      
      if (event.description != "") cell.title += "Opis: " + event.description + "\n";
      cell.title += "Data dodania: " + event.dateAdded;
      if (event.dateModified != "") cell.title += "\nData ostatniej modyfikacji: " + event.dateModified ;

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
    if (colorInput !== null) {
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
      browserAPI.storage.sync.set({ [targetKey]: t });
    });
  } else {
    browserAPI.storage.sync.get([targetKey], function (tempResult) {
      addCustomCell(tempResult[targetKey][editIndex].dateAdded);
      removeCustomCell(targetKey, editIndex);
    });
  }
}

// ------------------- ADD DESCRIPTIONS TO ALL CELLS AND CHANGE "INNE" COLOR ---------------
const tdArray = document.getElementsByTagName("td");
for (let i = 0; i < tdArray.length; i++) {
  if (tdArray[i].title != null) {
    addDescriptionToCell(tdArray[i]);

    // Zmiana koloru "Inne", bo jest brzydki lol
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
    // Opis z title na wierzch, ucięcie zbyt długich.
    if (out.length > 200) {
      cell.innerText += "\n" + out.slice(0, 250).replaceAll("<br />", "\n") + "\n[...]";
    }
    else {
      cell.innerText += "\n" + out.replaceAll("<br />", "\n");
    }
  }
}

// ----------------------- DEBUG --------------------------------
// pogchamp.storage.sync.clear()
