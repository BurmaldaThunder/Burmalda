const ITEM_WIDTH = 128; // Точная ширина карточки (120px + 8px отступы)
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

function generateTape(items) {
    const tape = document.getElementById('rouletteTape');
    if (!tape || items.length === 0) return;

    tape.style.transition = 'none';
    tape.style.left = '0px';
    void tape.offsetWidth; 

    tape.innerHTML = '';
    // Генерируем 55 предметов
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

// --- ИСПРАВЛЕННАЯ ГЕОМЕТРИЯ ЦЕНТРИРОВАНИЯ ---
function startRoulette() {
    if (isRolling || !currentCase || !currentCase.items || currentCase.items.length === 0) return;
    isRolling = true;
    document.getElementById('btnOpen').disabled = true;

    const items = currentCase.items;
    const winner = getWeightedRandomItem(items);

    const tape = document.getElementById('rouletteTape');
    const wrapper = document.querySelector('.roulette-wrapper');
    const nodes = tape.children;
    const targetIndex = 44; // Используем 44-й индекс для идеального баланса длинной ленты
    
    // Подменяем картинку и инфо победителя в ленте
    nodes[targetIndex].className = `roulette-item rarity-${winner.rarity || 'common'}`;
    nodes[targetIndex].innerHTML = `
        <img src="${winner.image || ''}" alt="Weapon" onerror="this.onerror=null; this.src='https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';">
        <div class="name">${winner.name}</div>
    `;

    // ХИТРЫЙ РАСЧЁТ: Считаем центр окна рулетки динамически в момент клика
    const wrapperWidth = wrapper.getBoundingClientRect().width; 
    const tapeLeftPosition = tape.getBoundingClientRect().left;
    
    // Идеальная точка, чтобы 44-й элемент встал ровно по центру вертикального маркера
    const absoluteCenterLeft = -(targetIndex * ITEM_WIDTH) + (wrapperWidth / 2) - (ITEM_WIDTH / 2);

    // Случайный микро-люфт внутри ОДНОЙ карточки (не более 20px влево-вправо)
    // Чтобы стрелка не указывала на соседний предмет, люфт должен быть строго меньше половины ITEM_WIDTH
    const microShift = Math.floor(Math.random() * 40) - 20; 

    // Сброс позиции перед стартом
    tape.style.transition = 'none';
    tape.style.left = '0px';
    void tape.offsetWidth;

    // ЭТАП 1: Основная прокрутка с cubic-bezier (резкий старт, плавное замедление)
    tape.style.transition = 'left 3.6s cubic-bezier(0.1, 0.7, 0.1, 1)'; 
    tape.style.left = (absoluteCenterLeft + microShift) + 'px';

    // ЭТАП 2: Корректировка. Мягко убираем микро-сдвиг и магнитим стрелку ИДЕАЛЬНО В ЦЕНТР карточки
    setTimeout(() => {
        tape.style.transition = 'left 0.4s ease-in-out';
        tape.style.left = absoluteCenterLeft + 'px';
    }, 3600); 

    // ЭТАП 3: Остановка, модалка и подготовка к новому раунду
    setTimeout(() => {
        document.getElementById('winItemImage').src = winner.image || 'https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';
        document.getElementById('winItemName').innerText = winner.name;
        document.getElementById('winModal').classList.add('active');

        isRolling = false;
        document.getElementById('btnOpen').disabled = false;
        
        // Пересоздаем ленту, чтобы при следующем открытии всё началось сначала
        generateTape(items);
    }, 4100); 
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