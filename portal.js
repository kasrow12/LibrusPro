let button = document.querySelector("body > nav > div > div.navbar__left > div > div.navbar-small-menu > a.btn.btn-third.btn-synergia-top.btn-navbar.dropdown-toggle");
if (button) {
    button.href = "https://portal.librus.pl/rodzina/synergia/loguj";
    button.classList.remove("dropdown-toggle");
    button.dataset.toggle = '';
}
let buttonMobile = document.getElementById("dropdownTopRightMenuButton");
if (buttonMobile) {
    buttonMobile.firstElementChild.classList.remove("zmdi-more-vert");
    buttonMobile.firstElementChild.classList.add("zmdi-account");
    buttonMobile.href = "https://portal.librus.pl/rodzina/synergia/loguj";
    buttonMobile.dataset.toggle = '';
}