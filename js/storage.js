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