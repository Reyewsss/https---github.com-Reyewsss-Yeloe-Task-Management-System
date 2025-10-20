// Logout functionality
$(document).ready(function() {
    // Logout modal handlers
    $('#logoutBtnDropdown').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#logoutModal').modal('show');
    });

    // Confirm logout button
    $('#confirmLogoutBtn').on('click', function(e) {
        e.preventDefault();
        handleLogout();
    });

    // Reset modal when closed
    $('#logoutModal').on('hidden.bs.modal', function() {
        resetLogoutButton();
    });

    // Prevent modal from closing during logout process
    $('#logoutModal').on('hide.bs.modal', function(e) {
        if ($('#confirmLogoutBtn').prop('disabled')) {
            e.preventDefault();
            return false;
        }
    });

    function handleLogout() {
        const btn = $('#confirmLogoutBtn');
        
        // Show loading state
        btn.prop('disabled', true);
        btn.find('.btn-text').hide();
        btn.find('.btn-loading').show();
        
        // Submit the form after a short delay for better UX
        setTimeout(() => {
            $('#logoutForm').submit();
        }, 500);
    }

    function resetLogoutButton() {
        const btn = $('#confirmLogoutBtn');
        btn.prop('disabled', false);
        btn.find('.btn-text').show();
        btn.find('.btn-loading').hide();
    }
});

// Notification functionality
$(document).ready(function() {
    let notificationCount = 0;

    // Check if notification elements exist
    if ($('#notificationBtn').length === 0) {
        console.warn('Notification button not found');
        return;
    }

    // Load notification count on page load
    loadNotificationCount();

    // Load notification count every 30 seconds
    setInterval(loadNotificationCount, 30000);

    // Load notifications when bell is clicked
    $('#notificationBtn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropdown = $('#notificationDropdown');
        const isVisible = dropdown.hasClass('show');
        
        // Close all dropdowns first
        $('.dropdown-menu').removeClass('show');
        
        if (!isVisible) {
            // Show the notification dropdown
            dropdown.addClass('show');
            
            // Load notifications immediately
            loadNotifications();
        }
    });

    // Close dropdowns when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.notification-menu, .user-menu, .quick-actions-menu').length) {
            $('.dropdown-menu').removeClass('show');
        }
    });

    // Toggle user dropdown
    $('#userMenuBtn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropdown = $('#userDropdown');
        const isVisible = dropdown.hasClass('show');
        
        // Close all dropdowns first
        $('.dropdown-menu').removeClass('show');
        
        if (!isVisible) {
            dropdown.addClass('show');
        }
    });

    // Toggle Quick Actions dropdown
    $('#quickActionsBtn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropdown = $('#quickActionsDropdown');
        const isVisible = dropdown.hasClass('show');
        
        // Close all dropdowns first
        $('.dropdown-menu').removeClass('show');
        
        if (!isVisible) {
            dropdown.addClass('show');
        }
    });

    // Mark all as read
    $('#markAllReadBtn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        markAllAsRead();
    });

    // View all notifications
    $('#viewAllNotificationsBtn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // TODO: Implement view all notifications page
        console.log('View all notifications clicked');
        $('.dropdown-menu').removeClass('show');
    });

    function loadNotificationCount() {
        $.get('/api/notifications/count')
            .done(function(data) {
                notificationCount = data.count || 0;
                updateNotificationBadge();
            })
            .fail(function(xhr) {
                console.log('Failed to load notification count:', xhr.status);
                // Don't show error for count, just hide badge
                notificationCount = 0;
                updateNotificationBadge();
            });
    }

    window.loadNotifications = function() {
        // Show loading state
        $('#notificationsList').html(`
            <div class="notification-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading notifications...</p>
            </div>
        `);

        $.get('/api/notifications')
            .done(function(data) {
                displayNotifications(data || []);
            })
            .fail(function(xhr) {
                console.log('Notification API failed:', xhr.status);
                
                if (xhr.status === 404) {
                    // API endpoint doesn't exist yet, show empty state
                    displayNotifications([]);
                } else {
                    $('#notificationsList').html(`
                        <div class="notification-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Failed to load notifications</p>
                            <button class="btn btn-sm yeloe-btn-outline" onclick="loadNotifications()">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                        </div>
                    `);
                }
            });
    }

    function displayNotifications(notifications) {
        const container = $('#notificationsList');
        container.empty();

        if (notifications.length === 0) {
            container.html(`
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                    <small class="text-muted">We'll notify you when something arrives</small>
                </div>
            `);
            return;
        }

        notifications.forEach(function(notification) {
            const timeAgo = getTimeAgo(notification.createdAt);
            const isUnread = !notification.isRead ? 'unread' : '';
            const typeIcon = getNotificationIcon(notification.type);
            const hasLink = notification.link ? true : false;
            const clickableClass = hasLink ? 'clickable' : '';
            
            container.append(`
                <div class="notification-item ${isUnread} ${clickableClass}" 
                     data-id="${notification.id}" 
                     data-link="${notification.link || ''}">
                    <div class="notification-content">
                        <div class="notification-icon">
                            <i class="${typeIcon}"></i>
                        </div>
                        <div class="notification-details">
                            <div class="notification-item-header">
                                <h6 class="notification-item-title">${notification.title}</h6>
                                <span class="notification-time">${timeAgo}</span>
                            </div>
                            <p class="notification-message">${notification.message}</p>
                        </div>
                    </div>
                    ${hasLink ? '<div class="notification-arrow"><i class="fas fa-chevron-right"></i></div>' : ''}
                </div>
            `);
        });

        // Add click handler for individual notifications
        $('.notification-item').on('click', function(e) {
            e.preventDefault();
            const notificationId = $(this).data('id');
            const link = $(this).data('link');
            
            // Mark as read if unread
            if ($(this).hasClass('unread')) {
                markAsRead(notificationId, $(this));
            }
            
            // Navigate to link if available
            if (link) {
                // Close the notification dropdown
                $('#notificationDropdown').removeClass('show');
                // Navigate to the link
                window.location.href = link;
            }
        });
    }

    function markAsRead(notificationId, element) {
        $.post(`/api/notifications/${notificationId}/read`)
            .done(function() {
                element.removeClass('unread');
                notificationCount = Math.max(0, notificationCount - 1);
                updateNotificationBadge();
            })
            .fail(function(xhr) {
                console.log('Failed to mark notification as read:', xhr.status);
            });
    }

    function markAllAsRead() {
        $.post('/api/notifications/mark-all-read')
            .done(function() {
                $('.notification-item').removeClass('unread');
                notificationCount = 0;
                updateNotificationBadge();
            })
            .fail(function(xhr) {
                console.log('Failed to mark all as read:', xhr.status);
            });
    }

    function updateNotificationBadge() {
        const badge = $('#notificationBadge');
        if (notificationCount > 0) {
            badge.text(notificationCount > 99 ? '99+' : notificationCount).show();
        } else {
            badge.hide();
        }
    }

    function getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + 'm ago';
        if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + 'h ago';
        if (diffInSeconds < 604800) return Math.floor(diffInSeconds / 86400) + 'd ago';
        return Math.floor(diffInSeconds / 604800) + 'w ago';
    }

    function getNotificationIcon(type) {
        const icons = {
            0: 'fas fa-user-plus',      // AccountCreated
            1: 'fas fa-tasks',          // TaskAssigned
            2: 'fas fa-calendar-alt',   // TaskDue
            3: 'fas fa-users',          // ProjectInvite
            4: 'fas fa-cog',            // System
            5: 'fas fa-key'             // PasswordReset
        };
        return icons[type] || 'fas fa-bell';
    }
});

// Quick Action Functions (Global)
function createNewTask() {
    // Check if we're on the task page
    if (typeof window.taskUrls !== 'undefined' && $('#newTaskBtn').length > 0) {
        $('#newTaskBtn').click();
    } else {
        // Navigate to task page
        window.location.href = '/Task/Index';
    }
}

function createNewProject() {
    // Check if we're on the project page
    if (typeof window.projectUrls !== 'undefined' && $('#newProjectBtn').length > 0) {
        $('#newProjectBtn').click();
    } else {
        // Navigate to project page
        window.location.href = '/Projects/Index';
    }
}