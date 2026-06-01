let selectedCaseId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Проверка: если в проекте настроена функция админа, проверяем права
    if (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin()) {
        alert("Доступ запрещен: Вы не являетесь администратором.");
        return;
    }

    // Проверяем, подключен ли Firebase вообще
    if (typeof db === 'undefined' || !db) {
        alert("Критическая ошибка: База данных Firebase (переменная 'db') не найдена! Проверь порядок подключения скриптов в HTML.");
        return;
    }

    // --- ИНИЦИАЛИЗАЦИЯ ДАННЫХ С СЕРВЕРА ---

    // Загружаем данные баннера в форму админки
    getBannerFromServer((bannerData) => {
        try {
            if (!bannerData) return;
            if (document.getElementById('bannerShow')) document.getElementById('bannerShow').checked = !!bannerData.show;
            if (document.getElementById('bannerTitle')) document.getElementById('bannerTitle').value = bannerData.title || '';
            if (document.getElementById('bannerText')) document.getElementById('bannerText').value = bannerData.text || '';
            if (document.getElementById('bannerBtnText')) document.getElementById('bannerBtnText').value = bannerData.btnText || '';
            if (document.getElementById('bannerLink')) document.getElementById('bannerLink').value = bannerData.link || '';
            if (document.getElementById('bannerImage')) document.getElementById('bannerImage').value = bannerData.image || '';
        } catch (e) {
            console.error("Ошибка при заполнении полей баннера: ", e);
        }
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
    }, (error) => {
        alert("Ошибка чтения кейсов из Firebase! Проверь вкладку Rules (Правила) в консоли. Сообщение: " + error.message);
    });

    // Обработчик выбора кейса в селекторе
    document.getElementById('caseSelector').addEventListener('change', (e) => {
        loadCaseToEditor(e.target.value);
    });


    // --- ОБРАБОТЧИКИ КНОПОК (ОТПРАВКА НА СЕРВЕР) ---

    // Кнопка сохранения баннера с глубокой отладкой
    document.getElementById('btnSaveBanner').addEventListener('click', () => {
        try {
            // Собираем данные из HTML полей
            const bannerData = {
                show: document.getElementById('bannerShow').checked,
                title: document.getElementById('bannerTitle').value,
                text: document.getElementById('bannerText').value,
                btnText: document.getElementById('bannerBtnText').value,
                link: document.getElementById('bannerLink').value,
                image: document.getElementById('bannerImage').value
            };

            // Отправляем в Firebase и ждем ответа от сервера
            db.ref('banner').set(bannerData, (error) => {
                if (error) {
                    alert("Сервер Firebase отклонил запись баннера!\n\nПричина: " + error.message + "\n\n(Проверь, чтобы в консоли Firebase -> Realtime Database -> Rules стояло значение true)");
                } else {
                    alert("Ура! Данные баннера успешно сохранились в облаке Firebase и обновились у всех игроков!");
                }
            });

        } catch (err) {
            alert("Ошибка в JavaScript коде!\n\nВозможно, в твоем admin.html у какого-то инпута отсутствует или не совпадает ID.\n\nТекст ошибки: " + err.message);
        }
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
        
        saveCaseToServer(newId, newCase, (error) => {
            if (error) {
                alert("Не удалось создать кейс на сервере: " + error.message);
            } else {
                selectedCaseId = newId;
                loadCaseToEditor(newId);
            }
        });
    });

    // Кнопка "Добавить предмет" внутрь кейса
    document.getElementById('btnAddItem').addEventListener('click', () => {
        addItemRow('', 0, 'common', '');
    });

    // Кнопка "Сохранить кейс"
    document.getElementById('btnSaveCase').addEventListener('click', () => {
        if (!selectedCaseId) return;

        try {
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

            saveCaseToServer(selectedCaseId, caseData, (error) => {
                if (error) {
                    alert("Ошибка сохранения кейса на сервере: " + error.message);
                } else {
                    alert('Кейс успешно сохранен на сервере у всех пользователей!');
                }
            });
        } catch (err) {
            alert("Ошибка при сборке данных кейса: " + err.message);
        }
    });

    // Кнопка "Удалить кейс"
    document.getElementById('btnDeleteCase').addEventListener('click', () => {
        if (!selectedCaseId) return;
        if (confirm('Вы уверены, что хотите полностью удалить этот кейс из базы данных?')) {
            deleteCaseFromServer(selectedCaseId, (error) => {
                if (error) {
                    alert("Не удалось удалить кейс: " + error.message);
                } else {
                    document.getElementById('editorSection').style.display = 'none';
                    selectedCaseId = null;
                    alert('Кейс успешно удален отовсюду.');
                }
            });
        }
    });
});

// Загрузка выбранного кейса в форму редактора
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
    }).catch(err => {
        alert("Ошибка загрузки данных кейса в редактор: " + err.message);
    });
}

// Добавление строки предмета (инпуты, селектор редкости, кнопка удаления)
function addItemRow(name = '', chance = '', rarity = 'common', img = '') {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

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