// Account Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAccountPage();
});

function initializeAccountPage() {
    initializeEditButtons();
    initializeSecurityActions();
    initializePreferenceToggles();
    initializeDangerZone();
    initializeModals();
}

// Modal Functions
function initializeModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });
}

// Edit Profile Modal Functions
function showEditProfileModal() {
    const modal = document.getElementById('editProfileModalOverlay');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModalOverlay');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

function updateProfile() {
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const email = document.getElementById('editEmail').value.trim();

    if (!firstName || !lastName || !email) {
        showNotification('error', 'Please fill in all required fields.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('error', 'Please enter a valid email address.');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#editProfileModalOverlay .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Saving...</span>';

    fetch('/Account/UpdateProfile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('success', data.message || 'Profile updated successfully!');
            closeEditProfileModal();
            
            // Reload page to show updated values
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showNotification('error', data.message || 'Failed to update profile.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'An error occurred. Please try again.');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

// Change Password Modal Functions
function showChangePasswordModal() {
    const modal = document.getElementById('changePasswordModalOverlay');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModalOverlay');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
    
    // Clear form
    document.getElementById('changePasswordForm').reset();
}

function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('error', 'Please fill in all password fields.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('error', 'New passwords do not match.');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('error', 'Password must be at least 8 characters long.');
        return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        showNotification('error', 'Password must contain uppercase, lowercase, number, and special character.');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#changePasswordModalOverlay .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Updating...</span>';

    fetch('/Account/ChangePassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('success', data.message || 'Password changed successfully!');
            closeChangePasswordModal();
        } else {
            showNotification('error', data.message || 'Failed to change password.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'An error occurred. Please try again.');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function closeAllModals() {
    closeEditProfileModal();
    closeChangePasswordModal();
}

// Profile Edit Functions
function initializeEditButtons() {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfileModal);
    }
}

function openEditProfileModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editProfileModalLabel">
                            <i class="fas fa-user-edit"></i> Edit Profile
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="editProfileForm">
                        <div class="modal-body">
                            <div class="form-group mb-3">
                                <label for="firstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="firstName" value="${getCurrentUserFirstName()}" required>
                            </div>
                            <div class="form-group mb-3">
                                <label for="lastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="lastName" value="${getCurrentUserLastName()}" required>
                            </div>
                            <div class="form-group mb-3">
                                <label for="email" class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="email" value="${getCurrentUserEmail()}" required>
                            </div>
                            <div class="form-group mb-3">
                                <label for="phone" class="form-label">Phone Number</label>
                                <input type="tel" class="form-control" id="phone" value="${getCurrentUserPhone()}">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM if it doesn't exist
    if (!document.getElementById('editProfileModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
    
    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);
}

function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    // Simulate API call (replace with actual API endpoint)
    fetch('/Account/UpdateProfile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': getAntiForgeryToken()
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage('Profile updated successfully!');
            // Update the displayed information
            updateProfileDisplay(formData);
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
        } else {
            showErrorMessage('Failed to update profile. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showErrorMessage('An error occurred while updating your profile.');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// Security Functions
function initializeSecurityActions() {
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', openChangePasswordModal);
    }
    
    const resendVerificationBtn = document.getElementById('resend-verification-btn');
    if (resendVerificationBtn) {
        resendVerificationBtn.addEventListener('click', resendVerificationEmail);
    }
}

function openChangePasswordModal() {
    const modalHTML = `
        <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="changePasswordModalLabel">
                            <i class="fas fa-key"></i> Change Password
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="changePasswordForm">
                        <div class="modal-body">
                            <div class="form-group mb-3">
                                <label for="currentPassword" class="form-label">Current Password</label>
                                <input type="password" class="form-control" id="currentPassword" required>
                            </div>
                            <div class="form-group mb-3">
                                <label for="newPassword" class="form-label">New Password</label>
                                <input type="password" class="form-control" id="newPassword" required>
                                <div class="form-text">Password must be at least 8 characters long.</div>
                            </div>
                            <div class="form-group mb-3">
                                <label for="confirmPassword" class="form-label">Confirm New Password</label>
                                <input type="password" class="form-control" id="confirmPassword" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-key"></i> Change Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('changePasswordModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
    
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
}

function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showErrorMessage('New passwords do not match.');
        return;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
        showErrorMessage('Password must be at least 8 characters long.');
        return;
    }
    
    const formData = {
        currentPassword: currentPassword,
        newPassword: newPassword
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    submitBtn.disabled = true;
    
    fetch('/Account/ChangePassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': getAntiForgeryToken()
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage('Password changed successfully!');
            bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
        } else {
            showErrorMessage(data.message || 'Failed to change password. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        showErrorMessage('An error occurred while changing your password.');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function resendVerificationEmail() {
    const btn = document.getElementById('resend-verification-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    
    fetch('/Account/ResendVerification', {
        method: 'POST',
        headers: {
            'RequestVerificationToken': getAntiForgeryToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage('Verification email sent successfully!');
        } else {
            showErrorMessage('Failed to send verification email. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error sending verification email:', error);
        showErrorMessage('An error occurred while sending the verification email.');
    })
    .finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// Preferences Functions
function initializePreferenceToggles() {
    const toggles = document.querySelectorAll('.preference-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', handlePreferenceToggle);
    });
}

function handlePreferenceToggle(event) {
    const preference = event.target.getAttribute('data-preference');
    const enabled = event.target.checked;
    
    // Update preference via API
    fetch('/Account/UpdatePreference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': getAntiForgeryToken()
        },
        body: JSON.stringify({
            preference: preference,
            enabled: enabled
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage(`${preference} preference updated successfully!`);
        } else {
            // Revert toggle if update failed
            event.target.checked = !enabled;
            showErrorMessage('Failed to update preference. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error updating preference:', error);
        // Revert toggle if update failed
        event.target.checked = !enabled;
        showErrorMessage('An error occurred while updating your preference.');
    });
}

// Danger Zone Functions
function initializeDangerZone() {
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', openDeleteAccountModal);
    }
}

function openDeleteAccountModal() {
    const modalHTML = `
        <div class="modal fade" id="deleteAccountModal" tabindex="-1" aria-labelledby="deleteAccountModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title text-danger" id="deleteAccountModalLabel">
                            <i class="fas fa-exclamation-triangle"></i> Delete Account
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </div>
                        <p>Please type <strong>DELETE</strong> to confirm:</p>
                        <input type="text" class="form-control" id="deleteConfirmation" placeholder="Type DELETE to confirm">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn" disabled>
                            <i class="fas fa-trash"></i> Delete My Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('deleteAccountModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
    modal.show();
    
    // Enable delete button only when DELETE is typed
    const confirmInput = document.getElementById('deleteConfirmation');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    confirmInput.addEventListener('input', function() {
        confirmBtn.disabled = this.value !== 'DELETE';
    });
    
    confirmBtn.addEventListener('click', handleAccountDeletion);
}

function handleAccountDeletion() {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    confirmBtn.disabled = true;
    
    fetch('/Account/DeleteAccount', {
        method: 'POST',
        headers: {
            'RequestVerificationToken': getAntiForgeryToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage('Account deleted successfully. Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showErrorMessage('Failed to delete account. Please try again.');
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error deleting account:', error);
        showErrorMessage('An error occurred while deleting your account.');
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    });
}

// Utility Functions
function getCurrentUserFirstName() {
    return document.querySelector('.avatar-info h4')?.textContent?.split(' ')[0] || '';
}

function getCurrentUserLastName() {
    return document.querySelector('.avatar-info h4')?.textContent?.split(' ').slice(1).join(' ') || '';
}

function getCurrentUserEmail() {
    return document.querySelector('[data-user-email]')?.getAttribute('data-user-email') || '';
}

function getCurrentUserPhone() {
    return document.querySelector('[data-user-phone]')?.getAttribute('data-user-phone') || '';
}

function updateProfileDisplay(data) {
    // Update avatar display
    const avatarInfo = document.querySelector('.avatar-info h4');
    if (avatarInfo) {
        avatarInfo.textContent = `${data.firstName} ${data.lastName}`;
    }
    
    // Update avatar circle initials
    const avatarCircle = document.querySelector('.avatar-circle');
    if (avatarCircle) {
        avatarCircle.textContent = `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`;
    }
    
    // Update detail values
    const emailDetail = document.querySelector('[data-detail="email"]');
    if (emailDetail) {
        emailDetail.textContent = data.email;
    }
    
    const phoneDetail = document.querySelector('[data-detail="phone"]');
    if (phoneDetail) {
        phoneDetail.textContent = data.phone || 'Not provided';
    }
}

function getAntiForgeryToken() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showNotification(type, message) {
    showMessage(message, type);
}

function showMessage(message, type) {
    // Create toast notification
    const toastHTML = `
        <div class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white" role="alert">
                <div class="toast-header ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                    <strong class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        </div>
    `;
    
    // Remove existing toasts
    document.querySelectorAll('.toast-container').forEach(container => container.remove());
    
    // Add new toast
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    
    // Show toast
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        const container = document.querySelector('.toast-container');
        if (container) {
            container.remove();
        }
    }, 5000);
}
