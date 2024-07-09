let isEdited = false;

document.addEventListener("DOMContentLoaded", () => {
    fetchMembers();

    document.getElementById('memberTableBody').addEventListener('input', () => {
        isEdited = true;
        document.getElementById('updateMembersButton').disabled = false;
    });

    window.addEventListener('beforeunload', (event) => {
        if (isEdited) {
            event.preventDefault();
            event.returnValue = '';
        }
    });
});

async function fetchMembers() {
    showLoading();
    try {
        const response = await fetch('/api/current_members');
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        const memberTableBody = document.getElementById('memberTableBody');
        memberTableBody.innerHTML = '';
        data.members.forEach((member, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="編號">${index + 1}</td>
                <td data-label="名稱"><input type="text" class="form-control" value="${member.name}" readonly></td>
                <td data-label="側別">
                    <select class="form-select">
                        <option value="Left" ${member.side === 'Left' ? 'selected' : ''}>Left</option>
                        <option value="Right" ${member.side === 'Right' ? 'selected' : ''}>Right</option>
                    </select>
                </td>
                <td data-label="體重"><input type="number" class="form-control" value="${member.weight}"></td>
                <td data-label="分類">
                    <select class="form-select">
                        <option value="none" ${member.category === 'none' ? 'selected' : ''}> </option>
                        <option value="大混" ${member.category === '大混' ? 'selected' : ''}>大混</option>
                        <option value="小混" ${member.category === '小混' ? 'selected' : ''}>小混</option>
                    </select>
                </td>
                <td data-label="操作"><button class="btn btn-danger" onclick="deleteMember(this, '${member.name}')">刪除</button></td>
            `;
            memberTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        alert('Error fetching members: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function addNewMemberRow() {
    try {
        const response = await fetch('/api/attendance');
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        const allMembers = data.names;

        const memberTableBody = document.getElementById('memberTableBody');
        const existingMembers = Array.from(memberTableBody.querySelectorAll('input[type="text"]')).map(input => input.value);
        const availableMembers = allMembers.filter(name => !existingMembers.includes(name));

        if (availableMembers.length === 0) {
            alert('所有成員都已添加。');
            return;
        }

        const row = document.createElement('tr');
        const rowCount = memberTableBody.rows.length;

        row.innerHTML = `
            <td data-label="編號">${rowCount + 1}</td>
            <td data-label="名稱">
                <select class="form-select">
                    ${availableMembers.map(name => `<option value="${name}">${name}</option>`).join('')}
                </select>
            </td>
            <td data-label="側別">
                <select class="form-select">
                    <option value="Left">Left</option>
                    <option value="Right">Right</option>
                </select>
            </td>
            <td data-label="體重"><input type="number" class="form-control"></td>
            <td data-label="分類">
                <select class="form-select">
                    <option value="大混">大混</option>
                    <option value="小混">小混</option>
                    <option value="未分類"> </option>
                </select>
            </td>
            <td data-label="操作"><button class="btn btn-danger" onclick="deleteMember(this)">刪除</button></td>
        `;
        memberTableBody.appendChild(row);
        isEdited = true;
        document.getElementById('updateMembersButton').disabled = false;
    } catch (error) {
        console.error('Error adding new member row:', error);
        alert('Error adding new member row: ' + error.message);
    }
}

async function addNewMember(event) {
    event.preventDefault();

    const name = document.getElementById('newMemberName').value;
    const side = document.getElementById('newMemberSide').value;
    const weight = document.getElementById('newMemberWeight').value;
    const category = document.getElementById('newMemberCategory').value;

    const newMember = { name, side, weight, category };

    showLoading();
    try {
        const response = await fetch('/api/add_member', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newMember)
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        alert(data.message);
        fetchMembers();
    } catch (error) {
        console.error('Error adding new member:', error);
        alert('Error adding new member: ' + error.message);
    } finally {
        hideLoading();
        document.getElementById('newMemberForm').reset();
    }
}

function deleteMember(button, name = null) {
    const row = button.closest('tr');
    row.remove();
    if (name) {
        fetch(`/api/delete_member?name=${name}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                alert(data.message);
            })
            .catch(error => {
                console.error('Error deleting member:', error);
                alert('Error deleting member: ' + error.message);
            });
    }
    updateRowNumbers();
    isEdited = true;
    document.getElementById('updateMembersButton').disabled = false;
}

function updateRowNumbers() {
    const memberTableBody = document.getElementById('memberTableBody');
    const rows = memberTableBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.cells[0].innerText = index + 1;
    });
}

async function updateMembers() {
    const memberTableBody = document.getElementById('memberTableBody');
    const rows = memberTableBody.querySelectorAll('tr');
    const members = [];
    rows.forEach(row => {
        const name = row.cells[1].querySelector('select') ? row.cells[1].querySelector('select').value : row.cells[1].querySelector('input').value;
        const side = row.cells[2].querySelector('select').value;
        const weight = row.cells[3].querySelector('input').value;
        const category = row.cells[4].querySelector('select').value;
        members.push({ name, side, weight, category });
    });

    showLoading();
    try {
        const response = await fetch('/api/update_members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(members)
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        alert(data.message);
        isEdited = false;
        document.getElementById('updateMembersButton').disabled = true;
        fetchMembers();
    } catch (error) {
        console.error('Error updating members:', error);
        alert('Error updating members: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function clearDatabase() {
    if (isEdited && !confirm("您有未保存的更改。是否繼續並清除資料庫？")) {
        return;
    }
    if (!confirm("確定要清除資料庫嗎？")) {
        return;
    }
    showLoading();
    try {
        const response = await fetch('/api/clear_database', { method: 'DELETE' });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        alert(data.message);
        fetchMembers();
    } catch (error) {
        console.error('Error clearing database:', error);
        alert('Error clearing database: ' + error.message);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}