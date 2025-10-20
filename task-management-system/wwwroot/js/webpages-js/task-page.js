﻿// Task Page JavaScript - Fully Dynamic Task Management

document.addEventListener('DOMContentLoaded', function() {
    initializeTaskPage();
});

function initializeTaskPage() {
    // Get modal elements
    const newTaskBtn = document.getElementById('newTaskBtn');
    const taskModalOverlay = document.getElementById('taskModalOverlay');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const createTaskForm = document.getElementById('createTaskForm');
    const taskProjectSelect = document.getElementById('taskProject');
    
    // Initialize filter buttons
    initializeFilters();
    
    // Handle project select change
    if (taskProjectSelect) {
        taskProjectSelect.addEventListener('change', function() {
            const customInput = document.getElementById('taskProjectCustom');
            if (this.value === '__new__') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        });
    }
    
    // Open modal when clicking new task button
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', function() {
            openTaskModal();
        });
    }
    
    // Close modal when clicking cancel
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', function() {
            closeTaskModal();
        });
    }
    
    // Close modal when clicking outside
    if (taskModalOverlay) {
        taskModalOverlay.addEventListener('click', function(e) {
            if (e.target === taskModalOverlay) {
                closeTaskModal();
            }
        });
    }
    
    // Handle form submission
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateTask();
        });
    }
}

function initializeFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter type
            const filter = this.getAttribute('data-filter');
            
            // Filter tasks
            filterTasks(filter);
        });
    });
}

function filterTasks(filter) {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(task => {
        const status = task.getAttribute('data-status');
        
        if (filter === 'all') {
            task.style.display = 'flex';
        } else if (filter === 'completed') {
            task.style.display = status === 'completed' ? 'flex' : 'none';
        } else if (filter === 'in-progress') {
            task.style.display = status === 'inprogress' ? 'flex' : 'none';
        } else if (filter === 'pending') {
            task.style.display = status === 'pending' ? 'flex' : 'none';
        }
    });
}

async function loadProjectsForDropdown() {
    try {
        // Fetch projects from the server
        const response = await fetch('/Projects/GetUserProjects');
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.projects) {
                const selectElement = document.getElementById('taskProject');
                if (selectElement) {
                    // Save current selection
                    const currentValue = selectElement.value;
                    
                    // Clear existing options except the first two (empty and Project 1)
                    selectElement.innerHTML = '';
                    
                    // Add default options
                    const emptyOption = document.createElement('option');
                    emptyOption.value = '';
                    emptyOption.textContent = '-- Select or Create Project --';
                    selectElement.appendChild(emptyOption);
                    
                    const defaultOption = document.createElement('option');
                    defaultOption.value = 'Project 1';
                    defaultOption.textContent = 'Project 1';
                    defaultOption.selected = true;
                    selectElement.appendChild(defaultOption);
                    
                    // Add user's projects
                    result.projects.forEach(project => {
                        // Skip if it's already "Project 1" to avoid duplicates
                        if (project.name !== 'Project 1') {
                            const option = document.createElement('option');
                            option.value = project.name;
                            option.textContent = project.name;
                            selectElement.appendChild(option);
                        }
                    });
                    
                    // Add "Create New" option
                    const newOption = document.createElement('option');
                    newOption.value = '__new__';
                    newOption.textContent = '+ Create New Project...';
                    selectElement.appendChild(newOption);
                    
                    // Restore selection if it still exists
                    if (currentValue && Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
                        selectElement.value = currentValue;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function openTaskModal() {
    const taskModalOverlay = document.getElementById('taskModalOverlay');
    const taskProjectSelect = document.getElementById('taskProject');
    const taskProjectCustom = document.getElementById('taskProjectCustom');
    const form = document.getElementById('createTaskForm');
    
    if (taskModalOverlay) {
        taskModalOverlay.classList.add('show');
        document.body.classList.add('modal-open');
    }
    
    // Reset modal to create mode if not already in edit mode
    if (form && form.dataset.mode !== 'edit') {
        document.querySelector('.yeloe-modal-title').textContent = 'Create New Task';
        document.querySelector('.yeloe-modal-subtitle').textContent = 'Add a new task to your workflow';
        document.getElementById('createTaskBtn').innerHTML = '<i class="fas fa-plus"></i><span>Create Task</span>';
        delete form.dataset.taskId;
        delete form.dataset.mode;
    }
    
    // Load fresh project list
    loadProjectsForDropdown();
    
    // Reset custom input
    if (taskProjectCustom) {
        taskProjectCustom.style.display = 'none';
        taskProjectCustom.value = '';
    }
    
    // Set default project to "Project 1" only if not in edit mode
    if (taskProjectSelect && form.dataset.mode !== 'edit') {
        taskProjectSelect.value = 'Project 1';
    }
}

function closeTaskModal() {
    const taskModalOverlay = document.getElementById('taskModalOverlay');
    const createTaskForm = document.getElementById('createTaskForm');
    
    if (taskModalOverlay) {
        taskModalOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
    
    // Reset form
    if (createTaskForm) {
        createTaskForm.reset();
        clearErrors();
        
        // Clear edit mode
        delete createTaskForm.dataset.taskId;
        delete createTaskForm.dataset.mode;
        
        // Reset modal appearance
        document.querySelector('.yeloe-modal-title').textContent = 'Create New Task';
        document.querySelector('.yeloe-modal-subtitle').textContent = 'Add a new task to your workflow';
        document.getElementById('createTaskBtn').innerHTML = '<i class="fas fa-plus"></i><span>Create Task</span>';
    }
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
}

async function handleCreateTask() {
    const createTaskBtn = document.getElementById('createTaskBtn');
    const form = document.getElementById('createTaskForm');
    
    // Check if we're in edit mode
    const isEditMode = form.dataset.mode === 'edit';
    const taskId = form.dataset.taskId;
    
    // Clear previous errors
    clearErrors();
    
    // Get form data
    const priorityValue = document.getElementById('taskPriority').value;
    const projectSelect = document.getElementById('taskProject');
    const projectCustomInput = document.getElementById('taskProjectCustom');
    
    // Get project value - use custom input if "Create New" is selected
    let projectValue = projectSelect.value;
    if (projectValue === '__new__') {
        projectValue = projectCustomInput.value.trim();
        if (!projectValue) {
            showError('titleError', 'Please enter a project name');
            return;
        }
    }
    
    // Convert priority string to enum integer
    // Low = 0, Medium = 1, High = 2
    let priorityInt = 1; // Default to Medium
    if (priorityValue === 'Low') priorityInt = 0;
    else if (priorityValue === 'Medium') priorityInt = 1;
    else if (priorityValue === 'High') priorityInt = 2;
    
    const formData = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        project: projectValue,
        dueDate: document.getElementById('taskDueDate').value || null,
        priority: priorityInt // Send as integer (0, 1, 2)
    };
    
    // Add taskId if in edit mode
    if (isEditMode && taskId) {
        formData.taskId = taskId;
    }
    
    // Basic validation
    if (!formData.title) {
        showError('titleError', 'Task title is required');
        return;
    }
    
    // Show loading state
    setButtonLoading(createTaskBtn, true, isEditMode);
    
    try {
        const url = isEditMode ? window.taskUrls.updateUrl : window.taskUrls.createUrl;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success notification
            showNotification('Success!', result.message, 'success');
            
            // Close modal
            closeTaskModal();
            
            // Reload page to show updated/new task
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            // Show error notification
            showNotification('Error', result.message || `Failed to ${isEditMode ? 'update' : 'create'} task`, 'error');
            
            // Show field errors if any
            if (result.errors && Array.isArray(result.errors)) {
                result.errors.forEach(error => {
                    showError('titleError', error);
                });
            }
        }
    } catch (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} task:`, error);
        showNotification('Error', 'An unexpected error occurred. Please try again.', 'error');
    } finally {
        setButtonLoading(createTaskBtn, false, isEditMode);
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function setButtonLoading(button, isLoading, isEditMode = false) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('task-modal-btn-loading');
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }
    } else {
        button.disabled = false;
        button.classList.remove('task-modal-btn-loading');
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = isEditMode ? 'fas fa-save' : 'fas fa-plus';
        }
    }
}

// Toggle task completion
async function toggleTaskComplete(taskId) {
    try {
        const response = await fetch(window.taskUrls.completeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId: taskId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Success!', result.message, 'success');
            
            // Update task item visually
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            if (taskItem) {
                const taskContent = taskItem.querySelector('.task-content');
                const checkbox = taskItem.querySelector('input[type="checkbox"]');
                
                if (checkbox.checked) {
                    taskContent.classList.add('completed');
                    taskItem.setAttribute('data-status', 'completed');
                } else {
                    taskContent.classList.remove('completed');
                    taskItem.setAttribute('data-status', 'pending');
                }
            }
        } else {
            showNotification('Error', result.message || 'Failed to update task', 'error');
            // Revert checkbox state
            const checkbox = document.getElementById(`task-${taskId}`);
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
            }
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showNotification('Error', 'An unexpected error occurred', 'error');
        // Revert checkbox state
        const checkbox = document.getElementById(`task-${taskId}`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
        }
    }
}

// Delete task
async function deleteTask(taskId) {
    // Show confirmation dialog
    const confirmed = await showConfirmDialog(
        'Delete Task',
        'Are you sure you want to delete this task? This action cannot be undone.',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(window.taskUrls.deleteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId: taskId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Success!', result.message, 'success');
            
            // Remove task item from DOM with animation
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            if (taskItem) {
                taskItem.style.opacity = '0';
                taskItem.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    taskItem.remove();
                    
                    // Check if there are no more tasks
                    const remainingTasks = document.querySelectorAll('.task-item');
                    if (remainingTasks.length === 0) {
                        showEmptyState();
                    }
                }, 300);
            }
        } else {
            showNotification('Error', result.message || 'Failed to delete task', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error', 'An unexpected error occurred', 'error');
    }
}

// Edit task - Load task data and open modal in edit mode
async function editTask(taskId) {
    try {
        // Fetch task details
        const response = await fetch(`${window.taskUrls.getTaskUrl}?id=${taskId}`);
        const result = await response.json();

        if (!result.success) {
            showNotification('Error', result.message || 'Failed to load task', 'error');
            return;
        }

        const task = result.task;

        // Populate the form with task data
        document.getElementById('taskTitle').value = task.title || '';
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskDueDate').value = task.dueDate || '';
        document.getElementById('taskPriority').value = task.priority || 'Medium';

        // Handle project selection
        const projectSelect = document.getElementById('taskProject');
        const projectOptions = Array.from(projectSelect.options).map(opt => opt.value);
        
        if (task.project && projectOptions.includes(task.project)) {
            projectSelect.value = task.project;
        } else if (task.project) {
            // Project exists but not in dropdown - add it temporarily
            const option = document.createElement('option');
            option.value = task.project;
            option.textContent = task.project;
            option.selected = true;
            projectSelect.insertBefore(option, projectSelect.lastElementChild);
        }

        // Change modal title and button text
        document.querySelector('.yeloe-modal-title').textContent = 'Edit Task';
        document.querySelector('.yeloe-modal-subtitle').textContent = 'Update task details';
        document.getElementById('createTaskBtn').innerHTML = '<i class="fas fa-save"></i><span>Update Task</span>';

        // Store task ID in form for update
        document.getElementById('createTaskForm').dataset.taskId = taskId;
        document.getElementById('createTaskForm').dataset.mode = 'edit';

        // Open modal
        openTaskModal();

    } catch (error) {
        console.error('Error loading task:', error);
        showNotification('Error', 'Failed to load task details', 'error');
    }
}

// Show empty state
function showEmptyState() {
    const tasksContainer = document.getElementById('tasksContainer');
    if (tasksContainer) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks empty-icon"></i>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started with managing your work.</p>
            </div>
        `;
    }
}

// Notification system
function showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        animation: slideIn 0.3s ease;
    `;
    
    // Set icon based on type
    let icon = 'fa-info-circle';
    let iconColor = '#2196F3';
    
    if (type === 'success') {
        icon = 'fa-check-circle';
        iconColor = '#4CAF50';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
        iconColor = '#F44336';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-triangle';
        iconColor = '#FF9800';
    }
    
    notification.innerHTML = `
        <div style="display: flex; align-items: start; gap: 1rem;">
            <i class="fas ${icon}" style="color: ${iconColor}; font-size: 1.5rem; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 0.25rem 0; font-weight: 600; color: #333;">${title}</h4>
                <p style="margin: 0; color: #666; font-size: 0.9rem;">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem; padding: 0; line-height: 1;">
                ×
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Confirmation dialog
function showConfirmDialog(title, message, confirmText, cancelText) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'notification-modal-overlay show';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;
        
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fas fa-exclamation-triangle" style="color: #FF9800; font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3 style="margin: 0 0 0.5rem 0; color: #333; font-weight: 600;">${title}</h3>
                <p style="margin: 0; color: #666;">${message}</p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="cancel-btn" style="
                    padding: 0.75rem 1.5rem;
                    border: 2px solid #ddd;
                    background: white;
                    color: #333;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">${cancelText}</button>
                <button class="confirm-btn" style="
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                    color: white;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">${confirmText}</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Handle buttons
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.toggleTaskComplete = toggleTaskComplete;
window.deleteTask = deleteTask;
window.editTask = editTask;
