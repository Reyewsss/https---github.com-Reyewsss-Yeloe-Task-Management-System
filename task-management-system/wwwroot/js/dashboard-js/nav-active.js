// Navigation Active State Management
(function() {
    'use strict';

    // Function to set active navigation link
    function setActiveNavLink() {
        // Get current path
        const currentPath = window.location.pathname.toLowerCase();
        
        // Get all navigation links
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        
        // Remove active class from all links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Track if we found an exact match
        let exactMatchFound = false;
        
        // First pass: Look for exact matches
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            
            if (!linkPath) return;
            
            // Normalize the link path
            const normalizedLinkPath = linkPath.toLowerCase();
            
            // Check for exact match
            if (currentPath === normalizedLinkPath) {
                link.classList.add('active');
                exactMatchFound = true;
            }
        });
        
        // Second pass: Only if no exact match found, look for partial matches
        if (!exactMatchFound) {
            navLinks.forEach(link => {
                const linkPath = link.getAttribute('href');
                
                if (!linkPath) return;
                
                // Normalize the link path
                const normalizedLinkPath = linkPath.toLowerCase();
                
                // For controller-level matching (but more specific)
                // Only match if it's the index page of that controller
                if (normalizedLinkPath !== '/' && currentPath.startsWith(normalizedLinkPath)) {
                    link.classList.add('active');
                }
            });
        }
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setActiveNavLink);
    } else {
        setActiveNavLink();
    }
    
    // Also run after page transitions (if using AJAX navigation)
    window.addEventListener('load', setActiveNavLink);
})();
