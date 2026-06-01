let selectedCaseId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Проверка: если не админ, код дальше не пойдет (обработка на самой странице)
    if (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin()) return;

    // Инициализация формы баннера данными из Firebase
    getBannerFromServer((bannerData) => {
        if (!bannerData) return;
        document.getElementById('bannerShow').checked = !!bannerData.show;
        document.getElementById('bannerTitle').value = bannerData.title || '';
        document.getElementById('bannerText').value = bannerData.text || '';
        document.getElementById('bannerBtnText').value = bannerData.btnText || '';
        document.getElementById('bannerLink').value = bannerData.link || '';
        document.getElementById('bannerImage').value = bannerData.image || '';
    });

    // Инициализация выпадающего списка кейсов
    db.ref('cases').on('value', (snapshot) => {
        const selector = document.getElementById('caseSelector');
        if (!selector) return;

        selector.innerHTML = '<option value="">-- Выберите кейс для редактирования --</option>';
        const data = snapshot.val() || {};
        
        Object.keys(data).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.text = data[key].name || key;
            selector.appendChild(option);
        });

        if (selectedCaseId) {
            selector.value = selectedCaseId;
        }
    });

    // Обработчик выбора кейса в селекторе
    document.getElementById('caseSelector').addEventListener('change', (e) => {
        loadCaseToEditor(e.target.value);
    });

    // Кнопка сохранения баннера
    document.getElementById('btnSaveBanner').addEventListener('click', () => {
        const bannerData = {
            show: document.getElementById('bannerShow').checked,
            title: document.getElementById('bannerTitle').value,
            text: document.getElementById('bannerText').value,
            btnText: document.getElementById('bannerBtnText').value,
            link: document.getElementById('bannerLink').value,
            image: document.getElementById('bannerImage').value
        };
        saveBannerToServer(bannerData);
        alert('Рекламный баннер обновлен у всех пользователей!');
    });

    // Кнопка "Создать новый кейс"
    document.getElementById('btnCreateNew').addEventListener('click', () => {
        const newId = 'case_' + Date.now();
        const newCase = {
            name: "Новый кейс",
            price: 100,
            image: "",
            items: [{ name: "Предмет 1", chance: 100, rarity: "common", image: "" }]
        };
        saveCaseToServer(newId, newCase, () => {
            selectedCaseId = newId;
            loadCaseToEditor(newId);
        });
    });

    // Кнопка "Добавить предмет" внутрь кейса
    document.getElementById('btnAddItem').addEventListener('click', () => {
        addItemRow('', 0, 'common', '');
    });

    // Кнопка "Сохранить кейс"
    document.getElementById('btnSaveCase').addEventListener('click', () => {
        if (!selectedCaseId) return;

        const items = [];
        const rows = document.querySelectorAll('.admin-item-row');
        
        rows.forEach(row => {
            items.push({
                name: row.querySelector('.item-name').value,
                chance: parseFloat(row.querySelector('.item-chance').value) || 0,
                rarity: row.querySelector('.item-rarity').value,
                image: row.querySelector('.item-img').value
            });
        });

        const caseData = {
            name: document.getElementById('editCaseName').value,
            price: parseInt(document.getElementById('editCasePrice').value) || 0,
            image: document.getElementById('editCaseImage').value,
            items: items
        };

        saveCaseToServer(selectedCaseId, caseData, () => {
            alert('Кейс успешно сохранен на сервере!');
        });
    });

    // Кнопка "Удалить кейс"
    document.getElementById('btnDeleteCase').addEventListener('click', () => {
        if (!selectedCaseId) return;
        if (confirm('Вы уверены, что хотите полностью удалить этот кейс?')) {
            deleteCaseFromServer(selectedCaseId, () => {
                document.getElementById('editorSection').style.display = 'none';
                selectedCaseId = null;
                alert('Кейс удален.');
            });
        }
    });
});

// Загрузка кейса в форму редактора
function loadCaseToEditor(caseId) {
    selectedCaseId = caseId;
    const editor = document.getElementById('editorSection');
    
    if (!caseId) {
        editor.style.display = 'none';
        return;
    }

    db.ref('cases/' + caseId).once('value').then((snapshot) => {
        const c = snapshot.val();
        if (!c) return;

        document.getElementById('editorTitle').innerText = `Редактирование: ${c.name}`;
        document.getElementById('editCaseName').value = c.name || '';
        document.getElementById('editCasePrice').value = c.price || 0;
        document.getElementById('editCaseImage').value = c.image || '';

        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';

        if (c.items && c.items.length > 0) {
            c.items.forEach(item => {
                addItemRow(item.name, item.chance, item.rarity, item.image);
            });
        }
        editor.style.display = 'block';
    });
}

// Добавление строки предмета (как на макете рисунка)
function addItemRow(name = '', chance = '', rarity = 'common', img = '') {
    const container = document.getElementById('itemsContainer');
    const row = document.createElement('div');
    row.className = 'admin-item-row';
    
    row.innerHTML = `
        <div class="form-group" style="margin:0;">
            <label>ПРЕДМЕТ</label>
            <input type="text" class="item-name" value="${name}" placeholder="Название скина">
        </div>
        <div class="form-group" style="margin:0;">
            <label>ШАНС (%)</label>
            <input type="number" class="item-chance" value="${chance}" placeholder="Например: 1.5" step="0.001">
        </div>
        <div class="form-group" style="margin:0;">
            <label>ИЗОБРАЖЕНИЕ URL</label>
            <input type="text" class="item-img" value="${img}" placeholder="https://...">
        </div>
        <div class="form-group" style="margin:0;">
            <label>РЕДКОСТЬ</label>
            <select class="item-rarity">
                <option value="common" ${rarity === 'common' ? 'selected' : ''}>Common (Серое)</option>
                <option value="rare" ${rarity === 'rare' ? 'selected' : ''}>Rare (Синее)</option>
                <option value="epic" ${rarity === 'epic' ? 'selected' : ''}>Epic (Фиолетовое)</option>
                <option value="legendary" ${rarity === 'legendary' ? 'selected' : ''}>Legendary (Розовое)</option>
                <option value="knife" ${rarity === 'knife' ? 'selected' : ''}>Knife/Glove (Золотое)</option>
            </select>
        </div>
        <button class="btn btn-danger" style="align-self: flex-end; padding: 10px;" onclick="this.parentElement.remove()">❌</button>
    `;
    container.appendChild(row);
}

document.getElementById('btnSaveBanner').addEventListener('click', () => {
    try {
        const bannerData = {
            show: document.getElementById('bannerShow').checked,
            title: document.getElementById('bannerTitle').value,
            text: document.getElementById('bannerText').value,
            btnText: document.getElementById('bannerBtnText').value,
            link: document.getElementById('bannerLink').value,
            image: document.getElementById('bannerImage').value
        };

        // Проверяем, инициализирован ли Firebase
        if (!db) {
            alert("Ошибка: База данных Firebase не инициализирована в storage.js!");
            return;
        }

        // Пытаемся отправить данные и ловим ответ от сервера
        db.ref('banner').set(bannerData, (error) => {
            if (error) {
                alert("Сервер Firebase отклонил запись! Причина: " + error.message);
            } else {
                alert("Ура! Данные успешно записались в облако Firebase!");
            }
        });

    } catch (err) {
        alert("Ошибка в JavaScript коде (вероятно, не совпадает ID инпута в HTML): " + err.message);
    }
});