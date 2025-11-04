// Active Navigation Based on Scroll Position
document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    // Function to remove active class from all nav links
    function removeActiveClasses() {
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
    }

    // Function to add active class to current nav link
    function addActiveClass(id) {
        removeActiveClasses();
        const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Scroll event listener to detect which section is in viewport
    function handleScroll() {
        let current = '';
        const scrollPosition = window.scrollY + 100; // Offset for navbar height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        if (current) {
            addActiveClass(current);
        }
    }

    // Smooth scroll and active state on nav link click
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Only handle hash links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    // Smooth scroll to section
                    const navbarHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = targetSection.offsetTop - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Add active class immediately
                    addActiveClass(targetId);

                    // Close mobile menu if open
                    const navbarCollapse = document.getElementById('navbarNav');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                            toggle: false
                        });
                        bsCollapse.hide();
                    }
                }
            }
        });
    });

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll);

    // Initial call to set active state on page load
    handleScroll();

    // Set initial active state based on URL hash
    if (window.location.hash) {
        const initialId = window.location.hash.substring(1);
        setTimeout(() => {
            addActiveClass(initialId);
        }, 100);
    } else {
        // Default to first nav link (Home) if no hash
        const firstLink = navLinks[0];
        if (firstLink) {
            const firstHref = firstLink.getAttribute('href');
            if (firstHref && firstHref.startsWith('#')) {
                addActiveClass(firstHref.substring(1));
            }
        }
    }
});
