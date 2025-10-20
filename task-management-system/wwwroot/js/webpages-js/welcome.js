document.addEventListener('DOMContentLoaded', function() {
    const welcomeModalBtn = document.getElementById('welcomeModalBtn');
    const welcomeModalOverlay = document.getElementById('welcomeModalOverlay');

    if (welcomeModalBtn && welcomeModalOverlay) {
        welcomeModalBtn.addEventListener('click', function() {
            welcomeModalOverlay.style.opacity = '0';
            welcomeModalOverlay.style.transform = 'scale(0.8)';
            
            setTimeout(function() {
                welcomeModalOverlay.style.display = 'none';
            }, 300);
        });
        
        welcomeModalOverlay.addEventListener('click', function(e) {
            if (e.target === welcomeModalOverlay) {
                welcomeModalBtn.click();
            }
        });
    }
});
