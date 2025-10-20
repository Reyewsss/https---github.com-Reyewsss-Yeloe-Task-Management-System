// Planner Page JavaScript with Google Calendar Integration

let calendar;
let googleAuth;
let currentEvent = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePlanner();
    initializeGoogleCalendarAPI();
});

function initializePlanner() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
        },
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        events: loadEvents,
        eventClick: handleEventClick,
        select: handleDateSelect,
        eventDrop: handleEventDrop,
        eventResize: handleEventResize
    });
    
    calendar.render();
    
    // Initialize event handlers
    initializeEventHandlers();
}

// Load events from server
async function loadEvents(info, successCallback, failureCallback) {
    try {
        const response = await fetch(window.plannerUrls.getEventsUrl);
        const result = await response.json();
        
        if (result.success) {
            successCallback(result.events);
        } else {
            failureCallback(result.message);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        failureCallback(error);
    }
}

// Handle event click
function handleEventClick(info) {
    currentEvent = info.event;
    const event = info.event.extendedProps;
    
    // Populate modal with event details
    document.getElementById('eventTitle').textContent = info.event.title;
    document.getElementById('eventDescription').textContent = event.description || 'No description';
    document.getElementById('eventDate').textContent = info.event.start.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('eventStatus').textContent = event.status || 'N/A';
    
    if (event.project) {
        document.getElementById('eventProjectDetail').style.display = 'flex';
        document.getElementById('eventProject').textContent = event.project;
    } else {
        document.getElementById('eventProjectDetail').style.display = 'none';
    }
    
    // Show modal
    document.getElementById('eventModalOverlay').classList.add('show');
}

// Handle date selection
function handleDateSelect(info) {
    // You can implement adding new events here
    console.log('Date selected:', info.startStr);
    // For now, redirect to task page
    window.location.href = window.plannerUrls.editTaskUrl;
}

// Handle event drop (drag and drop)
function handleEventDrop(info) {
    console.log('Event dropped:', info.event.title, 'to', info.event.start);
    // Here you would update the task/project due date via API
}

// Handle event resize
function handleEventResize(info) {
    console.log('Event resized:', info.event.title);
    // Here you would update the task/project due date via API
}

// Initialize event handlers
function initializeEventHandlers() {
    // View control buttons
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Update active state
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Change calendar view
            const viewMap = {
                'month': 'dayGridMonth',
                'week': 'timeGridWeek',
                'day': 'timeGridDay',
                'list': 'listMonth'
            };
            
            calendar.changeView(viewMap[view]);
        });
    });
    
    // Close event modal
    document.getElementById('closeEventModal').addEventListener('click', closeEventModal);
    document.getElementById('eventModalOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEventModal();
        }
    });
    
    // Edit event button
    document.getElementById('editEventBtn').addEventListener('click', function() {
        if (currentEvent) {
            const eventType = currentEvent.extendedProps.type;
            if (eventType === 'task') {
                window.location.href = window.plannerUrls.editTaskUrl;
            } else if (eventType === 'project') {
                window.location.href = window.plannerUrls.editProjectUrl + '/' + currentEvent.id;
            }
        }
    });
    
    // Delete event button
    document.getElementById('deleteEventBtn').addEventListener('click', function() {
        if (currentEvent && confirm('Are you sure you want to delete this event?')) {
            currentEvent.remove();
            closeEventModal();
            // Here you would call API to delete the task/project
        }
    });
    
    // Google Calendar sync button
    document.getElementById('syncGoogleBtn').addEventListener('click', openSyncModal);
    document.getElementById('closeSyncModal').addEventListener('click', closeSyncModal);
    document.getElementById('cancelSyncBtn').addEventListener('click', closeSyncModal);
    document.getElementById('confirmSyncBtn').addEventListener('click', handleGoogleSync);
    
    // Close sync modal when clicking outside
    document.getElementById('syncModalOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeSyncModal();
        }
    });
}

// Modal functions
function closeEventModal() {
    document.getElementById('eventModalOverlay').classList.remove('show');
    currentEvent = null;
}

function openSyncModal() {
    document.getElementById('syncModalOverlay').classList.add('show');
}

function closeSyncModal() {
    document.getElementById('syncModalOverlay').classList.remove('show');
}

// Google Calendar API Integration
function initializeGoogleCalendarAPI() {
    // Load the Google API client library
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = function() {
        gapi.load('client:auth2', initializeGoogleClient);
    };
    document.head.appendChild(script);
}

function initializeGoogleClient() {
    const config = window.googleCalendarConfig;
    
    gapi.client.init({
        apiKey: config.apiKey,
        clientId: config.clientId,
        discoveryDocs: config.discoveryDocs,
        scope: config.scope
    }).then(function() {
        googleAuth = gapi.auth2.getAuthInstance();
        
        // Check if user is already signed in
        if (googleAuth.isSignedIn.get()) {
            loadGoogleCalendarEvents();
        }
    }).catch(function(error) {
        console.error('Error initializing Google API:', error);
    });
}

async function handleGoogleSync() {
    const syncStatus = document.getElementById('syncStatus');
    const confirmBtn = document.getElementById('confirmSyncBtn');
    
    syncStatus.style.display = 'block';
    confirmBtn.disabled = true;
    
    try {
        // Sign in to Google
        await googleAuth.signIn();
        
        // Load Google Calendar events
        await loadGoogleCalendarEvents();
        
        // Show success message
        syncStatus.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
            <p>Successfully connected to Google Calendar!</p>
        `;
        
        setTimeout(() => {
            closeSyncModal();
            calendar.refetchEvents();
        }, 2000);
        
    } catch (error) {
        console.error('Error syncing with Google Calendar:', error);
        syncStatus.innerHTML = `
            <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
            <p>Failed to connect. Please try again.</p>
        `;
    } finally {
        confirmBtn.disabled = false;
    }
}

async function loadGoogleCalendarEvents() {
    try {
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 50,
            'orderBy': 'startTime'
        });
        
        const events = response.result.items;
        if (events.length > 0) {
            // Convert Google Calendar events to FullCalendar format
            const calendarEvents = events.map(event => ({
                title: event.summary,
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                backgroundColor: '#4285F4',
                borderColor: '#4285F4',
                extendedProps: {
                    description: event.description || '',
                    type: 'google',
                    location: event.location || ''
                }
            }));
            
            // Add Google events to calendar
            calendarEvents.forEach(event => {
                calendar.addEvent(event);
            });
        }
    } catch (error) {
        console.error('Error loading Google Calendar events:', error);
    }
}

// Add new event button handler
document.getElementById('addEventBtn')?.addEventListener('click', function() {
    // Redirect to task creation page
    window.location.href = window.plannerUrls.editTaskUrl;
});
