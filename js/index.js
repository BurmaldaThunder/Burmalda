document.addEventListener('DOMContentLoaded', () => {
    // 1. Получаем рекламный баннер с сервера
    getBannerFromServer((bannerData) => {
        const container = document.getElementById('bannerContainer');
        if (!container) return;

        if (bannerData && bannerData.show) {
            container.innerHTML = `
                <div class="promo-banner">
                    <div class="banner-content">
                        <h1>${bannerData.title || 'НОВЫЕ АПГРЕЙДЫ'}</h1>
                        <p>${bannerData.text || 'ТЕПЕРЬ ЗАХОДЯТ ДАЖЕ НА 1%'}</p>
                        <a href="${bannerData.link || '#'}" class="btn">${bannerData.btnText || 'Прокачать!'}</a>
                    </div>
                    ${bannerData.image ? `
                    <div class="banner-image-box">
                        <img src="${bannerData.image}" alt="Banner Image">
                    </div>` : ''}
                </div>
            `;
        } else {
            container.innerHTML = ''; // Скрываем, если выключен в админке
        }
    });

    // 2. Получаем кейсы с сервера
    getCasesFromServer((casesList) => {
        const grid = document.getElementById('casesGrid');
        if (!grid) return;

        if (casesList.length === 0) {
            // Если в Firebase ещё нет кейсов, создаем один демонстрационный
            const defaultCase = {
                name: "БМПТ 72",
                price: 1488,
                image: "https://i.postimg.co/mZ38gXg7/bmpt72.png", // Замени на свой URL, если нужно
                items: [
                    { name: "АК-47 | Неоновая революция", chance: 5, rarity: "epic", image: "https://i.ibb.co/6wXzXy1/ak47.png" },
                    { name: "M4A1-S | Механо-пушка", chance: 15, rarity: "rare", image: "https://i.ibb.co/XW8XzXy/m4a1.png" }
                ]
            };
            saveCaseToServer('default_case', defaultCase);
            return;
        }

        // Рендерим сетку кейсов
        grid.innerHTML = '';
        casesList.forEach(c => {
            const card = document.createElement('div');
            card.className = 'case-card';
            card.innerHTML = `
                <img src="${c.image || 'https://placehold.co/150x110?text=Case'}" alt="${c.name}">
                <h3>${c.name}</h3>
                <div class="case-actions">
                    <span class="price">${c.price} $</span>
                    <button class="btn" onclick="openCasePage('${c.id}')">Открыть</button>
                </div>
            `;
            grid.appendChild(card);
        });
    });
});

function openCasePage(caseId) {
    // Переходим на страницу кейса и передаем его ID через адресную строку
    window.location.href = `case.html?id=${caseId}`;
}