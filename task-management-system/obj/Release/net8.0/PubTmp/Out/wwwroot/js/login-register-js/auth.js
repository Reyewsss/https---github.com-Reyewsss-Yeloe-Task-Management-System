// Password visibility toggler
document.addEventListener('DOMContentLoaded', function () {
    // Add toggle buttons to password fields
    const passwordFields = document.querySelectorAll('input[type="password"]');

    passwordFields.forEach(field => {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';

        const parent = field.parentElement;
        parent.style.position = 'relative';
        parent.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', function () {
            const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
            field.setAttribute('type', type);

            // Toggle eye icon
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.className = 'fas fa-eye-slash';
            } else {
                icon.className = 'fas fa-eye';
            }
        });
    });

    // Google sign-in handler (placeholder)
    document.querySelectorAll('.google-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Google sign-in functionality would be implemented here');
            // Implement actual Google OAuth here
        });
    });
});