// Auto-submit when 6 digits are entered
document.addEventListener('DOMContentLoaded', function() {
    const verificationCodeInput = document.getElementById('VerificationCode');
    
    if (verificationCodeInput) {
        verificationCodeInput.addEventListener('input', function() {
            if (this.value.length === 6) {
            }
        });
    }
});
