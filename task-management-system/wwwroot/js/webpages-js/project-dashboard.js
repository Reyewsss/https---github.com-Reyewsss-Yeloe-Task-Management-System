// Project Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeInvitationModal();
    initializeGanttChart();
});

function initializeDashboard() {
    // Tab navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Initialize Gantt chart when tab is opened
            if (tabName === 'gantt') {
                setTimeout(() => initializeGanttChart(), 100);
            }
            
            // Refresh team members when team tab is opened
            if (tabName === 'team') {
                setTimeout(() => refreshTeamMembers(), 100);
            }
        });
    });

    // Initialize task checkboxes
    initializeTaskCheckboxes();

    // Initialize Kanban drag and drop
    initializeKanban();
    
    // Initialize refresh members button
    initializeRefreshMembersButton();
}

function initializeRefreshMembersButton() {
    const refreshBtn = document.getElementById('refreshMembersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            icon.classList.add('fa-spin');
            this.disabled = true;
            
            await refreshTeamMembers();
            
            icon.classList.remove('fa-spin');
            this.disabled = false;
        });
    }
}

function initializeTaskCheckboxes() {
    const checkboxes = document.querySelectorAll('.task-checkbox input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            const taskItem = this.closest('.task-list-item');
            const taskId = taskItem.getAttribute('data-id');
            
            if (taskId) {
                await toggleTaskComplete(taskId, this.checked);
            }
        });
    });
}

async function toggleTaskComplete(taskId, isChecked) {
    try {
        // You'll need to add this URL to the view's script section
        const response = await fetch('/Task/Complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId: taskId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Task status updated successfully!', 'success');
            
            // Reload page after a short delay to reflect status changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showAlert(result.message || 'Failed to update task', 'error');
            // Revert checkbox
            const checkbox = document.querySelector(`.task-list-item[data-id="${taskId}"] input[type="checkbox"]`);
            if (checkbox) {
                checkbox.checked = !isChecked;
            }
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showAlert('An error occurred while updating the task', 'error');
        // Revert checkbox
        const checkbox = document.querySelector(`.task-list-item[data-id="${taskId}"] input[type="checkbox"]`);
        if (checkbox) {
            checkbox.checked = !isChecked;
        }
    }
}

function initializeInvitationModal() {
    const addMemberBtn = document.getElementById('addMemberBtn');
    const inviteModal = document.getElementById('inviteMemberModal');
    const closeInviteModal = document.getElementById('closeInviteModal');
    const cancelInviteBtn = document.getElementById('cancelInviteBtn');
    const sendInviteBtn = document.getElementById('sendInviteBtn');
    const inviteForm = document.getElementById('inviteMemberForm');

    // Open modal
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', function() {
            inviteModal.classList.add('active');
            document.getElementById('memberEmail').value = '';
        });
    }

    // Close modal
    function closeModal() {
        inviteModal.classList.remove('active');
        inviteForm.reset();
    }

    if (closeInviteModal) {
        closeInviteModal.addEventListener('click', closeModal);
    }

    if (cancelInviteBtn) {
        cancelInviteBtn.addEventListener('click', closeModal);
    }

    // Close on overlay click
    inviteModal.addEventListener('click', function(e) {
        if (e.target === inviteModal) {
            closeModal();
        }
    });

    // Send invitation
    if (sendInviteBtn) {
        sendInviteBtn.addEventListener('click', async function() {
            const email = document.getElementById('memberEmail').value.trim();

            if (!email) {
                showAlert('Please enter an email address', 'error');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }

            // Disable button and show loading
            sendInviteBtn.disabled = true;
            sendInviteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
                // Get CSRF token
                const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
                let token = '';
                if (tokenInput) {
                    token = tokenInput.value;
                } else {
                    // Extract from the HTML string
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = window.projectData.antiForgeryToken;
                    const extractedToken = tempDiv.querySelector('input[name="__RequestVerificationToken"]');
                    if (extractedToken) {
                        token = extractedToken.value;
                    }
                }

                const formData = new FormData();
                formData.append('projectId', window.projectData.projectId);
                formData.append('email', email);
                formData.append('__RequestVerificationToken', token);

                const response = await fetch(window.projectData.sendInvitationUrl, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showAlert('Invitation sent successfully! The user will receive a notification and email.', 'success');
                    closeModal();
                    
                    // Refresh members list after a short delay
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showAlert(result.message || 'Failed to send invitation', 'error');
                }
            } catch (error) {
                console.error('Error sending invitation:', error);
                showAlert('An error occurred while sending the invitation', 'error');
            } finally {
                sendInviteBtn.disabled = false;
                sendInviteBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Invitation';
            }
        });
    }
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    alert.style.position = 'fixed';
    alert.style.bottom = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    alert.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="alert-close"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(alert);

    // Show alert
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 5000);

    // Close button
    alert.querySelector('.alert-close').addEventListener('click', function() {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    });
}

// Refresh team members list
async function refreshTeamMembers() {
    try {
        console.log('Refreshing team members...');
        
        const response = await fetch(`${window.projectData.getMembersUrl}?projectId=${window.projectData.projectId}`);
        
        if (!response.ok) {
            console.error('Failed to fetch members:', response.status);
            return;
        }

        const result = await response.json();
        console.log('Members response:', result);

        if (result.success && result.members) {
            updateMembersList(result.members);
        } else {
            console.error('Failed to fetch members:', result.message);
        }
    } catch (error) {
        console.error('Error refreshing team members:', error);
    }
}

// Update the members list in the UI
function updateMembersList(members) {
    const dynamicMembersList = document.getElementById('dynamicMembersList');
    const emptyState = document.getElementById('emptyMembersState');
    
    if (!dynamicMembersList) {
        console.error('Dynamic members list container not found');
        return;
    }

    console.log('Updating members list with', members.length, 'members');

    // Clear existing dynamic members
    dynamicMembersList.innerHTML = '';

    if (members && members.length > 0) {
        // Hide empty state if it exists
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Add each member
        members.forEach(member => {
            const memberElement = createMemberElement(member);
            dynamicMembersList.appendChild(memberElement);
        });

        console.log('Members list updated successfully');
    } else {
        // Show empty state
        dynamicMembersList.innerHTML = `
            <div class="empty-team-state" id="emptyMembersState">
                <i class="fas fa-user-plus" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p>No team members yet</p>
                <small>Invite team members to collaborate on this project</small>
            </div>
        `;
    }
}

// Create a member element
function createMemberElement(member) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'team-member';
    memberDiv.setAttribute('data-member-id', member.id);
    memberDiv.style.opacity = '0';
    memberDiv.style.transform = 'translateY(10px)';

    // Get current user's project ownership status from window data
    const isOwner = window.projectData.isProjectOwner === true || window.projectData.isProjectOwner === 'True';

    // Determine avatar content
    let avatarContent = '';
    if (member.profilePicture && member.profilePicture !== '') {
        avatarContent = `<img src="${member.profilePicture}" alt="${member.name}" class="member-avatar-img" />`;
    } else {
        avatarContent = '<i class="fas fa-user"></i>';
    }

    memberDiv.innerHTML = `
        <div class="member-avatar">
            ${avatarContent}
        </div>
        <div class="member-info">
            <h4>${member.name}</h4>
            <p>${member.email}</p>
            <small class="text-muted">Joined ${member.joinedAt}</small>
        </div>
        <div class="member-actions">
            <span class="member-role ${member.role.toLowerCase()}">${member.role}</span>
            ${isOwner ? `
                <button class="btn-remove-member" title="Remove member" onclick="removeMember('${member.userId}', '${member.name}')">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </div>
    `;

    // Animate in
    setTimeout(() => {
        memberDiv.style.transition = 'all 0.3s ease';
        memberDiv.style.opacity = '1';
        memberDiv.style.transform = 'translateY(0)';
    }, 10);

    return memberDiv;
}

function initializeKanban() {
    console.log('Initializing Kanban board...');
    
    let draggedCard = null;
    let sourceColumn = null;

    // Setup all kanban cards
    function setupDragHandlers() {
        const kanbanCards = document.querySelectorAll('.kanban-card');
        const kanbanColumns = document.querySelectorAll('.kanban-tasks');

        console.log(`Found ${kanbanCards.length} cards and ${kanbanColumns.length} columns`);

        // Remove existing event listeners by cloning
        kanbanCards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });

        // Setup drag handlers for cards
        document.querySelectorAll('.kanban-card').forEach(card => {
            // Check if user can interact with this card
            const canInteract = card.getAttribute('data-can-interact') === 'true';
            
            if (!canInteract) {
                // Prevent dragging for view-only cards
                card.setAttribute('draggable', 'false');
                return; // Skip adding drag event listeners
            }
            
            // Drag start
            card.addEventListener('dragstart', function(e) {
                console.log('Drag started:', this.getAttribute('data-id'));
                draggedCard = this;
                sourceColumn = this.closest('.kanban-tasks');
                
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
                
                // Make the card semi-transparent
                setTimeout(() => {
                    this.style.opacity = '0.5';
                }, 0);
            });

            // Drag end
            card.addEventListener('dragend', function(e) {
                console.log('Drag ended');
                this.classList.remove('dragging');
                this.style.opacity = '1';
                
                // Clean up all drag-over classes
                document.querySelectorAll('.kanban-tasks').forEach(col => {
                    col.classList.remove('drag-over');
                });
            });

            // Make card not clickable during drag
            card.addEventListener('click', function(e) {
                if (this.classList.contains('dragging')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });

        // Setup drop zones for columns
        kanbanColumns.forEach(column => {
            // Prevent default to allow drop
            column.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!draggedCard) return;

                this.classList.add('drag-over');
                
                // Get the position to insert the dragged card
                const afterElement = getDragAfterElement(this, e.clientY);
                
                if (afterElement == null) {
                    this.appendChild(draggedCard);
                } else {
                    this.insertBefore(draggedCard, afterElement);
                }
            });

            // Add visual feedback when entering
            column.addEventListener('dragenter', function(e) {
                e.preventDefault();
                if (draggedCard) {
                    this.classList.add('drag-over');
                }
            });

            // Remove visual feedback when leaving
            column.addEventListener('dragleave', function(e) {
                // Only remove if leaving the column completely
                const rect = this.getBoundingClientRect();
                if (
                    e.clientX <= rect.left ||
                    e.clientX >= rect.right ||
                    e.clientY <= rect.top ||
                    e.clientY >= rect.bottom
                ) {
                    this.classList.remove('drag-over');
                }
            });

            // Handle drop
            column.addEventListener('drop', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Drop event fired');
                this.classList.remove('drag-over');
                
                if (!draggedCard) {
                    console.log('No dragged card found');
                    return;
                }

                const taskId = draggedCard.getAttribute('data-id');
                const newStatus = this.getAttribute('data-status');
                const oldStatus = draggedCard.getAttribute('data-status');
                
                console.log(`Moving task ${taskId} from ${oldStatus} to ${newStatus}`);

                // If status hasn't changed, just reposition
                if (oldStatus === newStatus) {
                    console.log('Same column, just repositioning');
                    updateTaskCounts();
                    return;
                }
                
                // Update the card's status attribute immediately
                draggedCard.setAttribute('data-status', newStatus);
                
                // Show loading indicator
                const originalContent = draggedCard.innerHTML;
                const loadingIndicator = document.createElement('div');
                loadingIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10;';
                loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                draggedCard.style.position = 'relative';
                draggedCard.style.opacity = '0.6';
                draggedCard.appendChild(loadingIndicator);
                
                // Update task status on server
                const success = await updateTaskStatus(taskId, newStatus);
                
                // Remove loading indicator
                loadingIndicator.remove();
                draggedCard.style.opacity = '1';
                
                if (success) {
                    console.log('Status updated successfully');
                    showAlert(`Task moved to ${formatStatusName(newStatus)}`, 'success');
                    
                    // Reload the page to update all views (Kanban, Task List, Gantt)
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                } else {
                    console.log('Status update failed, reverting');
                    showAlert('Failed to update task status', 'error');
                    
                    // Revert: Move card back to original column
                    if (sourceColumn) {
                        sourceColumn.appendChild(draggedCard);
                        draggedCard.setAttribute('data-status', oldStatus);
                        updateTaskCounts();
                    }
                }
            });
        });
    }

    // Helper function to find where to insert the dragged element
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Helper function to format status names
    function formatStatusName(status) {
        const statusNames = {
            'Pending': 'To Do',
            'InProgress': 'In Progress',
            'Review': 'Review',
            'Completed': 'Completed'
        };
        return statusNames[status] || status;
    }

    // Initialize drag handlers
    setupDragHandlers();
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        console.log('Updating task status...', { taskId, newStatus });
        
        // Validate status
        const validStatuses = ['Pending', 'InProgress', 'Review', 'Completed'];
        if (!validStatuses.includes(newStatus)) {
            console.error('Invalid status:', newStatus);
            return false;
        }

        console.log('Sending request:', {
            taskId: taskId,
            status: newStatus
        });

        const response = await fetch(window.projectData.updateTaskStatusUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                taskId: taskId,
                status: newStatus
            })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            console.error('Response not OK:', response.status);
            const text = await response.text();
            console.error('Response text:', text);
            return false;
        }

        const result = await response.json();
        console.log('Update result:', result);
        
        return result.success === true;
    } catch (error) {
        console.error('Error updating task status:', error);
        console.error('Error details:', error.message, error.stack);
        return false;
    }
}

function updateTaskCounts() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        const status = column.querySelector('.kanban-tasks').getAttribute('data-status');
        const count = column.querySelectorAll('.kanban-card').length;
        const countElement = column.querySelector('.task-count');
        
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

// Gantt Chart Rendering (Placeholder for future implementation)
function renderGanttChart() {
    // This will be implemented with a library like dhtmlxGantt or custom implementation
    console.log('Gantt chart rendering...');
}

// Progress update function
function updateProgress(value) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill && progressText) {
        progressFill.style.width = value + '%';
        progressText.textContent = value + '%';
    }
}

// Remove Member Function
let memberToRemove = null;

async function removeMember(userId, userName) {
    // Store member details
    memberToRemove = { userId, userName };
    
    // Show modal
    const modal = document.getElementById('removeMemberModal');
    const memberNameElement = document.getElementById('memberNameToRemove');
    
    memberNameElement.textContent = userName;
    modal.classList.add('active');
}

// Initialize Remove Member Modal
document.addEventListener('DOMContentLoaded', function() {
    const removeModal = document.getElementById('removeMemberModal');
    const closeRemoveModal = document.getElementById('closeRemoveModal');
    const cancelRemoveBtn = document.getElementById('cancelRemoveBtn');
    const confirmRemoveBtn = document.getElementById('confirmRemoveBtn');

    // Close modal function
    function closeModal() {
        removeModal.classList.remove('active');
        memberToRemove = null;
    }

    // Close button
    if (closeRemoveModal) {
        closeRemoveModal.addEventListener('click', closeModal);
    }

    // Cancel button
    if (cancelRemoveBtn) {
        cancelRemoveBtn.addEventListener('click', closeModal);
    }

    // Close on overlay click
    removeModal.addEventListener('click', function(e) {
        if (e.target === removeModal) {
            closeModal();
        }
    });

    // Confirm remove button
    if (confirmRemoveBtn) {
        confirmRemoveBtn.addEventListener('click', async function() {
            if (!memberToRemove) return;

            const { userId, userName } = memberToRemove;

            // Disable button and show loading
            confirmRemoveBtn.disabled = true;
            confirmRemoveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';

            try {
                // Get CSRF token
                const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
                let token = '';
                if (tokenInput) {
                    token = tokenInput.value;
                } else {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = window.projectData.antiForgeryToken;
                    const extractedToken = tempDiv.querySelector('input[name="__RequestVerificationToken"]');
                    if (extractedToken) {
                        token = extractedToken.value;
                    }
                }

                const response = await fetch(window.projectData.removeMemberUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'RequestVerificationToken': token
                    },
                    body: JSON.stringify({
                        projectId: window.projectData.projectId,
                        userId: userId
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Remove the member card from UI
                    const memberCard = document.querySelector(`.team-member[data-member-id="${userId}"]`);
                    if (memberCard) {
                        memberCard.style.transition = 'all 0.3s ease';
                        memberCard.style.opacity = '0';
                        memberCard.style.transform = 'translateX(-20px)';
                        
                        setTimeout(() => {
                            memberCard.remove();
                            
                            // Check if there are no more members
                            const remainingMembers = document.querySelectorAll('.team-member[data-member-id]');
                            if (remainingMembers.length === 0) {
                                const membersList = document.getElementById('teamMembersList');
                                const ownerCard = membersList.querySelector('.team-member:not([data-member-id])');
                                membersList.innerHTML = '';
                                if (ownerCard) {
                                    membersList.appendChild(ownerCard);
                                }
                                membersList.innerHTML += `
                                    <div class="empty-team-state">
                                        <i class="fas fa-user-plus" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                                        <p>No team members yet</p>
                                        <small>Invite team members to collaborate on this project</small>
                                    </div>
                                `;
                            }
                        }, 300);
                    }

                    showAlert(`${userName} has been removed from the project`, 'success');
                    closeModal();
                } else {
                    showAlert(result.message || 'Failed to remove member', 'error');
                }
            } catch (error) {
                console.error('Error removing member:', error);
                showAlert('An error occurred while removing the member', 'error');
            } finally {
                // Reset button
                confirmRemoveBtn.disabled = false;
                confirmRemoveBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Remove Member';
            }
        });
    }
});

// Gantt Chart Initialization
function initializeGanttChart() {
    const ganttChart = document.getElementById('ganttChart');
    if (!ganttChart) return;

    const taskBars = document.querySelectorAll('.gantt-task-bar');
    if (taskBars.length === 0) return;

    // Collect all task dates
    const taskDates = [];
    taskBars.forEach(bar => {
        const startDate = new Date(bar.dataset.start);
        const endDate = new Date(bar.dataset.end);
        taskDates.push(startDate, endDate);
    });

    if (taskDates.length === 0) return;

    // Find min and max dates
    const minDate = new Date(Math.min(...taskDates));
    const maxDate = new Date(Math.max(...taskDates));
    
    // Add padding (1 week before and after)
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    // Calculate total days
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

    // Generate month labels
    generateMonthLabels(minDate, maxDate);

    // Position task bars
    taskBars.forEach(bar => {
        const startDate = new Date(bar.dataset.start);
        const endDate = new Date(bar.dataset.end);
        
        // Calculate position
        const daysFromStart = Math.ceil((startDate - minDate) / (1000 * 60 * 60 * 24));
        const taskDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Calculate percentages
        const leftPercent = (daysFromStart / totalDays) * 100;
        const widthPercent = (taskDuration / totalDays) * 100;
        
        // Apply styles
        bar.style.left = `${leftPercent}%`;
        bar.style.width = `${Math.max(widthPercent, 5)}%`; // Minimum 5% width for visibility
        
        // Add tooltip
        const tooltip = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        bar.title = tooltip;
    });
}

function generateMonthLabels(minDate, maxDate) {
    const monthsContainer = document.getElementById('ganttMonths');
    if (!monthsContainer) return;

    monthsContainer.innerHTML = '';
    
    const months = [];
    const currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
        const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Check if this month is already added
        if (!months.includes(monthYear)) {
            months.push(monthYear);
            
            const monthElement = document.createElement('div');
            monthElement.className = 'gantt-month';
            monthElement.textContent = monthYear;
            monthsContainer.appendChild(monthElement);
        }
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // If no months generated, show current month
    if (months.length === 0) {
        const monthElement = document.createElement('div');
        monthElement.className = 'gantt-month';
        monthElement.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthsContainer.appendChild(monthElement);
    }
}
