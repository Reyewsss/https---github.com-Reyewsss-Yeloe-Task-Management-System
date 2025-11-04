// Task Status Management - CLEAN VERSION
let statusLabels = [];

// Constants
const COMPLETED_COLOR = '#28a745';
const DEFAULT_COLORS = ['#dc3545', '#6f42c1', '#fd7e14'];

// Utility function to check if status is completed
function isCompletedStatus(name) {
    const lowerName = name.toLowerCase();
    return lowerName.includes('complete') || lowerName.includes('done');
}

// Utility function to get color for status (auto-detects completed)
function getStatusColor(name, defaultColor = null) {
    return isCompletedStatus(name) ? COMPLETED_COLOR : (defaultColor || getRandomColor());
}

function getRandomColor() {
    return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

document.addEventListener('DOMContentLoaded', function () {
    initializeStatusSystem();
    loadStatusLabels();
    initializeHandlers();
});

async function initializeStatusSystem() {
    try {
        await fetch(window.statusUrls.initializeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error initializing status system:', error);
    }
}

async function loadStatusLabels() {
    try {
        const response = await fetch(window.statusUrls.getLabelsUrl);
        if (response.ok) {
            statusLabels = await response.json();
            renderStatusFilters();
            populateStatusDropdowns();
            if (document.getElementById('statusLabelsList')) {
                renderStatusLabelsList();
            }
        }
    } catch (error) {
        console.error('Error loading status labels:', error);
    }
}

function renderStatusFilters() {
    const container = document.getElementById('statusFiltersContainer');
    if (!container) return;

    container.innerHTML = statusLabels.map(label => {
        const labelColor = getStatusColor(label.labelName, label.labelColor);
        return `
        <button class="filter-btn" data-filter="${label.statusLabelId}";">
            <span class="status-dot" style="background-color: ${labelColor};"></span>
            ${label.labelName}
        </button>
        `;
    }).join('');

    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tasks-filters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterTasksByStatus(this.dataset.filter);
        });
    });
}

function populateStatusDropdowns() {
    const dropdowns = document.querySelectorAll('.status-dropdown');
    dropdowns.forEach(dropdown => {
        const taskId = dropdown.dataset.taskId;
        const currentTask = document.querySelector(`[data-id="${taskId}"]`);
        const currentStatus = currentTask?.dataset.status;

        dropdown.innerHTML = statusLabels.map(label => `
                <option value="${label.statusLabelId}" ${label.statusLabelId === currentStatus ? 'selected' : ''}>
                    ${label.labelName}
                </option>
            `).join('');
    });
}

function filterTasksByStatus(statusId) {
    const tasks = document.querySelectorAll('.task-item');
    tasks.forEach(task => {
        if (statusId === 'all') {
            task.style.display = 'flex';
        } else {
            task.style.display = task.dataset.status === statusId ? 'flex' : 'none';
        }
    });
}

async function updateTaskStatus(taskId, statusLabelId) {
    if (!statusLabelId) return;

    try {
        const response = await fetch(window.taskUrls.updateStatusUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, statusLabelId })
        });

        if (response.ok) {
            const taskItem = document.querySelector(`[data-id="${taskId}"]`);
            if (taskItem) {
                taskItem.dataset.status = statusLabelId;
                const statusLabel = statusLabels.find(l => l.statusLabelId === statusLabelId);
                if (statusLabel) {
                    const badge = taskItem.querySelector('.task-status-badge');
                    if (badge) {
                        const labelColor = getStatusColor(statusLabel.labelName, statusLabel.labelColor);
                        badge.style.backgroundColor = labelColor;
                        badge.querySelector('.status-display').textContent = statusLabel.labelName;
                    }
                }
            }
            showNotification('Status updated successfully', 'success');
        } else {
            showNotification('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        showNotification('Error updating status', 'error');
    }
}

// Initialize all handlers
function initializeHandlers() {
    let panelOverlay = null;
    const dropdown = document.getElementById('statusDropdownMenu');

    // Quick Add Button
    const quickAddBtn = document.getElementById('quickAddStatusBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => openQuickAddPanel());
    }

    // More Actions Dropdown
    const moreActionsBtn = document.getElementById('moreActionsBtn');
    if (moreActionsBtn && dropdown) {
        dropdown.style.display = '';
        
        moreActionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        dropdown.addEventListener('click', (e) => e.stopPropagation());
        
        document.addEventListener('click', () => dropdown.classList.remove('show'));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') dropdown.classList.remove('show');
        });
    }

    // Dropdown Menu Items
    const manageStatusLink = document.getElementById('manageStatusLink');
    if (manageStatusLink) {
        manageStatusLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (dropdown) dropdown.classList.remove('show');
            document.getElementById('manageStatusModal').style.display = 'flex';
            loadStatusLabels();
        });
    }

    const markCompleteBtn = document.getElementById('markCompleteBtn');
    if (markCompleteBtn) {
        markCompleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (dropdown) dropdown.classList.remove('show');
            await markAllTasksComplete();
        });
    }

    const resetStatusBtn = document.getElementById('resetStatusBtn');
    if (resetStatusBtn) {
        resetStatusBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (dropdown) dropdown.classList.remove('show');
            await resetToDefaultStatuses();
        });
    }

    // Panel Controls
    const closeQuickAdd = document.getElementById('closeQuickAdd');
    if (closeQuickAdd) {
        closeQuickAdd.addEventListener('click', () => closeQuickAddPanel());
    }

    const addStatusBtn = document.getElementById('addStatusBtn');
    if (addStatusBtn) {
        addStatusBtn.addEventListener('click', () => addNewStatusRow());
    }

    const finishBtn = document.getElementById('finishStatusBtn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => closeQuickAddPanel());
    }

    const closeManageStatusBtn = document.getElementById('closeManageStatusBtn');
    if (closeManageStatusBtn) {
        closeManageStatusBtn.addEventListener('click', () => {
            document.getElementById('manageStatusModal').style.display = 'none';
        });
    }

    // Functions
    function openQuickAddPanel() {
        const panel = document.getElementById('quickAddPanel');
        if (!panel) return;
        panel.style.display = 'block';
        loadStatusList();

        panelOverlay = document.createElement('div');
        panelOverlay.className = 'panel-overlay';
        panelOverlay.addEventListener('click', closeQuickAddPanel);
        document.body.appendChild(panelOverlay);
    }

    function closeQuickAddPanel() {
        const panel = document.getElementById('quickAddPanel');
        if (panel) panel.style.display = 'none';
        if (panelOverlay) {
            panelOverlay.remove();
            panelOverlay = null;
        }
        loadStatusLabels();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('quickAddPanel');
            if (panel && panel.style.display === 'block') {
                closeQuickAddPanel();
            }
        }
    });
}

// Load status list for panel
async function loadStatusList() {
    try {
        const response = await fetch(window.statusUrls.getLabelsUrl);
        if (!response.ok) return;

        const labels = await response.json();
        const statusList = document.getElementById('statusList');
        if (!statusList) return;

        statusList.innerHTML = '';
        labels.forEach(status => addStatusRow(status));
    } catch (error) {
        console.error('Error loading status list:', error);
    }
}

function addStatusRow(status) {
    const statusList = document.getElementById('statusList');
    const row = document.createElement('div');
    row.className = 'status-item';
    row.dataset.statusId = status.statusLabelId;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = status.labelName;
    input.maxLength = 30;

    input.addEventListener('blur', async function() {
        const newName = this.value.trim();
        if (newName && newName !== status.labelName) {
            await updateStatusName(status.statusLabelId, newName);
        }
    });

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') this.blur();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-status';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.addEventListener('click', async () => {
        await deleteStatus(status.statusLabelId, row);
    });

    row.appendChild(input);
    row.appendChild(deleteBtn);
    statusList.appendChild(row);
}

function addNewStatusRow() {
    const statusList = document.getElementById('statusList');
    const row = document.createElement('div');
    row.className = 'status-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter status name...';
    input.maxLength = 30;

    input.addEventListener('blur', async function() {
        const name = this.value.trim();
        if (name) {
            const success = await createStatus(name);
            if (!success) row.remove();
        } else {
            row.remove();
        }
    });

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') this.blur();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-status';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.addEventListener('click', () => row.remove());

    row.appendChild(input);
    row.appendChild(deleteBtn);
    statusList.appendChild(row);
    input.focus();
}

async function createStatus(name) {
    try {
        const response = await fetch(window.statusUrls.createLabelUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                labelName: name, 
                labelColor: getStatusColor(name)
            })
        });

        if (response.ok) {
            showNotification('Status created successfully!', 'success');
            await loadStatusList();
            return true;
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to create status', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error creating status:', error);
        showNotification('Error creating status', 'error');
        return false;
    }
}

async function updateStatusName(statusId, newName) {
    try {
        const response = await fetch(`${window.statusUrls.updateLabelUrl}/${statusId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                labelName: newName,
                labelColor: getStatusColor(newName, '#6c757d')
            })
        });

        if (response.ok) {
            showNotification('Status updated successfully!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
}

async function deleteStatus(statusId, rowElement) {
    try {
        const response = await fetch(`${window.statusUrls.deleteLabelUrl}/${statusId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Status deleted successfully!', 'success');
            rowElement.remove();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to delete status', 'error');
        }
    } catch (error) {
        console.error('Error deleting status:', error);
        showNotification('Error deleting status', 'error');
    }
}

// Manage Status Modal
document.getElementById('createStatusBtn')?.addEventListener('click', async function () {
    const nameInput = document.getElementById('newStatusName');
    const colorInput = document.getElementById('newStatusColor');
    
    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
        showNotification('Please enter a status name', 'error');
        return;
    }

    try {
        const response = await fetch(window.statusUrls.createLabelUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                labelName: name, 
                labelColor: getStatusColor(name, color)
            })
        });

        if (response.ok) {
            showNotification('Status label created successfully!', 'success');
            nameInput.value = '';
            colorInput.value = '#6c757d';
            await loadStatusLabels();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to create status label', 'error');
        }
    } catch (error) {
        console.error('Error creating status label:', error);
        showNotification('Error creating status label', 'error');
    }
});

function renderStatusLabelsList() {
    const container = document.getElementById('statusLabelsList');
    if (!container) return;

    if (statusLabels.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No status labels yet</p>';
        return;
    }

    container.innerHTML = statusLabels.map(label => {
        const labelColor = getStatusColor(label.labelName, label.labelColor);
        return `
        <div class="status-label-item" data-id="${label.statusLabelId}">
            <div class="status-label-color" style="background-color: ${labelColor};"></div>
            <div class="status-label-name">${label.labelName}</div>
            <div class="status-label-actions">
                ${!label.isDefault ? `
                    <button class="btn-icon-small edit" onclick="editStatusLabel('${label.statusLabelId}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-small delete" onclick="deleteStatusLabel('${label.statusLabelId}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span class="badge bg-secondary">Default</span>'}
            </div>
        </div>
        `;
    }).join('');
}

async function editStatusLabel(statusLabelId) {
    const label = statusLabels.find(l => l.statusLabelId === statusLabelId);
    if (!label) return;

    const newName = prompt('Enter new name:', label.labelName);
    if (!newName || newName === label.labelName) return;

    const newColor = prompt('Enter new color (hex):', label.labelColor);
    if (!newColor) return;

    try {
        const response = await fetch(`${window.statusUrls.updateLabelUrl}/${statusLabelId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                labelName: newName, 
                labelColor: getStatusColor(newName, newColor)
            })
        });

        if (response.ok) {
            showNotification('Status label updated successfully', 'success');
            await loadStatusLabels();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to update status label', 'error');
        }
    } catch (error) {
        console.error('Error updating status label:', error);
        showNotification('Error updating status label', 'error');
    }
}

async function deleteStatusLabel(statusLabelId) {
    try {
        const response = await fetch(`${window.statusUrls.deleteLabelUrl}/${statusLabelId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Status label deleted successfully', 'success');
            await loadStatusLabels();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to delete status label', 'error');
        }
    } catch (error) {
        console.error('Error deleting status label:', error);
        showNotification('Error deleting status label', 'error');
    }
}

// Dropdown Actions
async function markAllTasksComplete() {
    const tasks = document.querySelectorAll('.task-item');
    if (tasks.length === 0) {
        showNotification('No tasks to mark as complete', 'info');
        return;
    }
    
    const completeStatus = statusLabels.find(l => 
        l.labelName.toLowerCase() === 'completed' || 
        l.labelName.toLowerCase() === 'done'
    );
    
    if (!completeStatus) {
        showNotification('No "Completed" status found', 'error');
        return;
    }
    
    let count = 0;
    for (const task of tasks) {
        const taskId = task.dataset.id;
        try {
            await updateTaskStatus(taskId, completeStatus.statusLabelId);
            count++;
        } catch (error) {
            console.error('Failed to update task:', taskId);
        }
    }
    
    showNotification(`Marked ${count} task(s) as complete`, 'success');
    await loadStatusLabels();
}

async function resetToDefaultStatuses() {
    try {
        const response = await fetch(window.statusUrls.initializeUrl, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Status labels reset to default', 'success');
            await loadStatusLabels();
        } else {
            showNotification('Failed to reset status labels', 'error');
        }
    } catch (error) {
        console.error('Error resetting statuses:', error);
        showNotification('Error resetting status labels', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}