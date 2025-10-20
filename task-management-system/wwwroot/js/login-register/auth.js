//// Auth page functionality
//document.addEventListener('DOMContentLoaded', function () {
//    console.log('Auth page loaded successfully');

//    // Form validation feedback
//    const forms = document.querySelectorAll('.auth-form');
//    forms.forEach(form => {
//        form.addEventListener('submit', function (e) {
//            const submitBtn = form.querySelector('.auth-btn');
//            if (submitBtn) {
//                submitBtn.style.opacity = '0.7';
//                submitBtn.disabled = true;

//                // Re-enable button after 3 seconds in case of validation errors
//                setTimeout(() => {
//                    submitBtn.style.opacity = '1';
//                    submitBtn.disabled = false;
//                }, 3000);
//            }
//        });
//    });

//    // Google button functionality (placeholder)
//    const googleBtns = document.querySelectorAll('.google-btn');
//    googleBtns.forEach(btn => {
//        btn.addEventListener('click', function () {
//            console.log('Google authentication clicked');
//            // Add Google OAuth integration here
//        });
//    });
//});