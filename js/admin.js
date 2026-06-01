document.addEventListener('DOMContentLoaded', () => {
    // Элементы управления баннером
    const bannerShow = document.getElementById('bannerShow');
    const bannerTitle = document.getElementById('bannerTitle');
    const bannerText = document.getElementById('bannerText');
    const bannerBtnText = document.getElementById('bannerBtnText');
    const bannerLink = document.getElementById('bannerLink');
    const bannerImage = document.getElementById('bannerImage');
    const btnSaveBanner = document.getElementById('btnSaveBanner');
    const bannerFormInputs = document.getElementById('bannerFormInputs');

    // Элементы управления кейсами
    const caseSelector = document.getElementById('caseSelector');
    const editorSection = document.getElementById('editorSection');
    const editorTitle = document.getElementById('editorTitle');
    const editCaseName = document.getElementById('editCaseName');
    const editCasePrice = document.getElementById('editCasePrice');
    const editCaseImage = document.getElementById('editCaseImage');
    const itemsContainer = document.getElementById('itemsContainer');
    const btnAddItem = document.getElementById('btnAddItem');
    const btnSaveCase = document.getElementById('btnSaveCase');
    const btnCreateNew = document.getElementById('btnCreateNew');
    const btnDeleteCase = document.getElementById('btnDeleteCase');

    let cases = getCases();
    let currentEditingCase = null;
    let isNewCase = false;

    // --- Логика баннера ---
    const currentBanner = getBannerSettings();
    if (currentBanner) {
        bannerShow.checked = currentBanner.show;
        bannerTitle.value = currentBanner.title;
        bannerText.value = currentBanner.text;
        bannerBtnText.value = currentBanner.buttonText;
        bannerLink.value = currentBanner.link;
        bannerImage.value = currentBanner.image;
    }

    bannerShow.addEventListener('change', () => {
        bannerFormInputs.style.opacity = bannerShow.checked ? "1" : "0.4";
    });
    bannerFormInputs.style.opacity = bannerShow.checked ? "1" : "0.4";

    btnSaveBanner.addEventListener('click', () => {
        const updatedBanner = {
            show: bannerShow.checked,
            title: bannerTitle.value.trim() || "Заголовок",
            text: bannerText.value.trim() || "Описание",
            buttonText: bannerBtnText.value.trim() || "Подробнее",
            link: bannerLink.value.trim() || "#",
            image: bannerImage.value.trim()
        };
        saveBannerSettings(updatedBanner);
        alert('Настройки баннера сохранены!');
    });


    // --- Логика кейсов ---
    function initSelector() {
        caseSelector.innerHTML = '<option value="">-- Выберите кейс для редактирования --</option>';
        cases.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = `${c.name} (${c.price} $)`;
            caseSelector.appendChild(opt);
        });
    }

    caseSelector.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) {
            editorSection.style.display = 'none';
            return;
        }
        isNewCase = false;
        currentEditingCase = cases.find(c => c.id === parseInt(id));
        if (currentEditingCase) {
            loadCaseToEditor(currentEditingCase);
        }
    });

    btnCreateNew.addEventListener('click', () => {
        isNewCase = true;
        caseSelector.value = "";
        currentEditingCase = {
            id: Date.now(),
            name: '',
            price: 10,
            image: '',
            items: []
        };
        editorTitle.innerText = "Создание нового кейса";
        editCaseName.value = '';
        editCasePrice.value = 10;
        editCaseImage.value = '';
        itemsContainer.innerHTML = '';
        editorSection.style.display = 'block';
        addItemRow();
    });

    function loadCaseToEditor(c) {
        editorTitle.innerText = `Редактирование кейса: ${c.name}`;
        editCaseName.value = c.name;
        editCasePrice.value = c.price;
        editCaseImage.value = c.image;
        itemsContainer.innerHTML = '';
        c.items.forEach(item => {
            addItemRow(item.name, item.chance, item.image, item.rarity);
        });
        editorSection.style.display = 'block';
    }

    function addItemRow(name = '', chance = '', image = '', rarity = 'common') {
        const row = document.createElement('div');
        row.className = 'admin-item-row';
        row.innerHTML = `
            <input type="text" placeholder="Название предмета" class="item-name" value="${name}">
            <input type="number" step="0.01" placeholder="Шанс %" class="item-chance" value="${chance}">
            <input type="text" placeholder="URL картинки" class="item-image" value="${image}">
            <select class="item-rarity">
                <option value="common" ${rarity === 'common' ? 'selected' : ''}>Common</option>
                <option value="rare" ${rarity === 'rare' ? 'selected' : ''}>Rare</option>
                <option value="epic" ${rarity === 'epic' ? 'selected' : ''}>Epic</option>
                <option value="legendary" ${rarity === 'legendary' ? 'selected' : ''}>Legendary</option>
                <option value="knife" ${rarity === 'knife' ? 'selected' : ''}>Knife</option>
            </select>
            <button class="btn btn-danger btn-remove" style="padding: 10px 15px; border-radius: 8px;">X</button>
        `;

        row.querySelector('.btn-remove').addEventListener('click', () => {
            row.remove();
        });

        itemsContainer.appendChild(row);
    }

    btnAddItem.addEventListener('click', () => addItemRow());

    btnDeleteCase.addEventListener('click', () => {
        if (isNewCase) {
            editorSection.style.display = 'none';
            return;
        }
        if (confirm(`Удалить кейс "${currentEditingCase.name}"?`)) {
            cases = cases.filter(c => c.id !== currentEditingCase.id);
            saveCases(cases);
            alert('Кейс удален!');
            initSelector();
            editorSection.style.display = 'none';
        }
    });

    btnSaveCase.addEventListener('click', () => {
        if (!currentEditingCase) return;

        const nameVal = editCaseName.value.trim();
        const priceVal = parseInt(editCasePrice.value) || 0;
        const imageVal = editCaseImage.value.trim();

        if (!nameVal) {
            alert('Заполните название кейса!');
            return;
        }

        currentEditingCase.name = nameVal;
        currentEditingCase.price = priceVal;
        currentEditingCase.image = imageVal;
        
        const rows = itemsContainer.querySelectorAll('.admin-item-row');
        const updatedItems = [];
        let totalChance = 0;

        rows.forEach(row => {
            const chanceVal = parseFloat(row.querySelector('.item-chance').value) || 0;
            totalChance += chanceVal;

            updatedItems.push({
                name: row.querySelector('.item-name').value.trim() || 'Предмет',
                chance: chanceVal,
                image: row.querySelector('.item-image').value.trim(),
                rarity: row.querySelector('.item-rarity').value
            });
        });

        if (updatedItems.length === 0) {
            alert('Добавьте хотя бы один предмет!');
            return;
        }

        if (Math.abs(totalChance - 100) > 0.02) {
            if (!confirm(`Сумма шансов: ${totalChance.toFixed(2)}% (не 100%). Сохранить всё равно?`)) {
                return;
            }
        }

        currentEditingCase.items = updatedItems;
        
        if (isNewCase) {
            cases.push(currentEditingCase);
        } else {
            cases = cases.map(c => c.id === currentEditingCase.id ? currentEditingCase : c);
        }
        
        saveCases(cases);
        alert('Кейс успешно сохранен!');
        isNewCase = false;
        initSelector();
        editorSection.style.display = 'none';
    });

    initSelector();
});