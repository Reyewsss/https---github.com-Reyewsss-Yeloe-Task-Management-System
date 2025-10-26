// Dark Mode Initialization - Runs only on dashboard pages
// This script should be loaded early to prevent flash of unstyled content

// Immediately check and apply dark mode to prevent flash
(function() {
    'use strict';
    
    // Check dark mode preference from localStorage
    const darkMode = localStorage.getItem('darkMode');
    
    if (darkMode === 'true') {
        // Apply dark mode classes immediately
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark-mode');
    }
})();

// Additional initialization after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Check if we're in a dashboard layout
    const isDashboard = document.body.classList.contains('dashboard-body') || 
                        document.querySelector('.dashboard-wrapper') !== null;
    
    if (!isDashboard) {
        // Not a dashboard page, remove dark mode
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        return;
    }
    
    // Apply dark mode to body if stored preference exists
    const darkMode = localStorage.getItem('darkMode');
    
    if (darkMode === 'true') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-mode');
    }
    
    // Initialize dark mode toggle functionality
    initializeDarkModeToggle();
});

// Initialize dark mode toggle across all dashboard pages
function initializeDarkModeToggle() {
    // This function will be called on all dashboard pages
    // Individual pages with toggle switches should set up their own event listeners
    
    // Check if there's a dark mode toggle on this page
    const darkModeToggle = document.getElementById('darkMode');
    
    if (darkModeToggle) {
        // Get current dark mode state
        const darkMode = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.checked = darkMode;
        
        // Add event listener for toggle
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode(this.checked);
        });
    }
}

// Global dark mode toggle function
function toggleDarkMode(enabled) {
    if (enabled) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

// Make toggleDarkMode available globally
window.toggleDarkMode = toggleDarkMode;
