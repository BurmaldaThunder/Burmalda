// Конфигурация администратора
const ADMIN_TG_ID = 8400713053; // <-- ЗАМЕНИ ЭТО ЧИСЛО НА СВОЙ TELEGRAM ID!

// Функция для получения данных пользователя из Telegram
function getTelegramUser() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
        return window.Telegram.WebApp.initDataUnsafe.user;
    }
    return null;
}
// Проверка, является ли текущий пользователь админом
function isCurrentUserAdmin() {
    const user = getTelegramUser();
    
    // Для тестов на ПК (если открываешь не в ТГ), временно возвращаем true. 
    // Когда зальешь в ТГ, ПК-версия перестанет пускать посторонних.
    if (!user) {
        return true; // Смени на false, когда полностью закончишь тесты на ПК
    }
    
    return user.id === ADMIN_TG_ID;
}

// Функция для адаптации шапки под роль пользователя
function adaptHeaderNavigation() {
    const adminLink = document.querySelector('nav a[href="admin.html"]');
    if (adminLink && !isCurrentUserAdmin()) {
        adminLink.remove(); // Удаляем кнопку админки для обычных пользователей
    }
}

// Запускаем скрытие админки сразу при загрузке скрипта
document.addEventListener('DOMContentLoaded', adaptHeaderNavigation);

// Дефолтные данные, если LocalStorage пустой
const defaultCases = [
    {
        id: 1,
        name: "Premium Case",
        image: "https://placehold.co/150x150/2b2b2b/ffffff?text=Premium+Case",
        price: 99,
        items: [
            { name: "M4A4 | Howl", image: "https://placehold.co/100x100/ff4655/ffffff?text=Howl", chance: 1.5, rarity: "knife" },
            { name: "AK-47 | Neon Rider", image: "https://placehold.co/100x100/b446ff/ffffff?text=Neon+Rider", chance: 8.5, rarity: "legendary" },
            { name: "AWP | Asiimov", image: "https://placehold.co/100x100/ff9900/ffffff?text=Asiimov", chance: 15.0, rarity: "epic" },
            { name: "M4A1-S | Hyper Beast", image: "https://placehold.co/100x100/4666ff/ffffff?text=Hyper+Beast", chance: 30.0, rarity: "rare" },
            { name: "Glock-18 | Oxide Blaze", image: "https://placehold.co/100x100/777777/ffffff?text=Oxide+Blaze", chance: 45.0, rarity: "common" }
        ]
    }
];

// Дефолтные настройки баннера
const defaultBanner = {
    show: true,
    title: "НОВЫЕ АПГРЕЙДЫ",
    text: "ТЕПЕРЬ ЗАХОДЯТ ДАЖЕ НА 1%",
    buttonText: "Прокачать!",
    link: "#",
    image: "https://placehold.co/500x300/1c1c24/ffc600?text=BANNER+IMAGE" 
};

function getCases() {
    const cases = localStorage.getItem('cases');
    if (!cases) {
        localStorage.setItem('cases', JSON.stringify(defaultCases));
        return defaultCases;
    }
    return JSON.parse(cases);
}

function saveCases(cases) {
    localStorage.setItem('cases', JSON.stringify(cases));
}

function getCaseById(id) {
    const cases = getCases();
    return cases.find(c => c.id === parseInt(id));
}

function getBannerSettings() {
    const banner = localStorage.getItem('banner_settings');
    if (!banner) {
        localStorage.setItem('banner_settings', JSON.stringify(defaultBanner));
        return defaultBanner;
    }
    return JSON.parse(banner);
}

function saveBannerSettings(settings) {
    localStorage.setItem('banner_settings', JSON.stringify(settings));
}

// Функция для отрисовки профиля пользователя в шапке
function renderUserProfile() {
    const profileContainer = document.getElementById('userProfile');
    if (!profileContainer) return;

    const user = getTelegramUser();
    
    // Дефолтные данные (если открыто вне ТГ)
    let name = "Gamer";
    let avatarUrl = "https://placehold.co/100x100/1c1c24/ffc600?text=U";

    // Если зашли через ТГ, берем реальные данные
    if (user) {
        name = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
        if (user.photo_url) {
            avatarUrl = user.photo_url;
        }
    }

    profileContainer.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="profile-avatar">
        <span class="profile-name">${name}</span>
    `;
}

// Запускаем отрисовку профиля вместе со скрытием админки
document.addEventListener('DOMContentLoaded', () => {
    adaptHeaderNavigation();
    renderUserProfile();
});

// Функция для отрисовки профиля пользователя в шапке
function renderUserProfile() {
    const profileContainer = document.getElementById('userProfile');
    if (!profileContainer) return;

    const user = getTelegramUser();
    
    // Дефолтные данные (если открыто вне ТГ)
    let name = "Gamer";
    let avatarUrl = "https://placehold.co/100x100/1c1c24/ffc600?text=U";

    // Если зашли через ТГ, берем реальные данные
    if (user) {
        name = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
        if (user.photo_url) {
            avatarUrl = user.photo_url;
        }
    }

    profileContainer.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="profile-avatar">
        <span class="profile-name">${name}</span>
    `;
}

// Запускаем отрисовку профиля вместе со скрытием админки
document.addEventListener('DOMContentLoaded', () => {
    adaptHeaderNavigation();
    renderUserProfile();
});