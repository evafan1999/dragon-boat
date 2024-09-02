document.addEventListener('DOMContentLoaded', function() {
    const memberForm = document.getElementById('memberForm');
    const membersTableBody = document.getElementById('membersTableBody');
    const pagination = document.getElementById('pagination');
    const nameSelect = document.getElementById('name');
    const sideSelect = document.getElementById('side');
    const pageSize = 15;
    let currentPage = 1;

    // Function to fetch and display names from scrape_data
    async function loadNames() {
        try {
            const response = await fetch('/api/available_names');
            if (!response.ok) throw new Error('Failed to fetch names');
            const names = await response.json();
            populateNameDropdown(names);
        } catch (error) {
            console.error('Error loading names:', error);
        }
    }

    // Function to populate name dropdown with available names
    function populateNameDropdown(names) {
        nameSelect.innerHTML = ''; // Clear existing options
        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            nameSelect.appendChild(option);
        });
    }

    // Function to fetch and display current members
    async function loadMembers(page = 1) {
        try {
            const response = await fetch(`/api/current_members?page=${page}&size=${pageSize}`);
            if (!response.ok) throw new Error('Failed to fetch members');
            const data = await response.json();
            updateTable(data.members);
            updatePagination(data.total_pages, page);
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }

    // Function to update table with members data
    function updateTable(members) {
        membersTableBody.innerHTML = ''; // Clear existing rows
        members.forEach((member, index) => {
            const row = document.createElement('tr');
            row.dataset.name = member.name; // Store name in data attribute
            row.innerHTML = `
                <td>${index + 1}</td> <!-- Add numbering here -->
                <td>${member.name}</td>
                <td>
                    ${member.isEditing
                        ? `<select class="form-select">
                            <option value="Left" ${member.side === 'Left' ? 'selected' : ''}>左</option>
                            <option value="Right" ${member.side === 'Right' ? 'selected' : ''}>右</option>
                            <option value="none" ${member.side === 'none' ? 'selected' : ''}>未定</option>
                          </select>`
                        : member.side
                    }
                </td>
                <td>${member.weight}</td>
                <td>${member.category}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editMember(this)">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMember('${member.name}')">Delete</button>
                </td>
            `;
            membersTableBody.appendChild(row);
        });
    }

    // Function to update pagination controls
    function updatePagination(totalPages, currentPage) {
        pagination.innerHTML = ''; // Clear existing pagination
        for (let page = 1; page <= totalPages; page++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${page === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#">${page}</a>`;
            pageItem.addEventListener('click', function(event) {
                event.preventDefault();
                loadMembers(page);
            });
            pagination.appendChild(pageItem);
        }
    }

    // Function to handle form submission
    memberForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const side = document.getElementById('side').value;
        const weight = parseFloat(document.getElementById('weight').value);
        const category = document.getElementById('category').value;

        const newMember = { name, side, weight, category };
        try {
            const response = await fetch('/api/add_member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMember),
            });
            if (!response.ok) throw new Error('Failed to add member');
            alert('Member added successfully');
            loadMembers(currentPage); // Refresh the list
            loadNames(); // Refresh the name dropdown
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member');
        }
    });

    // Function to edit a member row
    window.editMember = function(button) {
        const row = button.closest('tr');
        const name = row.dataset.name;
        const isEditing = button.textContent === 'Edit';
    
        if (isEditing) {
            // Enter editing mode
            button.textContent = 'Save';
            button.className = 'btn btn-success btn-sm'; // Change button class to success
            row.querySelectorAll('td').forEach((td, index) => {
                if (index === 2) { // Side column
                    td.innerHTML = `
                        <select class="form-select">
                            <option value="Left" ${td.textContent === 'Left' ? 'selected' : ''}>左</option>
                            <option value="Right" ${td.textContent === 'Right' ? 'selected' : ''}>右</option>
                            <option value="none" ${td.textContent === 'none' ? 'selected' : ''}>未定</option>
                        </select>
                    `;
                }
            });
        } else {
            // Save changes
            const side = row.querySelector('select').value;
            const weight = parseFloat(row.querySelector('td:nth-child(3)').textContent);
            const category = row.querySelector('td:nth-child(4)').textContent;
    
            const updatedMember = {
                name,
                side,
                weight,
                category
            };
    
            fetch(`/api/update_members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([updatedMember]),
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to update member');
                alert('Member updated successfully');
                loadMembers(); // Refresh the list
            })
            .catch(error => {
                console.error('Error updating member:', error);
                alert('Failed to update member');
            });
        }
    };

    // Function to delete a member
    window.deleteMember = function(name) {
        fetch(`/api/delete_member?name=${name}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete member');
            alert('Member deleted successfully');
            loadMembers(); // Refresh the list
        })
        .catch(error => {
            console.error('Error deleting member:', error);
            alert('Failed to delete member');
        });
    };

    // Initial load
    loadNames();
    loadMembers(currentPage);
});
