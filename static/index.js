console.log("index.js 加載成功");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM 加載完成");
    populateDates().then(getAttendance);
});

let currentDate = null;

async function getAttendance() {
    console.log("getAttendance 函數被調用");
    document.getElementById('loading').style.display = 'block';
    const selectDate = document.getElementById('selectDate').value;
    console.log("選擇的日期:", selectDate);
    saveState(currentDate);
    currentDate = selectDate;

    try {
        const response = await fetch('/api/attendance');
        console.log("API 請求發送");
        const data = await response.json();
        console.log("API 回應數據:", data);

        if (data.error) {
            throw new Error(data.error);
        }

        const dates = data.dates;
        const index = dates.indexOf(selectDate);
        const names = data.names;
        const attendance = data.attendance[index];

        console.log("處理後的數據:", { dates, index, names, attendance });

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
        console.log("membersData:", membersData);

        if (membersData.error) {
            throw new Error(membersData.error);
        }

        const allMembers = membersData.members;
        // const bigDragonLeftMembers = allMembers.filter(member => member.category === 'One' && member.side === 'Left' && attendance[names.indexOf(member.name)] === '○');
        // const bigDragonRightMembers = allMembers.filter(member => member.category === 'One' && member.side === 'Right' && attendance[names.indexOf(member.name)] === '○');
        // const smallDragonLeftMembers = allMembers.filter(member => member.category === 'Two' && member.side === 'Left' && attendance[names.indexOf(member.name)] === '○');
        // const smallDragonRightMembers = allMembers.filter(member => member.category === 'Two' && member.side === 'Right' && attendance[names.indexOf(member.name)] === '○');
        // const uncategorizedMembers = allMembers.filter(member => member.category === 'none' && attendance[names.indexOf(member.name)] === '○');

        // const allPresentMembers = allMembers.filter(member => attendance[names.indexOf(member.name)] === '○');
        // const allAbsentMembers = allMembers.filter(member => attendance[names.indexOf(member.name)] !== '○');

        // 打印調試信息
        // 假設 allMembers、names 和 attendance 都是有效且正確的數據

        // 確保 names 和 attendance 的長度一致
        if (names.length !== attendance.length) {
            console.error('names 和 attendance 的長度不匹配');
        }

        // 檢查每個成員的出席狀態
        allMembers.forEach(member => {
            const index = names.indexOf(member.name);
            if (index === -1) {
                console.error(`成員 ${member.name} 不在 names 列表中`);
                return;
            }

            if (attendance[index] === '○') {
                console.log(`${member.name} 是出席`);
            } else {
                console.log(`${member.name} 是缺席`);
            }
        });

        // 過濾大龍左側成員
        const bigDragonLeftMembers = allMembers.filter(member => {
            const index = names.indexOf(member.name);
            return member.category === 'One' && member.side === 'Left' && attendance[index] === '○';
        });
        console.log('大龍左側成員:', bigDragonLeftMembers);

        // 過濾大龍右側成員
        const bigDragonRightMembers = allMembers.filter(member => {
            const index = names.indexOf(member.name);
            return member.category === 'One' && member.side === 'Right' && attendance[index] === '○';
        });
        console.log('大龍右側成員:', bigDragonRightMembers);

        // 過濾小龍左側成員
        const smallDragonLeftMembers = allMembers.filter(member => {
            const index = names.indexOf(member.name);
            return member.category === 'Two' && member.side === 'Left' && attendance[index] === '○';
        });
        console.log('小龍左側成員:', smallDragonLeftMembers);

        // 過濾小龍右側成員
        const smallDragonRightMembers = allMembers.filter(member => {
            const index = names.indexOf(member.name);
            return member.category === 'Two' && member.side === 'Right' && attendance[index] === '○';
        });
        console.log('小龍右側成員:', smallDragonRightMembers);

        // 過濾未分類成員
        const uncategorizedMembers = allMembers.filter(member => {
            const index = names.indexOf(member.name);
            return member.category === 'none' && attendance[index] === '○';
        });
        console.log('未分類成員:', uncategorizedMembers);

        // 過濾所有出席成員
        const allPresentMembers = allMembers.filter(member => {
            const index = names.indexOf(member.name);
            return attendance[index] === '○';
        });
        console.log('所有出席成員:', allPresentMembers);

        // 過濾所有缺席成員
        const allAbsentMembers = allMembers.filter(member => {
            const index = names.indexOf(member.name);
            return attendance[index] !== '○';
        });
        console.log('所有缺席成員:', allAbsentMembers);

        

        populateSpecialOptions('left_0', 'right_0', allPresentMembers, allAbsentMembers);
        for (let i = 1; i <= 12; i++) {
            populateOptions('left_' + i, 'right_' + i, bigDragonLeftMembers, bigDragonRightMembers, smallDragonLeftMembers, smallDragonRightMembers, allAbsentMembers, uncategorizedMembers);
        }
        populateHelmsmanOptions('left_helmsman', allPresentMembers, allAbsentMembers);

        populateSpecialOptions('small_left_0', 'small_right_0', allPresentMembers, allAbsentMembers);
        for (let i = 1; i <= 8; i++) {
            populateOptions('small_left_' + i, 'small_right_' + i, bigDragonLeftMembers, bigDragonRightMembers, smallDragonLeftMembers, smallDragonRightMembers, allAbsentMembers, uncategorizedMembers);
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

    const optgroupPresentLeft = createOptgroup('今日出席', allPresentMembers);
    if (optgroupPresentLeft) selectLeft.appendChild(optgroupPresentLeft);

    const optgroupAbsentLeft = createOptgroup('未登記出席', allAbsentMembers);
    if (optgroupAbsentLeft) selectLeft.appendChild(optgroupAbsentLeft);

    const optgroupPresentRight = createOptgroup('今日出席', allPresentMembers);
    if (optgroupPresentRight) selectRight.appendChild(optgroupPresentRight);

    const optgroupAbsentRight = createOptgroup('未登記出席', allAbsentMembers);
    if (optgroupAbsentRight) selectRight.appendChild(optgroupAbsentRight);

    selectLeft.addEventListener('change', disableSelectedOptions);
    selectRight.addEventListener('change', disableSelectedOptions);
    selectLeft.addEventListener('change', calculateWeights);
    selectRight.addEventListener('change', calculateWeights);
}

function createOptgroup(label, members) {
    if (members.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = label;
        members.forEach(member => {
            const option = document.createElement('option');
            option.text = member.name;
            option.value = member.name;
            option.dataset.weight = member.weight;
            optgroup.appendChild(option);
        });
        return optgroup;
    }
    return null;
}

function populateOptions(leftId, rightId, bigDragonLeftMembers, bigDragonRightMembers, smallDragonLeftMembers, smallDragonRightMembers, allAbsentMembers, uncategorizedMembers) {
    const selectLeft = document.getElementById(leftId);
    const selectRight = document.getElementById(rightId);
    selectLeft.innerHTML = '';
    selectRight.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.text = '';
    emptyOption.value = '';
    selectLeft.appendChild(emptyOption.cloneNode(true));
    selectRight.appendChild(emptyOption.cloneNode(true));

    const optgroupBigLeft = createOptgroup('1隊 - 左', bigDragonLeftMembers);
    if (optgroupBigLeft) selectLeft.appendChild(optgroupBigLeft);

    const optgroupBigRight = createOptgroup('1隊 - 右', bigDragonRightMembers);
    if (optgroupBigRight) selectRight.appendChild(optgroupBigRight);

    const optgroupSmallLeft = createOptgroup('2隊 - 左', smallDragonLeftMembers);
    if (optgroupSmallLeft) selectLeft.appendChild(optgroupSmallLeft);

    const optgroupSmallRight = createOptgroup('2隊 - 右', smallDragonRightMembers);
    if (optgroupSmallRight) selectRight.appendChild(optgroupSmallRight);

    const optgroupUncategorizedLeft = createOptgroup('未分類', uncategorizedMembers);
    if (optgroupUncategorizedLeft) selectLeft.appendChild(optgroupUncategorizedLeft);

    const optgroupUncategorizedRight = createOptgroup('未分類', uncategorizedMembers);
    if (optgroupUncategorizedRight) selectRight.appendChild(optgroupUncategorizedRight);

    const optgroupOthersLeft = createOptgroup('未登記出席', allAbsentMembers);
    if (optgroupOthersLeft) selectLeft.appendChild(optgroupOthersLeft);

    const optgroupOthersRight = createOptgroup('未登記出席', allAbsentMembers);
    if (optgroupOthersRight) selectRight.appendChild(optgroupOthersRight);

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

    const optgroupPresent = createOptgroup('今日出席', allPresentMembers);
    if (optgroupPresent) selectHelmsman.appendChild(optgroupPresent);

    const optgroupAbsent = createOptgroup('未登記出席', allAbsentMembers);
    if (optgroupAbsent) selectHelmsman.appendChild(optgroupAbsent);

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

// 新增功能：更新 available_names
async function updateAvailableNames() {
    try {
        const response = await fetch('/api/current_members');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const allMembers = data.members;
        const availableNames = allMembers.map(member => member.name);

        // 假設你有一個函數來更新選單選項
        updateSelectOptions(availableNames);
    } catch (error) {
        console.error('Error updating available names:', error);
        alert('Error updating available names: ' + error.message);
    }
}

// 修改：當按下「Add Member」時調用更新 available_names 的函數
document.getElementById('addMemberButton').addEventListener('click', async () => {
    // 這裡假設你有方法來添加成員到後端
    await addMember();
    await updateAvailableNames(); // 添加成員後更新 available_names
});

// 新增方法：更新選單選項
function updateSelectOptions(names) {
    // 假設你有一個方法來更新 select 元素的選項
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = ''; // 清空現有選項

        const emptyOption = document.createElement('option');
        emptyOption.text = '';
        emptyOption.value = '';
        select.appendChild(emptyOption);

        names.forEach(name => {
            const option = document.createElement('option');
            option.text = name;
            option.value = name;
            select.appendChild(option);
        });

        select.value = currentValue; // 保留先前選中的值
    });

    disableSelectedOptions(); // 更新後禁用已選擇的選項
}

