// Dark Mode Initialization - Runs on all pages
// This script should be loaded early to prevent flash of unstyled content

(function() {
    'use strict';
    
    // Check dark mode preference immediately on page load
    const darkMode = localStorage.getItem('darkMode');
    
    if (darkMode === 'true') {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
    }
})();

// Additional initialization after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Apply dark mode if stored preference exists
    const darkMode = localStorage.getItem('darkMode');
    
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
});
