$(document).ready(function() {
    // Set current date
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    $('#currentDate').text(now.toLocaleDateString('en-US', options));

    // Initialize task progress chart with real data
    const totalTasks = window.dashboardData.totalTasks;
    const completedTasks = window.dashboardData.completedTasks;
    const pendingTasks = window.dashboardData.pendingTasks;
    
    const completedPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const pendingPercentage = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;
    const notStartedPercentage = 100 - completedPercentage - pendingPercentage;

    const ctx = document.getElementById('taskProgressChart').getContext('2d');
    const taskProgressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [completedPercentage, pendingPercentage, Math.max(0, notStartedPercentage)],
                backgroundColor: [
                    '#4CAF50',
                    '#FF9800',
                    '#f44336'
                ],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Add animations and interactions
    $('.stat-card').hover(
        function() { $(this).addClass('hovered'); },
        function() { $(this).removeClass('hovered'); }
    );

    // Floating Action Button (FAB) functionality
    initializeFAB();
});

// Initialize Floating Action Button
function initializeFAB() {
    const fabMain = document.getElementById('fabMain');
    const fabActions = document.getElementById('fabActions');
    let isOpen = false;

    if (fabMain && fabActions) {
        // Toggle FAB menu
        fabMain.addEventListener('click', function(e) {
            e.stopPropagation();
            isOpen = !isOpen;
            
            if (isOpen) {
                fabMain.classList.add('active');
                fabActions.classList.add('active');
            } else {
                fabMain.classList.remove('active');
                fabActions.classList.remove('active');
            }
        });

        // Close FAB when clicking outside
        document.addEventListener('click', function(e) {
            if (isOpen && !fabMain.contains(e.target) && !fabActions.contains(e.target)) {
                isOpen = false;
                fabMain.classList.remove('active');
                fabActions.classList.remove('active');
            }
        });

        // Close FAB after clicking an action
        const fabActionButtons = document.querySelectorAll('.fab-action');
        fabActionButtons.forEach(button => {
            button.addEventListener('click', function() {
                isOpen = false;
                fabMain.classList.remove('active');
                fabActions.classList.remove('active');
            });
        });
    }
}

function animateNumbers() {
    $('.stat-number').each(function() {
        const $this = $(this);
        const countTo = parseInt($this.text());
        $this.text('0');
        
        $({ countNum: 0 }).animate({ countNum: countTo }, {
            duration: 2000,
            easing: 'swing',
            step: function() {
                $this.text(Math.floor(this.countNum));
            },
            complete: function() {
                $this.text(this.countNum);
            }
        });
    });
}

// Quick action functions
function createNewTask() {
    window.location.href = window.dashboardUrls.taskUrl;
}

function createNewProject() {
    window.location.href = window.dashboardUrls.projectUrl;
}

function viewReports() {
    window.location.href = window.dashboardUrls.reportUrl;
}

function manageTeam() {
    // Placeholder for team management
    alert('Team management feature coming soon!');
}
