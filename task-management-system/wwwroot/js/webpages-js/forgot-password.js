$(document).ready(function() {
    $('#forgotPasswordForm').on('submit', function(e) {
        const submitBtn = $('#sendResetBtn');
        const btnIcon = $('#btnIcon');
        const btnText = $('#btnText');

        submitBtn.prop('disabled', true);
        btnIcon.removeClass('fa-paper-plane').addClass('fa-spinner fa-spin');
        btnText.text('Sending...');

        submitBtn.addClass('loading');
    });

    if ($('.alert-danger').length > 0) {
        resetButtonState();
    }

    function resetButtonState() {
        const submitBtn = $('#sendResetBtn');
        const btnIcon = $('#btnIcon');
        const btnText = $('#btnText');

        submitBtn.prop('disabled', false).removeClass('loading');
        btnIcon.removeClass('fa-spinner fa-spin').addClass('fa-paper-plane');
        btnText.text('Send Reset Link');
    }
});
