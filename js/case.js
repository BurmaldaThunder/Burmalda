const ITEM_WIDTH = 128; // Ширина карточки рулетки (120px + 8px отступы)
let currentCase = null;
let isRolling = false;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('id');

    if (!caseId) {
        window.location.href = 'index.html';
        return;
    }

    // Загружаем данные кейса из Firebase
    db.ref('cases/' + caseId).on('value', (snapshot) => {
        currentCase = snapshot.val();
        if (!currentCase) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('caseName').innerText = currentCase.name;
        document.getElementById('caseImage').src = currentCase.image || 'https://placehold.co/150x110?text=Case';
        
        const btnOpen = document.getElementById('btnOpen');
        if (btnOpen) btnOpen.innerText = `Открыть кейс (${currentCase.price} $)`;

        renderCaseItems(currentCase.items || []);
        generateTape(currentCase.items || []);
    });

    const btnOpen = document.getElementById('btnOpen');
    if (btnOpen) {
        btnOpen.addEventListener('click', startRoulette);
    }
});

function renderCaseItems(items) {
    const grid = document.getElementById('caseItemsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = `item-card rarity-${item.rarity || 'common'}`;
        card.innerHTML = `
            <span class="chance">${item.chance}%</span>
            <img src="${item.image || ''}" alt="${item.name}" onerror="this.onerror=null; this.src='https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';">
            <div style="font-size: 12px; font-weight: 700; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
        `;
        grid.appendChild(card);
    });
}

// Генерация стартовой ленты со СБРОСОМ анимации
function generateTape(items) {
    const tape = document.getElementById('rouletteTape');
    if (!tape || items.length === 0) return;

    // КРИТИЧЕСКИ ВАЖНО: полностью отключаем анимацию перед перестроением ленты
    tape.style.transition = 'none';
    tape.style.left = '0px';
    
    // Форсируем перерисовку браузером, чтобы сброс стилей применился мгновенно
    void tape.offsetWidth; 

    tape.innerHTML = '';
    // Генерируем 55 карточек
    for (let i = 0; i < 55; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const el = document.createElement('div');
        el.className = `roulette-item rarity-${randomItem.rarity || 'common'}`;
        el.innerHTML = `
            <img src="${randomItem.image || ''}" alt="Weapon" onerror="this.onerror=null; this.src='https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';">
            <div class="name">${randomItem.name}</div>
        `;
        tape.appendChild(el);
    }
}

function startRoulette() {
    if (isRolling || !currentCase || !currentCase.items || currentCase.items.length === 0) return;
    isRolling = true;
    document.getElementById('btnOpen').disabled = true;

    const items = currentCase.items;
    const winner = getWeightedRandomItem(items);

    const tape = document.getElementById('rouletteTape');
    const nodes = tape.children;
    const targetIndex = 45; // Победная ячейка в ленте
    
    // Вставляем победителя на его законное 45-е место
    nodes[targetIndex].className = `roulette-item rarity-${winner.rarity || 'common'}`;
    nodes[targetIndex].innerHTML = `
        <img src="${winner.image || ''}" alt="Weapon" onerror="this.onerror=null; this.src='https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';">
        <div class="name">${winner.name}</div>
    `;

    // Вычисляем точные координаты
    const wrapperWidth = document.querySelector('.roulette-wrapper').offsetWidth;
    const centerOffset = wrapperWidth / 2 - ITEM_WIDTH / 2;
    const baseLeft = -(targetIndex * ITEM_WIDTH) + centerOffset;

    // Делаем легкий микро-сдвиг от центра (-15px до +15px), чтобы стрелка не вставала идеально пиксель в пиксель
    const microShift = Math.floor(Math.random() * 30) - 15; 

    // Сначала сбрасываем стили на старт прокрутки
    tape.style.transition = 'none';
    tape.style.left = '0px';
    void tape.offsetWidth; // Триггер перерисовки

    // Шаг 1: Основной запуск прокрутки (с микро-сдвигом для реализма)
    tape.style.transition = 'left 3.5s cubic-bezier(0.1, 0.6, 0.1, 1)'; 
    tape.style.left = (baseLeft + microShift) + 'px';

    // Шаг 2: Плавное докручивание/выравнивание ровно по центру предмета
    setTimeout(() => {
        // Заменяем анимацию на мягкий доводчик и убираем microShift
        tape.style.transition = 'left 0.4s ease-in-out';
        tape.style.left = baseLeft + 'px';
    }, 3500); 

    // Шаг 3: Финал, открытие модалки и чистый сброс состояния
    setTimeout(() => {
        document.getElementById('winItemImage').src = winner.image || 'https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';
        document.getElementById('winItemName').innerText = winner.name;
        document.getElementById('winModal').classList.add('active');

        // Обработчик закрытия модалки (сбрасываем ленту только ПОСЛЕ закрытия или готовности к новому кручению)
        isRolling = false;
        document.getElementById('btnOpen').disabled = false;
        
        // Перегенерируем ленту на месте, чтобы подготовить к следующему открытию
        generateTape(items);
    }, 4000); // 3.5с + 0.4с + 0.1с запас на остановку
}

function getWeightedRandomItem(items) {
    const totalChance = items.reduce((sum, item) => sum + parseFloat(item.chance || 0), 0);
    let randomNum = Math.random() * totalChance;
    
    for (let i = 0; i < items.length; i++) {
        if (randomNum < items[i].chance) {
            return items[i];
        }
        randomNum -= items[i].chance;
    }
    return items[items.length - 1];
}