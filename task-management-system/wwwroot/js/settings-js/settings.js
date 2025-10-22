// Settings Page Functionality

$(document).ready(function() {
    initializeSettings();
});

function initializeSettings() {
    // Load saved preferences
    loadPreferences();

    // Dark Mode Toggle
    $('#darkMode').on('change', function() {
        const isDarkMode = $(this).is(':checked');
        setDarkMode(isDarkMode);
        savePreference('darkMode', isDarkMode);
        showSettingsAlert('Dark mode ' + (isDarkMode ? 'enabled' : 'disabled'), 'success');
    });

    // Email Notifications Toggle
    $('#emailNotifications').on('change', function() {
        const isEnabled = $(this).is(':checked');
        savePreference('emailNotifications', isEnabled);
        showSettingsAlert('Email notifications ' + (isEnabled ? 'enabled' : 'disabled'), 'success');
    });

    // Task Reminders Toggle
    $('#taskReminders').on('change', function() {
        const isEnabled = $(this).is(':checked');
        savePreference('taskReminders', isEnabled);
        showSettingsAlert('Task reminders ' + (isEnabled ? 'enabled' : 'disabled'), 'success');
    });

    // Weekly Summary Toggle
    $('#weeklySummary').on('change', function() {
        const isEnabled = $(this).is(':checked');
        savePreference('weeklySummary', isEnabled);
        showSettingsAlert('Weekly summary ' + (isEnabled ? 'enabled' : 'disabled'), 'success');
    });
}

// Load saved preferences from localStorage
function loadPreferences() {
    // Dark Mode
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode !== null) {
        const isDarkMode = darkMode === 'true';
        $('#darkMode').prop('checked', isDarkMode);
        setDarkMode(isDarkMode);
    } else {
        // Default to unchecked
        $('#darkMode').prop('checked', false);
    }

    // Email Notifications
    const emailNotifications = localStorage.getItem('emailNotifications');
    if (emailNotifications !== null) {
        $('#emailNotifications').prop('checked', emailNotifications === 'true');
    } else {
        $('#emailNotifications').prop('checked', true); // Default checked
    }

    // Task Reminders
    const taskReminders = localStorage.getItem('taskReminders');
    if (taskReminders !== null) {
        $('#taskReminders').prop('checked', taskReminders === 'true');
    } else {
        $('#taskReminders').prop('checked', true); // Default checked
    }

    // Weekly Summary
    const weeklySummary = localStorage.getItem('weeklySummary');
    if (weeklySummary !== null) {
        $('#weeklySummary').prop('checked', weeklySummary === 'true');
    } else {
        $('#weeklySummary').prop('checked', false); // Default unchecked
    }
}

// Save preference to localStorage
function savePreference(key, value) {
    localStorage.setItem(key, value);
}

// Set dark mode
function setDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

// Show settings alert
function showSettingsAlert(message, type) {
    // Remove existing alerts
    $('.settings-alert').remove();

    const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

    const alert = $(`
        <div class="settings-alert alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="fas ${iconClass}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);

    // Insert at the top of the preferences card
    $('.account-card .card-content').prepend(alert);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        alert.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3000);
}
