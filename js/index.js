document.addEventListener('DOMContentLoaded', () => {
    // --- Отрисовка Баннера ---
    const bannerContainer = document.getElementById('bannerContainer');
    const bannerSettings = getBannerSettings();

    if (bannerSettings && bannerSettings.show) {
        bannerContainer.innerHTML = `
            <div class="promo-banner">
                <div class="banner-content">
                    <h1>${bannerSettings.title}</h1>
                    <p>${bannerSettings.text}</p>
                    <a href="${bannerSettings.link}" class="btn">${bannerSettings.buttonText}</a>
                </div>
                <div class="banner-image-box">
                    <img src="${bannerSettings.image}" alt="Promo Banner" onerror="this.parentNode.style.display='none'">
                </div>
            </div>
        `;
    } else {
        bannerContainer.innerHTML = '';
    }

    // --- Отрисовка Кейсов ---
    const casesGrid = document.getElementById('casesGrid');
    const cases = getCases();

    casesGrid.innerHTML = '';

    cases.forEach(c => {
        const card = document.createElement('div');
        card.className = 'case-card';
        card.innerHTML = `
            <img src="${c.image}" alt="${c.name}" onerror="this.src='https://placehold.co/200x150/13131a/ffffff?text=Case'">
            <h3>${c.name}</h3>
            <div class="case-actions">
                <div class="price">${c.price} $</div>
                <a href="case.html?id=${c.id}" class="btn">Открыть</a>
            </div>
        `;
        casesGrid.appendChild(card);
    });
});