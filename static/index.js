let currentDate = null;

console.log("index.js 加載成功");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM 加載完成");
    populateDates().then(getAttendance);
});

// 函數定義：onDateChange
function onDateChange() {
    const selectDate = document.getElementById('selectDate').value;
    if (selectDate !== currentDate) {
        getAttendance();
    }
}

// 函數定義：populateDates
async function populateDates() {
    try {
        const response = await fetch('/api/attendance');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const selectDate = document.getElementById('selectDate');
        selectDate.innerHTML = ''; // 清空下拉選單
        data.dates.forEach(date => {
            const option = document.createElement('option');
            option.text = date;
            option.value = date;
            selectDate.appendChild(option);
        });
        selectDate.addEventListener('change', onDateChange); // 監聽日期變更事件
    } catch (error) {
        console.error('Error populating dates:', error);
        alert('Error populating dates: ' + error.message);
    }
}

// 函數定義：getAttendance
async function getAttendance() {
    console.log("getAttendance 函數被調用");
    document.getElementById('loading').style.display = 'block'; // 顯示 loading
    const selectDate = document.getElementById('selectDate').value;
    console.log("選擇的日期:", selectDate);
    saveState(currentDate); // 保存當前狀態
    currentDate = selectDate;

    try {
        const response = await fetch('/api/attendance');
        const data = await response.json();
        console.log("API 回應數據:", data);

        if (data.error) {
            throw new Error(data.error);
        }

        const dates = data.dates;
        const index = dates.indexOf(selectDate);
        const names = data.names;
        const attendance = data.attendance[index];

        const attendanceList = document.getElementById('attendanceList');
        attendanceList.innerHTML = ''; // 清空之前的出席名單

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        names.forEach((name, i) => {
            if (attendance[i] === '○') {
                const cardCol = document.createElement('div');
                cardCol.className = 'col-6 col-md-2'; // Bootstrap 样式
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

        // 過濾成員並打印調試信息
        const allPresentMembers = allMembers.filter(member => attendance[names.indexOf(member.name)] === '○');
        const allAbsentMembers = allMembers.filter(member => attendance[names.indexOf(member.name)] !== '○');


        populateSpecialOptions('left_0', 'right_0', allPresentMembers, allAbsentMembers);
        for (let i = 1; i <= 12; i++) {
            populateOptions('left_' + i, 'right_' + i, allPresentMembers, allAbsentMembers);
        }
        populateHelmsmanOptions('left_helmsman', allPresentMembers, allAbsentMembers);
        document.getElementById('bigDragonDate').textContent = `(${selectDate})`;

        loadState(selectDate); // 加載狀態
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        alert('Error fetching attendance data: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none'; // 隱藏 loading
    }
}

// 函數定義：populateSpecialOptions
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

    // 創建「今日出席」選項組
    const optgroupPresentLeft = createOptgroup('今日出席', allPresentMembers);
    if (optgroupPresentLeft) selectLeft.appendChild(optgroupPresentLeft);

    // 創建「未登記出席」選項組
    const optgroupAbsentLeft = createOptgroup('未登記出席', allAbsentMembers);
    if (optgroupAbsentLeft) selectLeft.appendChild(optgroupAbsentLeft);

    // 對右側選單進行相同的操作
    const optgroupPresentRight = createOptgroup('今日出席', allPresentMembers);
    if (optgroupPresentRight) selectRight.appendChild(optgroupPresentRight);

    const optgroupAbsentRight = createOptgroup('未登記出席', allAbsentMembers);
    if (optgroupAbsentRight) selectRight.appendChild(optgroupAbsentRight);

    selectLeft.addEventListener('change', disableSelectedOptions);
    selectRight.addEventListener('change', disableSelectedOptions);
}

// 確保 createOptgroup 函數的正確性
function createOptgroup(label, members) {
    if (!members || !Array.isArray(members)) {
        console.warn(`members is either undefined or not an array: ${members}`);
        return null; // 返回 null，以避免後續錯誤
    }
    if (members.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = label;
        members.forEach(member => {
            const option = document.createElement('option');
            option.text = member.name;
            option.value = member.name;
            option.dataset.weight = member.weight; // 根據需要保留數據屬性
            optgroup.appendChild(option);
        });
        return optgroup;
    }
    return null; // 如果 members 是空的，返回 null
}

// 函數定義：populateOptions
function populateOptions(leftId, rightId, allPresentMembers, allAbsentMembers) {
    const selectLeft = document.getElementById(leftId);
    const selectRight = document.getElementById(rightId);
    selectLeft.innerHTML = '';
    selectRight.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.text = '';
    emptyOption.value = '';
    selectLeft.appendChild(emptyOption.cloneNode(true));
    selectRight.appendChild(emptyOption.cloneNode(true));

    // 這裡只添加今日出席和未登記出席的選項
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
}

// 函數定義：populateHelmsmanOptions
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

// 函數定義：disableSelectedOptions
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
                option.disabled = true; // 禁用已選擇的選項
            } else {
                option.disabled = false; // 重新啟用未選擇的選項
            }
        }
    });
}

// 函數定義：calculateWeights
function calculateWeights() {
    let leftWeight = 0;
    let rightWeight = 0;

    const bigDragonLeftSelects = document.querySelectorAll('#bigDragonTableContainer select[id^="left_"]');
    const bigDragonRightSelects = document.querySelectorAll('#bigDragonTableContainer select[id^="right_"]');

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

    document.getElementById('leftWeight').textContent = leftWeight.toFixed(2);
    document.getElementById('rightWeight').textContent = rightWeight.toFixed(2);
}

// 函數定義：saveState
function saveState(date) {
    if (!date) return;
    const state = {
        left: {},
        right: {},
        helmsman: {}
    };
    
    for (let i = 0; i <= 12; i++) {
        const leftSelect = document.getElementById(`left_${i}`);
        const rightSelect = document.getElementById(`right_${i}`);

        // 檢查元素是否存在
        if (leftSelect) {
            state.left[`left_${i}`] = leftSelect.value;
        }

        if (rightSelect) {
            state.right[`right_${i}`] = rightSelect.value;
        }
    }

    const helmsmanSelect = document.getElementById('left_helmsman');
    if (helmsmanSelect) {
        state.helmsman['left_helmsman'] = helmsmanSelect.value;
    }

    localStorage.setItem(date, JSON.stringify(state)); // 將狀態存儲到 localStorage
}

// 函數定義：loadState
function loadState(date) {
    const state = JSON.parse(localStorage.getItem(date));
    if (!state) return;
    for (let i = 0; i <= 12; i++) {
        const leftSelect = document.getElementById(`left_${i}`);
        const rightSelect = document.getElementById(`right_${i}`);

        if (leftSelect) {
            leftSelect.value = state.left[`left_${i}`] || '';
        }
        
        if (rightSelect) {
            rightSelect.value = state.right[`right_${i}`] || '';
        }
    }
    const helmsmanSelect = document.getElementById('left_helmsman');
    if (helmsmanSelect) {
        helmsmanSelect.value = state.helmsman['left_helmsman'] || '';
    }

    calculateWeights(); // 計算總重量
    disableSelectedOptions(); // 確保在加載狀態時禁用選項
}

// 函數定義：clearTable
function clearTable(containerId) {
    if (confirm("確定要清空目前的名單嗎？")) {
        const container = document.getElementById(containerId);
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.value = '';
        });
        calculateWeights(); // 重新計算重量
        disableSelectedOptions(); // 重新禁用已選擇的選項
    }
}

// 函數定義：exportTableToImage
function exportTableToImage(tableId, dragonType) {
    const tableContainer = document.getElementById(tableId);
    let selectDate = document.getElementById('selectDate').value;
    selectDate = selectDate.split('(')[0].replace(/\//g, '_').replace(/\)/g, '');
    const filename = `${selectDate}_${dragonType}.png`;
    html2canvas(tableContainer).then(canvas => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click(); // 觸發下載
    });
}

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

        updateSelectOptions(availableNames); // 更新選單選項
    } catch (error) {
        console.error('Error updating available names:', error);
        alert('Error updating available names: ' + error.message);
    }
}

// 事件監聽器：添加成員按鈕
document.getElementById('addMemberButton').addEventListener('click', async () => {
    await addMember(); // 假設這裡有方法來添加成員到後端
    await updateAvailableNames(); // 更新可用成員名單
});

// 新增方法：更新選單選項
function updateSelectOptions(names) {
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

// 開始執行
populateDates().then(getAttendance);

