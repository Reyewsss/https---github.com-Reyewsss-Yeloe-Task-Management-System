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
    initializeProfilePicture();
}

// Profile Picture Functions
function initializeProfilePicture() {
    const avatarCircle = document.getElementById('avatarDisplay');
    if (avatarCircle) {
        avatarCircle.addEventListener('mouseenter', function() {
            const overlay = this.querySelector('.avatar-upload-overlay');
            if (overlay) overlay.style.opacity = '1';
        });
        avatarCircle.addEventListener('mouseleave', function() {
            const overlay = this.querySelector('.avatar-upload-overlay');
            if (overlay) overlay.style.opacity = '0';
        });
    }
}

function uploadProfilePicture() {
    const fileInput = document.getElementById('profilePictureInput');
    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('error', 'Invalid file type. Only JPG, PNG, and GIF are allowed.');
        fileInput.value = '';
        return;
    }

    // Show loading state
    const avatarCircle = document.getElementById('avatarDisplay');
    const overlay = avatarCircle.querySelector('.avatar-upload-overlay');
    const originalOverlayContent = overlay.innerHTML;
    overlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Uploading...</span>';
    overlay.style.opacity = '1';

    // Create form data
    const formData = new FormData();
    formData.append('profilePicture', file);

    fetch('/Account/UploadProfilePicture', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('success', data.message || 'Profile picture updated successfully!');
            
            // Update the avatar display
            const defaultAvatar = document.getElementById('defaultAvatar');
            let profileImg = document.getElementById('profilePictureImg');
            
            if (defaultAvatar) {
                defaultAvatar.remove();
            }

            if (!profileImg) {
                profileImg = document.createElement('img');
                profileImg.id = 'profilePictureImg';
                profileImg.className = 'profile-picture-img';
                avatarCircle.insertBefore(profileImg, overlay);
            }
            
            // Set the base64 data URL directly
            profileImg.src = data.profilePictureUrl;
            
            // Also update the header avatar if it exists
            const headerAvatar = document.querySelector('.user-avatar-small img');
            if (headerAvatar) {
                headerAvatar.src = data.profilePictureUrl;
            } else {
                // If no image exists, create one and replace the icon
                const headerAvatarContainer = document.querySelector('.user-avatar-small');
                if (headerAvatarContainer) {
                    const icon = headerAvatarContainer.querySelector('i');
                    if (icon) {
                        icon.remove();
                    }
                    const newImg = document.createElement('img');
                    newImg.src = data.profilePictureUrl;
                    newImg.alt = 'Profile';
                    newImg.className = 'user-avatar-img';
                    headerAvatarContainer.appendChild(newImg);
                }
            }
        } else {
            showNotification('error', data.message || 'Failed to upload profile picture.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'An error occurred while uploading. Please try again.');
    })
    .finally(() => {
        overlay.innerHTML = originalOverlayContent;
        overlay.style.opacity = '0';
        fileInput.value = '';
    });
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
    const age = document.getElementById('editAge').value;
    const address = document.getElementById('editAddress').value.trim();

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
            email: email,
            age: parseInt(age) || 0,
            address: address
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
        deleteAccountBtn.addEventListener('click', deleteAccount);
    }
}

function deleteAccount() {
    showDeleteAccountModal();
}

function showDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModalOverlay');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        document.getElementById('deletePasswordConfirm').value = '';
        document.getElementById('deleteTypeConfirm').value = '';
        document.getElementById('deleteUnderstandCheck').checked = false;
        document.getElementById('confirmDeleteButton').disabled = true;
        
        // Add validation listeners
        setupDeleteValidation();
    }
}

function closeDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function setupDeleteValidation() {
    const passwordInput = document.getElementById('deletePasswordConfirm');
    const typeInput = document.getElementById('deleteTypeConfirm');
    const checkbox = document.getElementById('deleteUnderstandCheck');
    const deleteButton = document.getElementById('confirmDeleteButton');
    
    function validateForm() {
        const passwordFilled = passwordInput.value.trim().length > 0;
        const typedCorrectly = typeInput.value === 'DELETE MY ACCOUNT';
        const checkboxChecked = checkbox.checked;
        
        deleteButton.disabled = !(passwordFilled && typedCorrectly && checkboxChecked);
    }
    
    passwordInput.addEventListener('input', validateForm);
    typeInput.addEventListener('input', validateForm);
    checkbox.addEventListener('change', validateForm);
}

async function confirmDeleteAccount() {
    const password = document.getElementById('deletePasswordConfirm').value;
    const confirmText = document.getElementById('deleteTypeConfirm').value;
    const understood = document.getElementById('deleteUnderstandCheck').checked;
    
    if (!password || confirmText !== 'DELETE MY ACCOUNT' || !understood) {
        showNotification('error', 'Please complete all confirmation steps');
        return;
    }
    
    // Show final confirmation
    if (!confirm('Are you absolutely sure? This is your last chance to cancel. Your account will be permanently deleted.')) {
        return;
    }
    
    const deleteButton = document.getElementById('confirmDeleteButton');
    const originalText = deleteButton.innerHTML;
    deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteButton.disabled = true;
    
    try {
        const response = await fetch('/Account/DeleteAccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', 'Account deleted successfully. Redirecting...');
            setTimeout(() => {
                window.location.href = '/Auth/Login';
            }, 2000);
        } else {
            showNotification('error', data.message || 'Failed to delete account');
            deleteButton.innerHTML = originalText;
            deleteButton.disabled = false;
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('error', 'An error occurred while deleting your account');
        deleteButton.innerHTML = originalText;
        deleteButton.disabled = false;
    }
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

// Security Section Button Functions
function changePassword() {
    showChangePasswordModal();
}

async function viewActivity() {
    showActivityModal();
    await loadActivities();
}

function showActivityModal() {
    const modal = document.getElementById('activityModalOverlay');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeActivityModal() {
    const modal = document.getElementById('activityModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function loadActivities() {
    const activityList = document.getElementById('activityList');
    
    try {
        const response = await fetch('/Account/GetUserActivities', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success && data.activities && data.activities.length > 0) {
            activityList.innerHTML = data.activities.map(activity => {
                const icon = getActivityIcon(activity.activityType);
                const iconClass = getActivityIconClass(activity.activityType);
                const timeAgo = formatTimeAgo(activity.createdAt);
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon ${iconClass}">
                            <i class="${icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">${activity.description}</div>
                            ${activity.ipAddress ? `<div class="activity-description">From IP: ${activity.ipAddress}</div>` : ''}
                            <div class="activity-meta">
                                <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                                ${activity.userAgent ? `<span><i class="fas fa-desktop"></i> ${getBrowserInfo(activity.userAgent)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            activityList.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No activity recorded yet</p>
                </div>
            `;
        }
    } catch (error) {
        activityList.innerHTML = `
            <div class="empty-activity">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load activities</p>
            </div>
        `;
    }
}

function getActivityIcon(activityType) {
    const icons = {
        'Login': 'fas fa-sign-in-alt',
        'Logout': 'fas fa-sign-out-alt',
        'ProfileUpdate': 'fas fa-user-edit',
        'PasswordChange': 'fas fa-key',
        'ProfilePictureUpdate': 'fas fa-camera',
        'EmailVerification': 'fas fa-envelope-open',
        'PasswordReset': 'fas fa-unlock-alt',
        'TaskCreated': 'fas fa-plus-circle',
        'TaskUpdated': 'fas fa-edit',
        'TaskDeleted': 'fas fa-trash',
        'ProjectCreated': 'fas fa-folder-plus',
        'ProjectUpdated': 'fas fa-folder',
        'ProjectDeleted': 'fas fa-folder-minus',
        'CommentAdded': 'fas fa-comment',
        'WorkSubmitted': 'fas fa-briefcase'
    };
    return icons[activityType] || 'fas fa-circle';
}

function getActivityIconClass(activityType) {
    if (activityType === 'Login') return 'login';
    if (activityType === 'Logout') return 'logout';
    if (activityType.includes('Profile') || activityType.includes('Email')) return 'profile';
    if (activityType.includes('Password')) return 'password';
    if (activityType.includes('Task')) return 'task';
    if (activityType.includes('Project')) return 'project';
    if (activityType.includes('Comment')) return 'comment';
    if (activityType.includes('Work')) return 'work';
    return 'profile';
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
}

function getBrowserInfo(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown Browser';
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
    // Determine colors and icons based on type
    let bgColor, icon, title;
    switch(type) {
        case 'success':
            bgColor = 'bg-success';
            icon = 'fa-check-circle';
            title = 'Success';
            break;
        case 'error':
            bgColor = 'bg-danger';
            icon = 'fa-exclamation-circle';
            title = 'Error';
            break;
        case 'info':
            bgColor = 'bg-info';
            icon = 'fa-info-circle';
            title = 'Info';
            break;
        case 'warning':
            bgColor = 'bg-warning';
            icon = 'fa-exclamation-triangle';
            title = 'Warning';
            break;
        default:
            bgColor = 'bg-primary';
            icon = 'fa-bell';
            title = 'Notification';
    }
    
    // Create toast notification
    const toastHTML = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999;">
            <div class="toast ${bgColor} text-white" role="alert">
                <div class="toast-header ${bgColor} text-white">
                    <i class="fas ${icon} me-2"></i>
                    <strong class="me-auto">${title}</strong>
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
