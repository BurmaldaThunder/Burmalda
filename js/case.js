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

// --- ОБНОВЛЕННАЯ ЛОГИКА КРУЧЕНИЯ И ЦЕНТРИРОВАНИЯ ---
function startRoulette() {
    if (isRolling || !currentCase || !currentCase.items || currentCase.items.length === 0) return;
    isRolling = true;
    document.getElementById('btnOpen').disabled = true;

    const items = currentCase.items;
    const winner = getWeightedRandomItem(items);

    const tape = document.getElementById('rouletteTape');
    const nodes = tape.children;
    const targetIndex = 45; // Ячейка-победитель
    
    // Вставляем нашего победителя строго на 45-е место в ленте
    nodes[targetIndex].className = `roulette-item rarity-${winner.rarity || 'common'}`;
    nodes[targetIndex].innerHTML = `
        <img src="${winner.image || ''}" alt="Weapon" onerror="this.onerror=null; this.src='https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';">
        <div class="name">${winner.name}</div>
    `;

    // Вычисляем точный центр для остановки маркера
    const wrapperWidth = document.querySelector('.roulette-wrapper').offsetWidth;
    const centerOffset = wrapperWidth / 2 - ITEM_WIDTH / 2;
    const baseLeft = -(targetIndex * ITEM_WIDTH) + centerOffset;

    // Шаг 1: Быстрое и яростное кручение со случайным небольшим сдвигом
    const microShift = Math.floor(Math.random() * 50) - 25; // Сдвиг от -25px до +25px
    tape.style.transition = 'left 3.5s cubic-bezier(0.12, 0.8, 0.25, 1)'; 
    tape.style.left = (baseLeft + microShift) + 'px';

    // Шаг 2: Эффект мягкого «возвращения» строго в центр предмета
    setTimeout(() => {
        // Меняем анимацию на очень плавную (0.5 секунды) и выравниваем left ровно по центру (без microShift)
        tape.style.transition = 'left 0.5s ease-in-out';
        tape.style.left = baseLeft + 'px';
    }, 3500); // Срабатывает ровно в момент окончания основной прокрутки

    // Шаг 3: Показываем модальное окно выигрыша, когда лента идеально отцентрирована
    setTimeout(() => {
        document.getElementById('winItemImage').src = winner.image || 'https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';
        document.getElementById('winItemName').innerText = winner.name;
        document.getElementById('winModal').classList.add('active');

        // Сбрасываем флаг, чтобы можно было крутить снова
        isRolling = false;
        document.getElementById('btnOpen').disabled = false;
    }, 4100); // 3.5с (основное кручение) + 0.5с (центрирование) + 0.1с микро-пауза для эффекта
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