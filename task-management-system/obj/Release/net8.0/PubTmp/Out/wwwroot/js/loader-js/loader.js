/**
 * Smart Loader Controller with Redirect Logic
 * Works on any page/layout and handles redirects intelligently
 */
class SmartLoader {
    constructor(options = {}) {
        this.config = {
            loaderId: options.loaderId || 'loader',
            minDisplayTime: options.minDisplayTime || 1500,
            fadeDuration: options.fadeDuration || 500,
            enableRedirect: options.enableRedirect || false,
            redirectUrl: options.redirectUrl || null,
            ...options
        };

        this.loaderElement = document.getElementById(this.config.loaderId);
        this.currentPage = this.detectCurrentPage();
        this.init();
    }

    // Detect which page/layout we're on
    detectCurrentPage() {
        const path = window.location.pathname;

        // Check if we're on auth pages
        if (path.includes('/Auth/Login') || path.includes('/Auth/Register')) {
            return 'auth';
        }

        // Check if we're on home page
        if (path === '/' || path.includes('/Home/Index')) {
            return 'home';
        }

        // Default to main layout
        return 'main';
    }

    // Determine if redirect should happen
    shouldRedirect() {
        // Don't redirect on auth pages (login/register)
        if (this.currentPage === 'auth') {
            return false;
        }

        // Only redirect if enabled and URL is provided
        return this.config.enableRedirect && this.config.redirectUrl;
    }

    // Get appropriate redirect URL based on current page
    getRedirectUrl() {
        if (this.currentPage === 'auth') {
            // Never redirect from auth pages
            return null;
        }

        // Use custom redirect URL or default to home
        return this.config.redirectUrl || '/';
    }

    init() {
        if (!this.loaderElement) {
            console.warn('Loader element not found');
            return;
        }

        // Show loader immediately
        this.show();

        // Handle page load completion
        window.addEventListener('load', () => {
            this.handlePageLoaded();
        });

        // Safety timeout - always hide after 10 seconds
        setTimeout(() => this.hide(), 10000);
    }

    handlePageLoaded() {
        const displayTime = this.config.minDisplayTime;

        setTimeout(() => {
            if (this.shouldRedirect()) {
                this.redirectToPage();
            } else {
                this.hide();
            }
        }, displayTime);
    }

    redirectToPage() {
        const redirectUrl = this.getRedirectUrl();
        if (redirectUrl) {
            // Add fade-out animation before redirect
            this.loaderElement.classList.add('fade-out');

            setTimeout(() => {
                window.location.href = redirectUrl;
            }, this.config.fadeDuration);
        } else {
            this.hide();
        }
    }

    show() {
        if (this.loaderElement) {
            this.loaderElement.style.display = 'flex';
            this.loaderElement.classList.remove('fade-out');
            this.loaderElement.classList.add('fade-in');
        }
    }

    hide() {
        if (this.loaderElement) {
            this.loaderElement.classList.remove('fade-in');
            this.loaderElement.classList.add('fade-out');

            setTimeout(() => {
                if (this.loaderElement) {
                    this.loaderElement.style.display = 'none';
                }
            }, this.config.fadeDuration);
        }
    }

    // Public methods for manual control
    setRedirect(enabled, url = null) {
        this.config.enableRedirect = enabled;
        if (url) this.config.redirectUrl = url;
    }

    forceRedirect(url) {
        this.config.enableRedirect = true;
        this.config.redirectUrl = url;
        this.redirectToPage();
    }
}

// Auto-initialize with page-specific settings
document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname;

    // Configure based on current page
    let config = {
        minDisplayTime: 1500,
        fadeDuration: 500,
        enableRedirect: false // Default to no redirect
    };

    // Enable redirect only for specific pages
    if (path === '/' || path.includes('/Home')) {
        config.enableRedirect = false; // No redirect on home pages
    } else if (!path.includes('/Auth')) {
        // Enable redirect for other pages (except auth)
        config.enableRedirect = true;
        config.redirectUrl = '/'; // Redirect to home by default
    }

    window.smartLoader = new SmartLoader(config);
});