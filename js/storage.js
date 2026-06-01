// ВСТАВЬ СЮДА СВОЙ ОБЪЕКТ КОНФИГУРАЦИИ ИЗ FIREBASE:
const firebaseConfig = {
  apiKey: "AIzaSyCLKTEWqgIszOJFdUZkOREKQtA72NFBBgY",
  authDomain: "tg-case-sim.firebaseapp.com",
  projectId: "tg-case-sim",
  databaseURL: "https://tg-case-sim-default-rtdb.firebaseio.com/", // Добавили эту строку!
  storageBucket: "tg-case-sim.appspot.com",
  messagingSenderId: "979070902558",
  appId: "1:979070902558:web:c0b6b9ee59a445e674290f"
};

// Твой Telegram ID для админки
const ADMIN_TG_ID = 123456789; 

// Инициализируем Firebase (скрипты подключены в HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Функции Телеграма
function getTelegramUser() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
        return window.Telegram.WebApp.initDataUnsafe.user;
    }
    return null;
}

function isCurrentUserAdmin() {
    const user = getTelegramUser();
    if (!user) return true; // Для тестов на ПК
    return user.id === ADMIN_TG_ID;
}

function adaptHeaderNavigation() {
    const adminLink = document.querySelector('nav a[href="admin.html"]');
    if (adminLink && !isCurrentUserAdmin()) {
        adminLink.remove();
    }
}

function renderUserProfile() {
    const profileContainer = document.getElementById('userProfile');
    if (!profileContainer) return;
    const user = getTelegramUser();
    let name = "Gamer";
    let avatarUrl = "https://placehold.co/100x100/1c1c24/ffc600?text=U";
    if (user) {
        name = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
        if (user.photo_url) avatarUrl = user.photo_url;
    }
    profileContainer.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="profile-avatar">
        <span class="profile-name">${name}</span>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    adaptHeaderNavigation();
    renderUserProfile();
});

// --- НОВЫЕ ФУНКЦИИ СИНХРОНИЗАЦИИ С СЕРВЕРОМ Firebase ---

// Получить баннер с сервера
function getBannerFromServer(callback) {
    db.ref('banner').on('value', (snapshot) => {
        callback(snapshot.val());
    });
}

// Сохранить баннер на сервер
function saveBannerToServer(bannerData) {
    db.ref('banner').set(bannerData);
}

// Получить все кейсы с сервера
function getCasesFromServer(callback) {
    db.ref('cases').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        // Переводим объект в массив для совместимости со старым кодом
        const casesArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        callback(casesArray);
    });
}

// Сохранить или обновить кейс на сервере
function saveCaseToServer(caseId, caseData, callback) {
    db.ref('cases/' + caseId).set(caseData, callback);
}

// Удалить кейс с сервера
function deleteCaseFromServer(caseId, callback) {
    db.ref('cases/' + caseId).remove(callback);
}