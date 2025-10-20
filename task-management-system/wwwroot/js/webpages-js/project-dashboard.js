// Project Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeInvitationModal();
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
        });
    });

    // Initialize Kanban drag and drop (future enhancement)
    initializeKanban();
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

function initializeKanban() {
    const kanbanCards = document.querySelectorAll('.kanban-card');

    kanbanCards.forEach(card => {
        card.addEventListener('click', function() {
            const taskId = this.getAttribute('data-id');
            // Future: Open task detail modal
            console.log('Task clicked:', taskId);
        });
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
