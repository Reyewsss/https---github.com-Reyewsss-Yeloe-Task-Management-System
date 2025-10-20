$(document).ready(function() {
    let countdown = 5;
    const countdownElement = $('#countdown');

    const timer = setInterval(function() {
        countdown--;
        countdownElement.text(countdown);

        if (countdown <= 0) {
            clearInterval(timer);
            window.location.href = $('#redirectUrl').val();
        }
    }, 1000);

    $('.auth-btn').on('click', function() {
        clearInterval(timer);
    });
});
