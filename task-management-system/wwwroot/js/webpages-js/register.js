function togglePassword(button) {
    const input = button.previousElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Password validation
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validatePassword(this.value);
        });
    }
});

function validatePassword(password) {
    // Length requirement
    updateRequirement('req-length', password.length >= 8);
    
    // Lowercase requirement
    updateRequirement('req-lowercase', /[a-z]/.test(password));
    
    // Uppercase requirement
    updateRequirement('req-uppercase', /[A-Z]/.test(password));
    
    // Number requirement
    updateRequirement('req-number', /[0-9]/.test(password));
    
    // Special character requirement
    updateRequirement('req-special', /[!@#$%^&*(),.?":;{}|<>]/.test(password));
}

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    const icon = element.querySelector('i');
    
    if (isValid) {
        icon.className = 'fas fa-check text-success';
        element.style.color = '#28a745';
    } else {
        icon.className = 'fas fa-times text-danger';
        element.style.color = '#6c757d';
    }
}
