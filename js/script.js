let menuVisible = false;
let darkMode = true;

function showMenu() {
    const menu = document.querySelector(".menu-bar");
    const img = document.getElementById("toggle-menu");
    if (menuVisible) {
        menu.style.display = "none";
        img.src = "assets/icons/menuoff.png";
    } else {
        menu.style.display = "block";
        img.src = "assets/icons/menuon.png";
    }
    menuVisible = !menuVisible;
}
function showLoginForm(type) {
    document.getElementById('loginType').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    const typeTitle = type === 'guest' ? 'ENTER AS GUEST' : 'ARTIST LOG IN';
    document.getElementById('formTitle').textContent = typeTitle;
}

function backToTypeSelection() {
    document.getElementById('loginType').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
}
const scroller = document.querySelector('.horizontal-scroll');
const floor = document.querySelector('.floor');
const step = 200; // increase this for faster arrow scroll

// Existing wheel scroll → horizontal movement
scroller.addEventListener('wheel', (e) => {
    e.preventDefault();
    scroller.scrollLeft += e.deltaY; // down → right, up → left
    syncFloor();
}, { passive: false });

// Keep floor synced if scrollLeft changes by other means
scroller.addEventListener('scroll', syncFloor);

function syncFloor() {
    floor.style.backgroundPositionX = `${-scroller.scrollLeft}px`;
}

// Arrow key navigation
window.addEventListener('keydown', (e) => {
    const max = scroller.scrollWidth - scroller.clientWidth;

    if (e.key === "ArrowRight") {
        scroller.scrollLeft = Math.min(scroller.scrollLeft + step, max);
        syncFloor();
    } else if (e.key === "ArrowLeft") {
        scroller.scrollLeft = Math.max(scroller.scrollLeft - step, 0);
        syncFloor();
    }
});

function toggleDarkMode() {
    if (darkMode) {
        document.body.classList.add('light-mode');
        document.getElementById('darkToggle').src = "css/icons/light.png";
        document.getElementById('icon-nav').src = "css/icons/icon-dark.png";
    } else { document.body.classList.remove('light-mode');
        document.getElementById('darkToggle').src = "css/icons/dark.png";
        document.getElementById('icon-nav').src = "css/icons/icon-light.png";
     }
    darkMode = !darkMode;
}

function navIndex(index) {
    document.querySelectorAll('.homeindex').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.navlink').forEach(el => el.classList.remove("active"));
    switch (index) {
        case 1:
            document.getElementById('home').style.display = 'block';
            document.getElementById('navhome').classList.add("active");
            break;
        case 2:
            document.getElementById('aboutus').style.display = 'block';
            document.getElementById('navabout').classList.add("active");
            break;
        case 3:
            document.getElementById('contact').style.display = 'flex';
            document.getElementById('navcontact').classList.add("active");
            break;
        default:
            document.getElementById('loginType').style.display = 'block';
            document.getElementById('navhome').classList.add("active");
    }
}