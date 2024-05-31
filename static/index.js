let currentDate = null;

async function getAttendance() {
    document.getElementById('loading').style.display = 'block';
    const selectDate = document.getElementById('selectDate').value;
    saveState(currentDate);
    currentDate = selectDate;

    try {
        const response = await fetch('/api/attendance');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const dates = data.dates;
        const index = dates.indexOf(selectDate);
        const names = data.names;
        const attendance = data.attendance[index];

        const attendanceList = document.getElementById('attendanceList');
        attendanceList.innerHTML = ''; // Clear previous list

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        names.forEach((name, i) => {
            if (attendance[i] === '○') {
                const cardCol = document.createElement('div');
                cardCol.className = 'col-6 col-md-2'; // Bootstrap column for responsiveness
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${name}</h5>
                    </div>
                `;
                cardCol.appendChild(card);
                rowDiv.appendChild(cardCol);
            }
        });

        attendanceList.appendChild(rowDiv);

        const membersResponse = await fetch('/api/current_members');
        const membersData = await membersResponse.json();

        if (membersData.error) {
            throw new Error(membersData.error);
        }

        const allMembers = membersData.members;
        const bigDragonLeftMembers = membersData.members.filter(member => member.category === '大混' && member.side === 'Left' && attendance[names.indexOf(member.name)] === '○');
        const bigDragonRightMembers = membersData.members.filter(member => member.category === '大混' && member.side === 'Right' && attendance[names.indexOf(member.name)] === '○');
        const smallDragonLeftMembers = membersData.members.filter(member => member.category === '小混' && member.side === 'Left' && attendance[names.indexOf(member.name)] === '○');
        const smallDragonRightMembers = membersData.members.filter(member => member.category === '小混' && member.side === 'Right' && attendance[names.indexOf(member.name)] === '○');

        const allPresentMembers = membersData.members.filter(member => attendance[names.indexOf(member.name)] === '○');
        const allAbsentMembers = membersData.members.filter(member => attendance[names.indexOf(member.name)] !== '○');

        populateSpecialOptions('left_0', 'right_0', allPresentMembers, allAbsentMembers);
        for (let i = 1; i <= 12; i++) {
            populateOptions('left_' + i, 'right_' + i, bigDragonLeftMembers, bigDragonRightMembers, smallDragonLeftMembers, smallDragonRightMembers, allAbsentMembers);
        }
        populateHelmsmanOptions('left_helmsman', allPresentMembers, allAbsentMembers);

        populateSpecialOptions('small_left_0', 'small_right_0', allPresentMembers, allAbsentMembers);
        for (let i = 1; i <= 8; i++) {
            populateOptions('small_left_' + i, 'small_right_' + i, bigDragonLeftMembers, bigDragonRightMembers, smallDragonLeftMembers, smallDragonRightMembers, allAbsentMembers);
        }
        populateHelmsmanOptions('small_helmsman', allPresentMembers, allAbsentMembers);

        document.getElementById('bigDragonDate').textContent = `(${selectDate})`;
        document.getElementById('smallDragonDate').textContent = `(${selectDate})`;

        loadState(selectDate);
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        alert('Error fetching attendance data: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function populateSpecialOptions(leftId, rightId, allPresentMembers, allAbsentMembers) {
    const selectLeft = document.getElementById(leftId);
    const selectRight = document.getElementById(rightId);
    selectLeft.innerHTML = '';
    selectRight.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.text = '';
    emptyOption.value = '';
    selectLeft.appendChild(emptyOption.cloneNode(true));
    selectRight.appendChild(emptyOption.cloneNode(true));

    const optgroupPresentLeft = document.createElement('optgroup');
    optgroupPresentLeft.label = '今日出席';
    selectLeft.appendChild(optgroupPresentLeft);

    const optgroupAbsentLeft = document.createElement('optgroup');
    optgroupAbsentLeft.label = '未登記出席';
    selectLeft.appendChild(optgroupAbsentLeft);

    const optgroupPresentRight = document.createElement('optgroup');
    optgroupPresentRight.label = '今日出席';
    selectRight.appendChild(optgroupPresentRight);

    const optgroupAbsentRight = document.createElement('optgroup');
    optgroupAbsentRight.label = '未登記出席';
    selectRight.appendChild(optgroupAbsentRight);

    allPresentMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupPresentLeft.appendChild(option.cloneNode(true));
        optgroupPresentRight.appendChild(option.cloneNode(true));
    });

    allAbsentMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupAbsentLeft.appendChild(option.cloneNode(true));
        optgroupAbsentRight.appendChild(option.cloneNode(true));
    });

    selectLeft.addEventListener('change', disableSelectedOptions);
    selectRight.addEventListener('change', disableSelectedOptions);
    selectLeft.addEventListener('change', calculateWeights);
    selectRight.addEventListener('change', calculateWeights);
}

function populateOptions(leftId, rightId, bigDragonLeftMembers, bigDragonRightMembers, smallDragonLeftMembers, smallDragonRightMembers, allAbsentMembers) {
    const selectLeft = document.getElementById(leftId);
    const selectRight = document.getElementById(rightId);
    selectLeft.innerHTML = '';
    selectRight.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.text = '';
    emptyOption.value = '';
    selectLeft.appendChild(emptyOption.cloneNode(true));
    selectRight.appendChild(emptyOption.cloneNode(true));

    const optgroupBigLeft = document.createElement('optgroup');
    optgroupBigLeft.label = '大混 - 左';
    selectLeft.appendChild(optgroupBigLeft);

    const optgroupBigRight = document.createElement('optgroup');
    optgroupBigRight.label = '大混 - 右';
    selectRight.appendChild(optgroupBigRight);

    const optgroupSmallLeft = document.createElement('optgroup');
    optgroupSmallLeft.label = '小混 - 左';
    selectLeft.appendChild(optgroupSmallLeft);

    const optgroupSmallRight = document.createElement('optgroup');
    optgroupSmallRight.label = '小混 - 右';
    selectRight.appendChild(optgroupSmallRight);

    const optgroupOthersLeft = document.createElement('optgroup');
    optgroupOthersLeft.label = '未登記出席';
    selectLeft.appendChild(optgroupOthersLeft);

    const optgroupOthersRight = document.createElement('optgroup');
    optgroupOthersRight.label = '未登記出席';
    selectRight.appendChild(optgroupOthersRight);

    bigDragonLeftMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupBigLeft.appendChild(option.cloneNode(true));
    });

    bigDragonRightMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupBigRight.appendChild(option.cloneNode(true));
    });

    smallDragonLeftMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupSmallLeft.appendChild(option.cloneNode(true));
    });

    smallDragonRightMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupSmallRight.appendChild(option.cloneNode(true));
    });

    allAbsentMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupOthersLeft.appendChild(option.cloneNode(true));
        optgroupOthersRight.appendChild(option.cloneNode(true));
    });

    selectLeft.addEventListener('change', disableSelectedOptions);
    selectRight.addEventListener('change', disableSelectedOptions);
    selectLeft.addEventListener('change', calculateWeights);
    selectRight.addEventListener('change', calculateWeights);
}

function populateHelmsmanOptions(helmsmanId, allPresentMembers, allAbsentMembers) {
    const selectHelmsman = document.getElementById(helmsmanId);
    selectHelmsman.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.text = '';
    emptyOption.value = '';
    selectHelmsman.appendChild(emptyOption.cloneNode(true));

    const optgroupPresent = document.createElement('optgroup');
    optgroupPresent.label = '今日出席';
    selectHelmsman.appendChild(optgroupPresent);

    const optgroupAbsent = document.createElement('optgroup');
    optgroupAbsent.label = '未登記出席';
    selectHelmsman.appendChild(optgroupAbsent);

    allPresentMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupPresent.appendChild(option.cloneNode(true));
    });

    allAbsentMembers.forEach(member => {
        const option = document.createElement('option');
        option.text = member.name;
        option.value = member.name;
        option.dataset.weight = member.weight;
        optgroupAbsent.appendChild(option.cloneNode(true));
    });

    selectHelmsman.addEventListener('change', disableSelectedOptions);
}

function disableSelectedOptions() {
    const allSelects = document.querySelectorAll('select');
    const selectedOptions = new Set();

    allSelects.forEach(select => {
        const selectedValue = select.value;
        if (selectedValue) {
            selectedOptions.add(selectedValue);
        }
    });

    allSelects.forEach(select => {
        const options = select.options;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (selectedOptions.has(option.value) && option.value !== select.value) {
                option.disabled = true;
            } else {
                option.disabled = false;
            }
        }
    });
}

function calculateWeights() {
    let leftWeight = 0;
    let rightWeight = 0;
    let smallLeftWeight = 0;
    let smallRightWeight = 0;

    const bigDragonLeftSelects = document.querySelectorAll('#bigDragonTableContainer select[id^="left_"]');
    const bigDragonRightSelects = document.querySelectorAll('#bigDragonTableContainer select[id^="right_"]');
    const smallDragonLeftSelects = document.querySelectorAll('#smallDragonTableContainer select[id^="small_left_"]');
    const smallDragonRightSelects = document.querySelectorAll('#smallDragonTableContainer select[id^="small_right_"]');

    bigDragonLeftSelects.forEach(select => {
        if (select.value) {
            leftWeight += parseFloat(select.selectedOptions[0].dataset.weight) || 0;
        }
    });

    bigDragonRightSelects.forEach(select => {
        if (select.value) {
            rightWeight += parseFloat(select.selectedOptions[0].dataset.weight) || 0;
        }
    });

    smallDragonLeftSelects.forEach(select => {
        if (select.value) {
            smallLeftWeight += parseFloat(select.selectedOptions[0].dataset.weight) || 0;
        }
    });

    smallDragonRightSelects.forEach(select => {
        if (select.value) {
            smallRightWeight += parseFloat(select.selectedOptions[0].dataset.weight) || 0;
        }
    });

    document.getElementById('leftWeight').textContent = leftWeight.toFixed(2);
    document.getElementById('rightWeight').textContent = rightWeight.toFixed(2);
    document.getElementById('smallLeftWeight').textContent = smallLeftWeight.toFixed(2);
    document.getElementById('smallRightWeight').textContent = smallRightWeight.toFixed(2);
}

async function populateDates() {
    try {
        const response = await fetch('/api/attendance');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const selectDate = document.getElementById('selectDate');
        selectDate.innerHTML = '';
        data.dates.forEach(date => {
            const option = document.createElement('option');
            option.text = date;
            option.value = date;
            selectDate.appendChild(option);
        });
        selectDate.addEventListener('change', onDateChange);
    } catch (error) {
        console.error('Error populating dates:', error);
        alert('Error populating dates: ' + error.message);
    }
}

function onDateChange() {
    const selectDate = document.getElementById('selectDate').value;
    if (selectDate !== currentDate) {
        getAttendance();
    }
}

function saveState(date) {
    if (!date) return;
    const state = {
        left: {},
        right: {},
        helmsman: {}
    };
    for (let i = 0; i <= 12; i++) {
        state.left[`left_${i}`] = document.getElementById(`left_${i}`).value;
        state.right[`right_${i}`] = document.getElementById(`right_${i}`).value;
    }
    state.helmsman['left_helmsman'] = document.getElementById('left_helmsman').value;

    localStorage.setItem(date, JSON.stringify(state));
}

function loadState(date) {
    const state = JSON.parse(localStorage.getItem(date));
    if (!state) return;
    for (let i = 0; i <= 12; i++) {
        document.getElementById(`left_${i}`).value = state.left[`left_${i}`] || '';
        document.getElementById(`right_${i}`).value = state.right[`right_${i}`] || '';
    }
    document.getElementById('left_helmsman').value = state.helmsman['left_helmsman'] || '';
    calculateWeights();
    disableSelectedOptions(); // 確保在加載狀態時禁用選項
}

function clearTable(containerId) {
    if (confirm("確定要清空目前的名單嗎？")) {
        const container = document.getElementById(containerId);
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.value = '';
        });
        calculateWeights();
        disableSelectedOptions();
    }
}

function exportTableToImage(tableId, dragonType) {
    const tableContainer = document.getElementById(tableId);
    let selectDate = document.getElementById('selectDate').value;
    selectDate = selectDate.split('(')[0].replace(/\//g, '_').replace(/\)/g, '');
    const filename = `${selectDate}_${dragonType}.png`;
    html2canvas(tableContainer).then(canvas => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
    });
}

populateDates().then(getAttendance);
