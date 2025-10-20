
        $(document).ready(function() {
            $('#newsletterForm').on('submit', function (e) {
                e.preventDefault();

                const form = $(this);
                const email = form.find('input[name="email"]').val();
                const submitBtn = form.find('.newsletter-button');
                const messageDiv = $('#newsletter-message');

                // Disable button and show loading state
                submitBtn.prop('disabled', true);
                submitBtn.find('i').removeClass('fa-paper-plane').addClass('fa-spinner fa-spin');

                // Clear previous messages
                messageDiv.hide().removeClass('alert-success alert-danger');

                // Send AJAX request
                $.ajax({
                    url: '/Auth/Newsletter',
                    type: 'POST',
                    data: { email: email },
                    success: function (response) {
                        if (response.success) {
                            messageDiv
                                .addClass('alert alert-success')
                                .text(response.message)
                                .fadeIn();
                            form[0].reset(); // Clear the form
                        } else {
                            messageDiv
                                .addClass('alert alert-danger')
                                .text(response.message)
                                .fadeIn();
                        }
                    },
                    error: function () {
                        messageDiv
                            .addClass('alert alert-danger')
                            .text('Sorry, something went wrong. Please try again later.')
                            .fadeIn();
                    },
                    complete: function () {
                        // Re-enable button and restore original icon
                        submitBtn.prop('disabled', false);
                        submitBtn.find('i').removeClass('fa-spinner fa-spin').addClass('fa-paper-plane');
                    }
                });
            });
        });