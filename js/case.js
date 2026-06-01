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

function generateTape(items) {
    const tape = document.getElementById('rouletteTape');
    if (!tape || items.length === 0) return;

    tape.innerHTML = '';
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
    tape.style.transition = 'none';
    tape.style.left = '0px';
}

// --- ПОЛНОСТЬЮ СТАТИЧНАЯ И ИСПРАВЛЕННАЯ ЛОГИКА КРУЧЕНИЯ ---
function startRoulette() {
    if (isRolling || !currentCase || !currentCase.items || currentCase.items.length === 0) return;
    isRolling = true;
    document.getElementById('btnOpen').disabled = true;

    const items = currentCase.items;
    const winner = getWeightedRandomItem(items);

    const tape = document.getElementById('rouletteTape');
    const nodes = tape.children;
    const targetIndex = 45; // Индекс ячейки с победителем

    // ХАК ДЛЯ СБРОСА: Мгновенно убираем любые анимации и возвращаем ленту в начало
    tape.style.transition = 'none';
    tape.style.left = '0px';

    // Вставляем победителя строго на 45-е место
    nodes[targetIndex].className = `roulette-item rarity-${winner.rarity || 'common'}`;
    nodes[targetIndex].innerHTML = `
        <img src="${winner.image || ''}" alt="Weapon" onerror="this.onerror=null; this.src='https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';">
        <div class="name">${winner.name}</div>
    `;

    // Считаем точные координаты
    const wrapperWidth = document.querySelector('.roulette-wrapper').offsetWidth;
    const centerOffset = wrapperWidth / 2 - ITEM_WIDTH / 2;
    const baseLeft = -(targetIndex * ITEM_WIDTH) + centerOffset;

    // Смещение внутри карточки (микро-сдвиг для реализма)
    const microShift = Math.floor(Math.random() * 40) - 20; // от -20px до +20px

    // Запускаем анимацию через requestAnimationFrame, чтобы браузер успел применить сброс в 0px
    requestAnimationFrame(() => {
        setTimeout(() => {
            tape.style.transition = 'left 3.5s cubic-bezier(0.1, 0.6, 0.1, 1)'; 
            tape.style.left = (baseLeft + microShift) + 'px';
        }, 20); // Микропауза, чтобы сброс сработал на 100%
    });

    // Шаг 2: Плавное доведение строго в центр предмета
    setTimeout(() => {
        tape.style.transition = 'left 0.6s cubic-bezier(0.25, 1, 0.5, 1)'; // Мягкое скольжение к центру
        tape.style.left = baseLeft + 'px';
    }, 3500); 

    // Шаг 3: Показ модалки
    setTimeout(() => {
        document.getElementById('winItemImage').src = winner.image || 'https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';
        document.getElementById('winItemName').innerText = winner.name;
        document.getElementById('winModal').classList.add('active');
    }, 4200); 
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