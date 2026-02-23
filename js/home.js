let menuVisible = false;
let themeSwitch = localStorage.getItem('homeTheme');
let bb = document.getElementById('themes');
bb.value = themeSwitch;
var fullAucBox = document.getElementById('fullAucBox');
var fullAuc = document.getElementById('fullAucImg');
function showMenu() {
    menuVisible = !menuVisible;
    if (menuVisible) {
        document.getElementById("sideBar").style.display = "none";
        img.src = "assets/icons/menuoff.png";
    } else {
        document.getElementById("sideBar").style.display = "flex";
        img.src = "assets/icons/menuon.png";
    }
}
function removeTheme() {
    document.body.classList.remove('light-theme');
    document.body.classList.remove('pink-theme');
    document.body.classList.remove('ocean-theme');
}
switch(themeSwitch) {
        case 'light':
            document.body.classList.add('light-theme');
            break;
        case 'pink':
            document.body.classList.add('pink-theme');
            break;
        case 'ocean':
            document.body.classList.add('ocean-theme');
            break;
        default:
            localStorage.setItem('homeTheme', 'dark');
    }
function changeTheme() {
    const th = document.getElementById('themes').value;
    switch(th) {
        case 'light':
            removeTheme();
            document.body.classList.add('light-theme');
            localStorage.setItem('homeTheme', 'light');
            break;
        case 'pink':
            removeTheme();
            document.body.classList.add('pink-theme');
            localStorage.setItem('homeTheme', 'pink');
            break;
        case 'ocean':
            removeTheme();
            document.body.classList.add('ocean-theme');
            localStorage.setItem('homeTheme', 'ocean');
            break;
        default:
            removeTheme();
            localStorage.setItem('homeTheme', 'dark');
    }
}
function navIndex(index) {
    document.querySelectorAll('.homeindex').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.navindex').forEach(el => el.classList.remove("active"));
    switch (index) {
        case 1:
            document.getElementById('homef').style.display = 'block';
            document.getElementById('nav1').classList.add("active");
            break;
        case 2:
            document.getElementById('aboutusf').style.display = 'block';
            document.getElementById('nav2').classList.add("active");
            break;
        case 3:
            document.getElementById('auctionf').style.display = 'block';
            document.getElementById('nav3').classList.add("active");
            break;
        case 4:
            document.getElementById('artistf').style.display = 'block';
            document.getElementById('nav4').classList.add("active");
            break;
        case 99:
            document.getElementById('fullAucBox').style.display = 'block';
            document.getElementById('nav4').classList.add("active");
            break;
        case 98:
            document.getElementById('artContestSubmit').style.display = 'block';
            break;
        default:
            document.getElementById('home').style.display = 'block';
            document.getElementById('nav1').classList.add("active");
    }
}
document.querySelectorAll('.aucart').forEach(function(card) {
    card.addEventListener('click', function() {
        const img = this.querySelector('img');
        fullAucBox.style.display = "flex";
        fullAuc.src = img.src;
        navIndex(99);
    });
});
function logOut() {
    localStorage.removeItem('loggedInUserId');
    window.location.href = "index.html";
}
if(!localStorage.getItem('loggedInUserId')) {
    window.location.href = "index.html";
}

const input = document.getElementById("submContest");
const preview = document.getElementById("uploadPreview");

input.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    }
});
