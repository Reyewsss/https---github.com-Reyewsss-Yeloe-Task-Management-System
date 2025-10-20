document.addEventListener('DOMContentLoaded', function () {
    // Sidebar toggle functionality
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');

    // Desktop sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');

            // Save state to localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
    }

    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });
    }

    // Load saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState === 'true') {
        sidebar.classList.add('collapsed');
    }

    // Close mobile sidebar when clicking outside
    document.addEventListener('click', function (event) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                sidebar.classList.remove('show');
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('show');
        }
    });

    // Add active state to navigation links
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }

        link.addEventListener('click', function (e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
        });
    });

    // Animate dashboard cards on load
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });

    // Add smooth scrolling to page
    document.documentElement.style.scrollBehavior = 'smooth';
});