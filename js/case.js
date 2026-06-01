let currentCase = null;
let isRolling = false;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('id');

    if (!caseId) {
        window.location.href = 'index.html';
        return;
    }

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
    const wrapper = document.querySelector('.roulette-wrapper');
    const nodes = tape.children;
    const targetIndex = 44; // Индекс победного предмета
    
    // Подменяем победителя
    nodes[targetIndex].className = `roulette-item rarity-${winner.rarity || 'common'}`;
    nodes[targetIndex].innerHTML = `
        <img src="${winner.image || ''}" alt="Weapon" onerror="this.onerror=null; this.src='https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';">
        <div class="name">${winner.name}</div>
    `;

    // --- ЖЕЛЕЗОБЕТОННЫЙ ДИНАМИЧЕСКИЙ РАСЧЕТ ---
    
    // 1. Измеряем точную физическую ширину карточки прямо сейчас на экране
    const realItemWidth = nodes[0].getBoundingClientRect().width;
    
    // 2. Измеряем точный gap (отступ) между карточками из CSS
    const computedStyle = window.getComputedStyle(tape);
    const realGap = parseFloat(computedStyle.gap) || 0;
    
    // 3. Шаг одной карточки в пикселях — это её ширина плюс один зазор gap
    const itemStep = realItemWidth + realGap;

    // 4. Получаем точную ширину видимого окошка рулетки
    const wrapperWidth = wrapper.getBoundingClientRect().width;

    // 5. Формула идеального центра: сдвигаем ленту так, чтобы начало нужного предмета 
    // встало ровно по центру стрелки
    const absoluteCenterLeft = -(targetIndex * itemStep) + (wrapperWidth / 2) - (realItemWidth / 2);

    // Сброс анимации
    tape.style.transition = 'none';
    tape.style.left = '0px';
    void tape.offsetWidth;

    // Крутим рулетку (сразу идеально в центр, убрали лишние микро-люфты, которые могли багать)
    tape.style.transition = 'left 4s cubic-bezier(0.15, 0.85, 0.3, 1)'; 
    tape.style.left = absoluteCenterLeft + 'px';

    // Финал: показ выигрыша
    setTimeout(() => {
        document.getElementById('winItemImage').src = winner.image || 'https://placehold.co/100x70/1c1c24/ffc600?text=WEAPON';
        document.getElementById('winItemName').innerText = winner.name;
        document.getElementById('winModal').classList.add('active');

        isRolling = false;
        document.getElementById('btnOpen').disabled = false;
        
        generateTape(items);
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