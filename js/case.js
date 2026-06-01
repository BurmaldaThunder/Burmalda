const ITEM_WIDTH = 128; // Ширина карточки рулетки (120px + 8px отступы) с учётом мобилок
let currentCase = null;
let isRolling = false;

document.addEventListener('DOMContentLoaded', () => {
    // Получаем ID кейса из URL параметров
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('id');

    if (!caseId) {
        window.location.href = 'index.html';
        return;
    }

    // Загружаем данные этого кейса из Firebase
    db.ref('cases/' + caseId).on('value', (snapshot) => {
        currentCase = snapshot.val();
        if (!currentCase) {
            window.location.href = 'index.html';
            return;
        }

        // Заполняем интерфейс
        document.getElementById('caseName').innerText = currentCase.name;
        document.getElementById('caseImage').src = currentCase.image || 'https://placehold.co/150x110?text=Case';
        
        const btnOpen = document.getElementById('btnOpen');
        if (btnOpen) btnOpen.innerText = `Открыть кейс (${currentCase.price} $)`;

        // Отрисовываем содержимое под рулеткой
        renderCaseItems(currentCase.items || []);
        
        // Генерируем стартовую ленту рулетки
        generateTape(currentCase.items || []);
    });

    // Вешаем событие на кнопку открытия
    const btnOpen = document.getElementById('btnOpen');
    if (btnOpen) {
        btnOpen.addEventListener('click', startRoulette);
    }
});

// Отрисовка предметов под рулеткой
function renderCaseItems(items) {
    const grid = document.getElementById('caseItemsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = `item-card rarity-${item.rarity || 'common'}`;
        card.innerHTML = `
            <span class="chance">${item.chance}%</span>
            <img src="${item.image || 'https://placehold.co/100x70?text=Weapon'}" alt="${item.name}">
            <div style="font-size: 12px; font-weight: 700; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
        `;
        grid.appendChild(card);
    });
}

// Генерация случайных предметов на ленте
function generateTape(items) {
    const tape = document.getElementById('rouletteTape');
    if (!tape || items.length === 0) return;

    tape.innerHTML = '';
    // Создаем длинную ленту из ~50 предметов для эффекта прокрутки
    for (let i = 0; i < 55; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const el = document.createElement('div');
        el.className = `roulette-item rarity-${randomItem.rarity || 'common'}`;
        el.innerHTML = `
            <img src="${randomItem.image || 'https://placehold.co/100x70?text=Weapon'}" alt="Weapon">
            <div class="name">${randomItem.name}</div>
        `;
        tape.appendChild(el);
    }
    tape.style.transition = 'none';
    tape.style.left = '0px';
}

// Логика кручения
function startRoulette() {
    if (isRolling || !currentCase || !currentCase.items || currentCase.items.length === 0) return;
    isRolling = true;
    document.getElementById('btnOpen').disabled = true;

    const items = currentCase.items;
    
    // Выбираем победителя по весу (шансам)
    const winner = getWeightedRandomItem(items);

    // Перерендериваем ленту, вставляя победителя ровно на 45-ю позицию
    const tape = document.getElementById('rouletteTape');
    const nodes = tape.children;
    
    const targetIndex = 45; // Индекс ячейки, на которой остановится маркер
    
    // Заменяем 45-й элемент на нашего реального победителя
    nodes[targetIndex].className = `roulette-item rarity-${winner.rarity || 'common'}`;
    nodes[targetIndex].innerHTML = `
        <img src="${winner.image || 'https://placehold.co/100x70?text=Weapon'}" alt="Weapon">
        <div class="name">${winner.name}</div>
    `;

    // Считаем точную координату остановки (центрируем маркер)
    const wrapperWidth = document.querySelector('.roulette-wrapper').offsetWidth;
    const centerOffset = wrapperWidth / 2 - ITEM_WIDTH / 2;
    const finalLeft = -(targetIndex * ITEM_WIDTH) + centerOffset;

    // Запуск анимации CSS
    tape.style.transition = 'left 4s cubic-bezier(0.1, 0.6, 0.1, 1)';
    // Небольшой случайный сдвиг внутри карточки, чтобы стрелка не вставала идеально по центру
    const microShift = Math.floor(Math.random() * 40) - 20; 
    tape.style.left = (finalLeft + microShift) + 'px';

    // Показ модалки по окончании кручения
    setTimeout(() => {
        document.getElementById('winItemImage').src = winner.image;
        document.getElementById('winItemName').innerText = winner.name;
        document.getElementById('winModal').classList.add('active');

        // Сбрасываем состояние
        isRolling = false;
        document.getElementById('btnOpen').disabled = false;
        generateTape(items); // Возвращаем рулетку в исходное состояние
    }, 4100);
}

// Выбор предмета на основе процентов шанса
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