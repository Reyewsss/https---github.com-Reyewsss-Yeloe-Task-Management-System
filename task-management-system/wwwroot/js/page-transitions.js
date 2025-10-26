// Smooth Page Transitions - Using existing loader
// Works with your existing loader element

(function() {
    'use strict';

    // Only show loader if navigation takes longer than this
    const LOADER_DELAY = 100; // milliseconds
    
    let loaderTimeout = null;
    let progressInterval = null;

    // Use existing loader or create progress bar
    function getExistingLoader() {
        return document.getElementById('loader');
    }

    function getOrCreateProgressBar() {
        let bar = document.getElementById('pageTransitionProgress');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'pageTransitionProgress';
            document.body.appendChild(bar);
        }
        return bar;
    }

    function showTransition() {
        // Clear any existing timeouts
        clearTimeout(loaderTimeout);
        clearInterval(progressInterval);

        const progressBar = getOrCreateProgressBar();
        const existingLoader = getExistingLoader();
        
        // Start progress bar immediately
        progressBar.style.width = '0%';
        requestAnimationFrame(() => {
            progressBar.classList.add('active');
            progressBar.style.width = '30%';
        });

        // Animate progress
        let progress = 30;
        progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 15;
                progressBar.style.width = Math.min(progress, 90) + '%';
            }
        }, 300);

        // Show existing loader after delay (avoid flash on fast loads)
        if (existingLoader) {
            loaderTimeout = setTimeout(() => {
                existingLoader.style.display = 'flex';
                existingLoader.style.opacity = '1';
            }, LOADER_DELAY);
        }
    }

    function hideTransition() {
        clearTimeout(loaderTimeout);
        clearInterval(progressInterval);

        const progressBar = document.getElementById('pageTransitionProgress');
        const existingLoader = getExistingLoader();

        if (progressBar) {
            progressBar.style.width = '100%';
            setTimeout(() => {
                progressBar.classList.remove('active');
                progressBar.style.width = '0%';
            }, 200);
        }

        if (existingLoader) {
            existingLoader.style.opacity = '0';
            setTimeout(() => {
                existingLoader.style.display = 'none';
            }, 300);
        }
    }

    function shouldShowTransition(element) {
        // Skip if element has data-no-transition attribute
        if (element.hasAttribute('data-no-transition')) {
            return false;
        }

        // Skip if it's an AJAX form
        if (element.tagName === 'FORM' && element.hasAttribute('data-ajax')) {
            return false;
        }

        // For links
        if (element.tagName === 'A') {
            const href = element.getAttribute('href');
            
            // Skip these types of links
            if (!href || 
                href.startsWith('#') || 
                href.startsWith('javascript:') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                element.getAttribute('target') === '_blank' ||
                element.hasAttribute('download')) {
                return false;
            }

            // Skip external links
            try {
                const url = new URL(href, window.location.href);
                if (url.hostname !== window.location.hostname) {
                    return false;
                }
            } catch (e) {
                // If URL parsing fails, assume it's internal
            }
        }

        return true;
    }

    function init() {
        // Hide transition on page load
        hideTransition();

        // Handle all clicks on links
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && shouldShowTransition(link)) {
                showTransition();
            }
        }, true);

        // Handle form submissions
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (shouldShowTransition(form)) {
                showTransition();
            }
        }, true);

        // Handle browser back/forward buttons
        window.addEventListener('pageshow', function(event) {
            // Always hide on pageshow (including back button)
            hideTransition();
        });

        // Ensure loader is hidden when page is fully loaded
        window.addEventListener('load', function() {
            hideTransition();
        });

        // Hide loader when page becomes visible
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                hideTransition();
            }
        });

        // Handle popstate (browser navigation)
        window.addEventListener('popstate', function() {
            hideTransition();
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose global functions for manual control
    window.showPageTransition = showTransition;
    window.hidePageTransition = hideTransition;

})();
