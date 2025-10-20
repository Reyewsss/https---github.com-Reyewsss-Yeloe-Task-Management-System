/**
 * Scroll Animation Controller
 * Handles intro and outro animations based on scroll position
 */

class ScrollAnimations {
    constructor() {
        this.sections = [];
        this.isInitialized = false;
        this.throttleTime = 16; // ~60fps
        this.lastScrollTime = 0;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find all sections with animation classes
        this.findAnimatedSections();
        
        // Set up intersection observer for better performance
        this.setupIntersectionObserver();
        
        // Add scroll listener for outro effects
        this.setupScrollListener();
        
        // Initial check
        this.checkAnimations();
        
        this.isInitialized = true;
        console.log('Scroll animations initialized');
    }

    findAnimatedSections() {
        const animationClasses = [
            'animate-section',
            'fade-in-left',
            'fade-in-right',
            'scale-up',
            'slide-up',
            'rotate-fade',
            'stagger-item',
            'hero-text-reveal',
            'hero-image-reveal',
            'icon-reveal'
        ];

        animationClasses.forEach(className => {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(element => {
                if (!this.sections.find(section => section.element === element)) {
                    this.sections.push({
                        element: element,
                        className: className,
                        hasTriggered: false,
                        isVisible: false
                    });
                }
            });
        });
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-10% 0px -10% 0px', // Trigger when element is 10% in viewport
            threshold: [0.1, 0.3, 0.5, 0.7, 0.9]
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const section = this.sections.find(s => s.element === entry.target);
                if (section) {
                    section.isVisible = entry.isIntersecting;
                    section.visibilityRatio = entry.intersectionRatio;
                    
                    if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                        // Element is entering viewport - trigger intro
                        this.triggerIntro(section);
                    } else if (!entry.isIntersecting && section.hasTriggered) {
                        // Element is leaving viewport - trigger outro
                        this.triggerOutro(section);
                    }
                }
            });
        }, options);

        // Observe all animated sections
        this.sections.forEach(section => {
            this.observer.observe(section.element);
        });
    }

    setupScrollListener() {
        let ticking = false;

        const handleScroll = () => {
            const currentTime = Date.now();
            
            if (currentTime - this.lastScrollTime < this.throttleTime) return;
            
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScrollEffects();
                    ticking = false;
                });
                ticking = true;
            }
            
            this.lastScrollTime = currentTime;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // FIXED: Modern scroll position detection
    getScrollTop() {
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    handleScrollEffects() {
        const scrollTop = this.getScrollTop();
        const windowHeight = window.innerHeight;
        
        this.sections.forEach(section => {
            const rect = section.element.getBoundingClientRect();
            const elementTop = rect.top + scrollTop;
            const elementHeight = rect.height;
            const elementBottom = elementTop + elementHeight;
            
            const viewportTop = scrollTop;
            const viewportBottom = scrollTop + windowHeight;
            
            // Calculate visibility percentage
            const visibleTop = Math.max(elementTop, viewportTop);
            const visibleBottom = Math.min(elementBottom, viewportBottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const visibilityPercentage = visibleHeight / elementHeight;
            
            // Apply outro effects based on scroll position - REMOVED OPACITY
            if (section.hasTriggered && visibilityPercentage < 0.7 && visibilityPercentage > 0) {
                this.applyOutroEffect(section, visibilityPercentage);
            }
        });
    }

    triggerIntro(section) {
        if (section.hasTriggered) return;
        
        section.hasTriggered = true;
        section.element.classList.remove('outro');
        section.element.classList.add('intro');
        
        // Clear any inline styles that might affect clarity
        section.element.style.opacity = '';
        section.element.style.filter = '';
        
        // Handle stagger animations
        if (section.className === 'stagger-item') {
            const parent = section.element.parentElement;
            const siblings = parent.querySelectorAll('.stagger-item');
            siblings.forEach((sibling, index) => {
                setTimeout(() => {
                    sibling.classList.add('intro');
                    sibling.style.opacity = '';
                    sibling.style.filter = '';
                }, index * 100);
            });
        }
    }

    triggerOutro(section) {
        if (!section.hasTriggered) return;
        
        section.element.classList.remove('intro');
        section.element.classList.add('outro');
    }

    // UPDATED: Remove opacity changes for clearer elements
    applyOutroEffect(section, visibilityPercentage) {
        const element = section.element;
        const intensity = 1 - visibilityPercentage;
        
        // Apply dynamic outro effects based on visibility - NO OPACITY CHANGES
        if (intensity > 0.3) {
            element.style.transform = `translateY(${-5 * intensity}px) scale(${1 - (0.01 * intensity)})`;
            // REMOVED: element.style.opacity = Math.max(0.6, 1 - (0.4 * intensity));
        }
    }

    checkAnimations() {
        // Force check all animations on load
        this.sections.forEach(section => {
            const rect = section.element.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
                this.triggerIntro(section);
            }
        });
    }

    // Public method to manually trigger animations
    triggerAnimation(selector, delay = 0) {
        setTimeout(() => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('intro');
                element.style.opacity = '';
                element.style.filter = '';
            }
        }, delay);
    }

    // Public method to reset animations
    resetAnimations() {
        this.sections.forEach(section => {
            section.element.classList.remove('intro', 'outro');
            section.element.style.transform = '';
            section.element.style.opacity = '';
            section.element.style.filter = '';
            section.hasTriggered = false;
        });
        this.checkAnimations();
    }
}

// Initialize scroll animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.scrollAnimations = new ScrollAnimations();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollAnimations;
}