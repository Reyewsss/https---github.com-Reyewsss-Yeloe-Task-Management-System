// Settings Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

function initializeSettings() {
    // Set up change listeners for all toggles
    setupToggleListeners();
}

function setupToggleListeners() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkMode');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', async function() {
            const isDarkMode = this.checked;
            await savePreferences();
            applyDarkMode(isDarkMode);
            showSettingsNotification('Dark mode ' + (isDarkMode ? 'enabled' : 'disabled'), 'success');
        });
    }

    // Email Notifications Toggle
    const emailNotificationsToggle = document.getElementById('emailNotifications');
    if (emailNotificationsToggle) {
        emailNotificationsToggle.addEventListener('change', async function() {
            const isEnabled = this.checked;
            await savePreferences();
            showSettingsNotification('Email notifications ' + (isEnabled ? 'enabled' : 'disabled'), 'success');
        });
    }

    // Task Reminders Toggle
    const taskRemindersToggle = document.getElementById('taskReminders');
    if (taskRemindersToggle) {
        taskRemindersToggle.addEventListener('change', async function() {
            const isEnabled = this.checked;
            await savePreferences();
            showSettingsNotification('Task reminders ' + (isEnabled ? 'enabled' : 'disabled'), 'success');
        });
    }

    // Weekly Summary Toggle
    const weeklySummaryToggle = document.getElementById('weeklySummary');
    if (weeklySummaryToggle) {
        weeklySummaryToggle.addEventListener('change', async function() {
            const isEnabled = this.checked;
            await savePreferences();
            showSettingsNotification('Weekly summary ' + (isEnabled ? 'enabled' : 'disabled'), 'success');
        });
    }
}

async function savePreferences() {
    try {
        const preferences = {
            emailNotifications: document.getElementById('emailNotifications')?.checked || false,
            taskReminders: document.getElementById('taskReminders')?.checked || false,
            weeklySummary: document.getElementById('weeklySummary')?.checked || false,
            darkMode: document.getElementById('darkMode')?.checked || false
        };

        const response = await fetch('/Account/UpdatePreferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferences)
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Failed to save preferences:', data.message);
            showSettingsNotification('Failed to save preferences', 'error');
        }
    } catch (error) {
        console.error('Error saving preferences:', error);
        showSettingsNotification('Error saving preferences', 'error');
    }
}

function applyDarkMode(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function showSettingsNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `settings-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
