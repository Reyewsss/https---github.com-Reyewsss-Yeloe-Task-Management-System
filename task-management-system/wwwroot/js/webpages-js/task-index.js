// Task Index Page - Initialization and Helper Functions

// Set task URLs (will be populated from server)
window.taskUrls = window.taskUrls || {};

// Get filter from URL parameter and set initial filter
const urlParams = new URLSearchParams(window.location.search);
const filterParam = urlParams.get('filter');
window.initialFilter = filterParam || 'all';

// Function to combine date and time before form submission
window.combineDateAndTime = function() {
    const dateValue = document.getElementById('taskDueDate').value;
    
    if (!dateValue) {
        return null; // No date selected
    }

    const hourValue = document.getElementById('taskHour').value;
    const minuteValue = document.getElementById('taskMinute').value;
    const periodValue = document.getElementById('taskPeriod').value;

    // Default time if not specified
    let hour = 23;
    let minute = 59;

    // If time is specified, use it
    if (hourValue && minuteValue) {
        // Convert 12-hour format to 24-hour format
        hour = parseInt(hourValue);
        minute = parseInt(minuteValue);

        if (periodValue === 'PM' && hour !== 12) {
            hour += 12;
        } else if (periodValue === 'AM' && hour === 12) {
            hour = 0;
        }
    }

    // Create a Date object in local timezone
    const [year, month, day] = dateValue.split('-').map(Number);
    const dateTime = new Date(year, month - 1, day, hour, minute, 0);
    
    // Return ISO string (this will include timezone offset)
    return dateTime.toISOString();
};

// Handle date selection to show/hide time input
document.addEventListener('DOMContentLoaded', function() {
    const dueDateInput = document.getElementById('taskDueDate');
    const timeSection = document.getElementById('timeInputSection');
    const projectSelect = document.getElementById('taskProject');
    const assignedToSelect = document.getElementById('taskAssignedTo');
    
    // Load project members when project changes
    if (projectSelect && assignedToSelect) {
        projectSelect.addEventListener('change', async function() {
            const projectName = this.value;
            
            // Reset assigned to dropdown
            assignedToSelect.innerHTML = '<option value="">-- Not Assigned --</option>';
            
            if (projectName && projectName !== '__new__' && projectName !== '') {
                try {
                    const response = await fetch(`${window.taskUrls.getProjectMembersUrl}?projectName=${encodeURIComponent(projectName)}`);
                    const result = await response.json();
                    
                    if (result.success && result.members && result.members.length > 0) {
                        result.members.forEach(member => {
                            const option = document.createElement('option');
                            option.value = member.userId;
                            option.textContent = `${member.userName} (${member.role})`;
                            assignedToSelect.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Error loading project members:', error);
                }
            }
        });
    }
    
    if (dueDateInput && timeSection) {
        dueDateInput.addEventListener('change', function() {
            if (this.value) {
                // Show time input section with smooth animation
                timeSection.style.display = 'block';
                setTimeout(() => {
                    timeSection.style.opacity = '1';
                    timeSection.style.transform = 'translateY(0)';
                }, 10);
            } else {
                // Hide time input section
                timeSection.style.opacity = '0';
                timeSection.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    timeSection.style.display = 'none';
                }, 300);
            }
        });

        // Initialize time section style for animation
        timeSection.style.opacity = '0';
        timeSection.style.transform = 'translateY(-10px)';
        timeSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    // Handle hour input validation
    const hourInput = document.getElementById('taskHour');
    if (hourInput) {
        hourInput.addEventListener('input', function() {
            if (this.value > 12) this.value = 12;
            if (this.value < 0) this.value = '';
        });
    }

    // Handle minute input validation
    const minuteInput = document.getElementById('taskMinute');
    if (minuteInput) {
        minuteInput.addEventListener('input', function() {
            if (this.value > 59) this.value = 59;
            if (this.value < 0) this.value = '';
            // Pad with leading zero if single digit
            if (this.value.length === 1 && this.value > 0) {
                this.value = '0' + this.value;
            }
        });
    }
});
