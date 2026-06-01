document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    const currentCase = getCaseById(caseId);

    if (!currentCase) {
        document.body.innerHTML = '<h1 style="text-align:center; margin-top:100px;">Кейс не найден</h1>';
        return;
    }

    document.getElementById('caseName').innerText = currentCase.name;
    document.getElementById('caseImage').src = currentCase.image;

    const tape = document.getElementById('rouletteTape');
    const btnOpen = document.getElementById('btnOpen');
    const caseItemsGrid = document.getElementById('caseItemsGrid');

    const ITEM_WIDTH = 128; // 150px ширина + 12px отступы
    let isSpinning = false;

    // Сортировка предметов по редкости/шансу для красивого отображения контента
    currentCase.items.forEach(item => {
        const div = document.createElement('div');
        div.className = `item-card rarity-${item.rarity}`;
        div.innerHTML = `
            <div class="chance">${item.chance}%</div>
            <img src="${item.image}" onerror="this.src='https://placehold.co/120x90/1c1c24/ffffff?text=No+Image'">
            <div style="font-size: 14px; margin-top: 12px; font-weight: 700;">${item.name}</div>
        `;
        caseItemsGrid.appendChild(div);
    });

    // Генерация превью-ленты при входе в кейс
    function generateInitialTape() {
        tape.innerHTML = '';
        for (let i = 0; i < 15; i++) {
            const randomItem = currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
            const el = document.createElement('div');
            el.className = `roulette-item rarity-${randomItem.rarity}`;
            el.innerHTML = `<img src="${randomItem.image}"><div class="name">${randomItem.name}</div>`;
            tape.appendChild(el);
        }
    }

    function getRandomItem() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (let item of currentCase.items) {
            cumulative += item.chance;
            if (rand <= cumulative) return item;
        }
        return currentCase.items[0];
    }

    function spin() {
        if (isSpinning) return;
        if (!currentCase.items || currentCase.items.length === 0) {
            alert('В этом кейсе нет предметов!');
            return;
        }
        isSpinning = true;
        btnOpen.disabled = true;

        const winningItem = getRandomItem();
        const winningIndex = 35; // Предмет, который остановится в центре
        
        tape.innerHTML = '';
        for (let i = 0; i < 45; i++) {
            const item = (i === winningIndex) ? winningItem : currentCase.items[Math.floor(Math.random() * currentCase.items.length)];
            const el = document.createElement('div');
            el.className = `roulette-item rarity-${item.rarity}`;
            el.innerHTML = `<img src="${item.image}" onerror="this.src='https://placehold.co/95x75/1c1c24/ffffff?text=No+Img'"><div class="name">${item.name}</div>`;
            tape.appendChild(el);
        }

        tape.style.transition = 'none';
        tape.style.transform = 'translateX(0)';
        tape.offsetHeight; 

        const wrapperWidth = document.querySelector('.roulette-wrapper').offsetWidth;
        const stopAt = (winningIndex * ITEM_WIDTH) - (wrapperWidth / 2) + (ITEM_WIDTH / 2);
        const randomFineTune = (Math.random() * 60) - 30; // Рандом смещения от идеального центра

        tape.style.transition = 'transform 6s cubic-bezier(0.1, 0.55, 0.1, 1)';
        tape.style.transform = `translateX(-${stopAt + randomFineTune}px)`;

        setTimeout(() => {
            document.getElementById('winItemImage').src = winningItem.image;
            document.getElementById('winItemName').innerText = winningItem.name;
            
            const modalCard = document.getElementById('winModalCard');
            modalCard.className = `win-modal rarity-${winningItem.rarity}`;

            document.getElementById('winModal').classList.add('active');

            isSpinning = false;
            btnOpen.disabled = false;
        }, 6100);
    }

    generateInitialTape();
    btnOpen.addEventListener('click', spin);
});