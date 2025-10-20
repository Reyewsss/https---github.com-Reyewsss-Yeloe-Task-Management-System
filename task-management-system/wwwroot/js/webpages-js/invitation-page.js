// Invitation Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeInvitationPage();
});

function initializeInvitationPage() {
    const acceptBtn = document.getElementById('acceptBtn');
    const declineBtn = document.getElementById('declineBtn');
    const invitationForm = document.getElementById('invitationResponseForm');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            handleInvitationResponse('accept');
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', function() {
            // Show confirmation dialog
            if (confirm('Are you sure you want to decline this invitation?')) {
                handleInvitationResponse('decline');
            }
        });
    }
}

async function handleInvitationResponse(action) {
    const acceptBtn = document.getElementById('acceptBtn');
    const declineBtn = document.getElementById('declineBtn');
    const invitationForm = document.getElementById('invitationResponseForm');
    
    const invitationIdInput = invitationForm.querySelector('input[name="invitationId"]');
    const tokenInput = invitationForm.querySelector('input[name="__RequestVerificationToken"]');
    
    if (!invitationIdInput || !tokenInput) {
        showAlert('Missing required form data', 'error');
        return;
    }

    const invitationId = invitationIdInput.value;
    const token = tokenInput.value;

    // Disable buttons
    acceptBtn.disabled = true;
    declineBtn.disabled = true;

    // Add loading state
    const activeBtn = action === 'accept' ? acceptBtn : declineBtn;
    const originalHTML = activeBtn.innerHTML;
    activeBtn.classList.add('loading');

    try {
        const url = action === 'accept' ? window.invitationData.acceptUrl : window.invitationData.declineUrl;
        
        const formData = new FormData();
        formData.append('invitationId', invitationId);
        formData.append('__RequestVerificationToken', token);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            if (action === 'accept') {
                showAlert('Invitation accepted! Redirecting to project...', 'success');
                // Redirect to project dashboard after 1.5 seconds
                setTimeout(() => {
                    window.location.href = window.invitationData.projectDashboardUrl;
                }, 1500);
            } else {
                showAlert('Invitation declined. Redirecting...', 'info');
                // Redirect to projects page after 1.5 seconds
                setTimeout(() => {
                    window.location.href = window.invitationData.projectsUrl;
                }, 1500);
            }
        } else {
            showAlert(result.message || `Failed to ${action} invitation`, 'error');
            // Re-enable buttons
            acceptBtn.disabled = false;
            declineBtn.disabled = false;
            activeBtn.classList.remove('loading');
            activeBtn.innerHTML = originalHTML;
        }
    } catch (error) {
        console.error(`Error ${action}ing invitation:`, error);
        showAlert(`An error occurred while ${action}ing the invitation`, 'error');
        // Re-enable buttons
        acceptBtn.disabled = false;
        declineBtn.disabled = false;
        activeBtn.classList.remove('loading');
        activeBtn.innerHTML = originalHTML;
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

    // Append to invitation card or body
    const invitationCard = document.querySelector('.invitation-card');
    if (invitationCard) {
        invitationCard.style.position = 'relative';
        invitationCard.appendChild(alert);
        alert.style.position = 'absolute';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.left = 'auto';
    } else {
        document.body.appendChild(alert);
    }

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

// Add custom alert styles dynamically
const style = document.createElement('style');
style.textContent = `
    .custom-alert {
        min-width: 300px;
        max-width: 500px;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        transform: translateY(-20px);
        opacity: 0;
        transition: all 0.3s ease;
    }

    .custom-alert.show {
        transform: translateY(0);
        opacity: 1;
    }

    .custom-alert i {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .custom-alert span {
        flex: 1;
        font-size: 0.95rem;
    }

    .custom-alert.alert-success {
        border-left: 4px solid #4CAF50;
    }

    .custom-alert.alert-success i {
        color: #4CAF50;
    }

    .custom-alert.alert-error {
        border-left: 4px solid #F44336;
    }

    .custom-alert.alert-error i {
        color: #F44336;
    }

    .custom-alert.alert-info {
        border-left: 4px solid #2196F3;
    }

    .custom-alert.alert-info i {
        color: #2196F3;
    }

    .alert-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #999;
        font-size: 1.2rem;
        padding: 0.25rem;
        transition: all 0.3s ease;
    }

    .alert-close:hover {
        color: #F44336;
    }
`;
document.head.appendChild(style);
