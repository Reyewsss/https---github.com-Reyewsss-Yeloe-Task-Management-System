// Project Page JavaScript Functionality
(function () {
    'use strict';

    // Project Management Module
    const ProjectManager = {
        // Configuration
        config: {
            createUrl: null,
            deleteUrl: null,
            updateProgressUrl: null
        },

        // Initialize the project management system
        init: function (urls) {
            this.config = urls;
            this.bindEvents();
            this.setupEventHandlers();
            this.currentMode = 'create'; // Track if we're in create or edit mode
        },

        // Create confirmation modal structure
        createConfirmationModal: function () {
            const modalHtml = `
                <div id="confirmationModalOverlay" class="notification-modal-overlay">
                    <div class="notification-modal">
                        <div class="notification-modal-header">
                            <i id="confirmationIcon" class="notification-modal-icon fas fa-question-circle" style="color: #ff9800;"></i>
                            <h3 id="confirmationTitle" class="notification-modal-title">Confirm Action</h3>
                        </div>
                        <div class="notification-modal-body">
                            <p id="confirmationMessage"></p>
                        </div>
                        <div class="notification-modal-footer">
                            <button type="button" id="confirmationCancelBtn" class="notification-modal-btn notification-modal-btn-cancel">
                                Cancel
                            </button>
                            <button type="button" id="confirmationOkBtn" class="notification-modal-btn notification-modal-btn-submit" style="background: #f44336;">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Append to body if not already exists
            if (!document.getElementById('confirmationModalOverlay')) {
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            }
        },

        // Create notification modal structure
        createNotificationModal: function () {
            const modalHtml = `
                <div id="notificationModalOverlay" class="notification-modal-overlay">
                    <div class="notification-modal">
                        <div class="notification-modal-header">
                            <i id="notificationIcon" class="notification-modal-icon fas fa-check-circle"></i>
                            <h3 id="notificationTitle" class="notification-modal-title">Notification</h3>
                        </div>
                        <div class="notification-modal-body">
                            <p id="notificationMessage"></p>
                        </div>
                        <div class="notification-modal-footer">
                            <button type="button" id="notificationOkBtn" class="notification-modal-btn notification-modal-btn-submit">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Append to body if not already exists
            if (!document.getElementById('notificationModalOverlay')) {
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            }
        },

        // Show confirmation modal
        showConfirmation: function (message, onConfirm, onCancel) {
            const $ = jQuery;

            // Ensure confirmation modal exists
            this.createConfirmationModal();

            $('#confirmationMessage').text(message);

            // Remove existing event handlers
            $('#confirmationOkBtn').off('click');
            $('#confirmationCancelBtn').off('click');
            $('#confirmationModalOverlay').off('click');

            // Bind new event handlers
            $('#confirmationOkBtn').on('click', () => {
                this.hideConfirmationModal();
                if (onConfirm) onConfirm();
            });

            $('#confirmationCancelBtn').on('click', () => {
                this.hideConfirmationModal();
                if (onCancel) onCancel();
            });

            $('#confirmationModalOverlay').on('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.hideConfirmationModal();
                    if (onCancel) onCancel();
                }
            });

            // Show modal
            $('#confirmationModalOverlay').addClass('show');
            $('body').addClass('modal-open');
        },

        // Hide confirmation modal
        hideConfirmationModal: function () {
            const $ = jQuery;
            $('#confirmationModalOverlay').removeClass('show');
            $('body').removeClass('modal-open');
        },

        // Show notification modal
        showNotification: function (type, message) {
            const $ = jQuery;

            // Ensure notification modal exists
            this.createNotificationModal();

            // Set message
            $('#notificationMessage').text(message);

            // Configure modal appearance based on type
            const icon = $('#notificationIcon');
            const title = $('#notificationTitle');

            if (type === 'success') {
                icon.css('color', '#4CAF50');
                icon.removeClass().addClass('notification-modal-icon fas fa-check-circle');
                title.text('Success');
                $('#notificationOkBtn').css('background', '#4CAF50');
            } else if (type === 'error') {
                icon.css('color', '#f44336');
                icon.removeClass().addClass('notification-modal-icon fas fa-exclamation-circle');
                title.text('Error');
                $('#notificationOkBtn').css('background', '#f44336');
            } else {
                icon.css('color', '#2196F3');
                icon.removeClass().addClass('notification-modal-icon fas fa-info-circle');
                title.text('Information');
                $('#notificationOkBtn').css('background', '#2196F3');
            }

            // Remove existing event handlers
            $('#notificationOkBtn').off('click');
            $('#notificationModalOverlay').off('click');

            // Bind new event handlers
            $('#notificationOkBtn').on('click', () => {
                this.hideNotificationModal();
            });

            $('#notificationModalOverlay').on('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.hideNotificationModal();
                }
            });

            // Show modal
            $('#notificationModalOverlay').addClass('show');
            $('body').addClass('modal-open');

            // Auto-hide success notifications after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    if ($('#notificationModalOverlay').hasClass('show')) {
                        this.hideNotificationModal();
                    }
                }, 3000);
            }
        },

        // Hide notification modal
        hideNotificationModal: function () {
            const $ = jQuery;
            $('#notificationModalOverlay').removeClass('show');
            $('body').removeClass('modal-open');
        },

        // Bind all event handlers
        bindEvents: function () {
            const self = this;

            // Check if jQuery is available
            if (typeof jQuery === 'undefined') {
                console.error('jQuery is not loaded!');
                return;
            }

            const $ = jQuery;

            // New Project Button Click
            $('#newProjectBtn').off('click').on('click', function (e) {
                e.preventDefault();
                self.showProjectModal();
            });

            // Cancel Project Button
            $('#cancelProjectBtn').off('click').on('click', function (e) {
                e.preventDefault();
                self.hideProjectModal();
            });

            // Create/Edit Project Form Submit
            $('#createProjectForm').off('submit').on('submit', function (e) {
                e.preventDefault();
                if (self.currentMode === 'edit') {
                    self.updateProject();
                } else {
                    self.createProject();
                }
            });

            // Close modal when clicking overlay
            $('#projectModalOverlay').off('click').on('click', function (e) {
                if (e.target === this) {
                    self.hideProjectModal();
                }
            });

            // Close modal with Escape key
            $(document).off('keydown.projectModal').on('keydown.projectModal', function (e) {
                if (e.key === 'Escape' && $('#projectModalOverlay').hasClass('show')) {
                    self.hideProjectModal();
                }
                if (e.key === 'Escape' && $('#confirmationModalOverlay').hasClass('show')) {
                    self.hideConfirmationModal();
                }
                if (e.key === 'Escape' && $('#notificationModalOverlay').hasClass('show')) {
                    self.hideNotificationModal();
                }
            });
        },

        // Setup global event handlers
        setupEventHandlers: function () {
            const self = this;

            // Make functions globally available for inline onclick handlers
            window.showProjectModal = function () { self.openCreateModal(); };
            window.hideProjectModal = function () { self.hideProjectModal(); };
            window.editProject = function (projectId) { self.editProject(projectId); };
            window.deleteProject = function (projectId) { self.deleteProject(projectId); };
        },

        // Show the project creation modal
        showProjectModal: function () {
            const $ = jQuery;
            const modalOverlay = $('#projectModalOverlay');

            modalOverlay.addClass('show');
            $('body').addClass('modal-open');
        },

        // Hide the project creation modal
        hideProjectModal: function () {
            const $ = jQuery;
            $('#projectModalOverlay').removeClass('show');
            $('body').removeClass('modal-open');

            // Reset form after animation
            const self = this;
            setTimeout(function () {
                self.resetForm();
            }, 300);
        },

        // Reset the form to its initial state
        resetForm: function () {
            const $ = jQuery;
            $('#createProjectForm')[0].reset();
            $('.error-message').text('');
            this.currentMode = 'create';
            
            // Reset modal title and button text
            $('#modalTitle').text('Create New Project');
            $('#modalSubtitle').text('Add a new project to your workflow');
            $('#submitBtnText').text('Create Project');
            $('#submitProjectBtn i').removeClass('fa-spinner fa-spin fa-save').addClass('fa-plus');
            $('#progressGroup').hide();
            
            const btn = $('#submitProjectBtn');
            btn.removeClass('task-modal-btn-loading').prop('disabled', false);
        },

        // Clear form data
        clearForm: function () {
            const $ = jQuery;
            $('#createProjectForm')[0].reset();
            $('#projectId').val('');
            $('#progressValue').text('0%');
            $('.error-message').text('');
        },

        // Show modal (unified method)
        showModal: function () {
            const $ = jQuery;
            const modalOverlay = $('#projectModalOverlay');
            modalOverlay.addClass('show');
            $('body').addClass('modal-open');
        },

        // Create a new project
        createProject: function () {
            const $ = jQuery;
            const btn = $('#submitProjectBtn');
            btn.addClass('task-modal-btn-loading').prop('disabled', true);
            btn.find('i').removeClass('fa-plus').addClass('fa-spinner fa-spin');
            btn.find('span').text('Creating...');

            const formData = new FormData();
            formData.append('Name', $('#projectName').val());
            formData.append('Description', $('#projectDescription').val());
            formData.append('Status', $('#projectStatus').val());
            formData.append('Priority', $('#projectPriority').val());
            
            const startDate = $('#projectStartDate').val();
            const dueDate = $('#projectDueDate').val();
            if (startDate) formData.append('StartDate', startDate);
            if (dueDate) formData.append('DueDate', dueDate);
            formData.append('Progress', parseInt($('#projectProgress').val()) || 0);
            
            // Add anti-forgery token
            const token = $('input[name="__RequestVerificationToken"]').val();
            if (token) {
                formData.append('__RequestVerificationToken', token);
            }

            const self = this;
            $.ajax({
                url: this.config.createUrl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response.success) {
                        self.hideProjectModal();
                        self.showNotification('success', response.message || 'Project created successfully!');
                        // Reload page to show new project
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        self.showNotification('error', response.message || 'Failed to create project.');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error:', xhr.responseText);
                    self.showNotification('error', 'Failed to create project. Please try again.');
                },
                complete: function () {
                    btn.removeClass('task-modal-btn-loading').prop('disabled', false);
                    btn.find('i').removeClass('fa-spinner fa-spin').addClass('fa-plus');
                    btn.find('span').text('Create Project');
                }
            });
        },

        // Update an existing project
        updateProject: function () {
            const $ = jQuery;
            const btn = $('#submitProjectBtn');
            btn.addClass('task-modal-btn-loading').prop('disabled', true);
            btn.find('i').removeClass('fa-save').addClass('fa-spinner fa-spin');
            btn.find('span').text('Updating...');

            const projectId = $('#projectId').val();
            const formData = {
                Name: $('#projectName').val(),
                Description: $('#projectDescription').val(),
                Status: $('#projectStatus').val(),
                StartDate: $('#projectStartDate').val() || null,
                DueDate: $('#projectDueDate').val() || null,
                Progress: parseInt($('#projectProgress').val()) || 0,
                Priority: $('#projectPriority').val()
            };

            const self = this;
            $.ajax({
                url: this.config.updateUrl,
                type: 'POST',
                data: { id: projectId, ...formData },
                success: function (response) {
                    if (response.success) {
                        self.hideProjectModal();
                        self.updateProjectInList(response.project);
                        self.showNotification('success', response.message || 'Project updated successfully!');
                    } else {
                        self.showNotification('error', response.message || 'Failed to update project.');
                    }
                },
                error: function (xhr, status, error) {
                    self.showNotification('error', 'Failed to update project. Please try again.');
                },
                complete: function () {
                    self.resetForm();
                }
            });
        },

        // Update project in the list
        updateProjectInList: function (project) {
            const $ = jQuery;
            const projectCard = $(`.project-card[data-id="${project.id}"]`);
            
            if (projectCard.length) {
                const statusClass = project.status.toLowerCase().replace(' ', '-');
                
                // Update project card content
                projectCard.find('.project-header h3').text(project.name);
                projectCard.find('.project-status').removeClass().addClass(`project-status ${statusClass}`).text(project.status);
                projectCard.find('.project-description').text(project.description);
                
                // Update dates
                let datesHtml = '';
                if (project.startDate) {
                    datesHtml += `<small>Started: ${project.startDate}</small><br>`;
                }
                if (project.dueDate) {
                    datesHtml += `<small>Due: ${project.dueDate}</small>`;
                }
                projectCard.find('.project-dates').html(datesHtml);
            }
        },

        // Add a new project to the project list
        addProjectToList: function (project) {
            const $ = jQuery;
            const emptyState = $('.empty-state');
            if (emptyState.length) {
                emptyState.remove();
            }

            const statusClass = project.status.toLowerCase().replace(' ', '-');
            const projectHtml = `
                <div class="project-card" data-id="${project.id}">
                    <div class="project-header">
                        <h3>${project.name}</h3>
                        <span class="project-status ${statusClass}">${project.status}</span>
                    </div>
                    <p class="project-description">${project.description}</p>
                    <div class="project-meta">
                        <div class="project-progress">
                            <span>Progress: ${project.progress}%</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${project.progress}%"></div>
                            </div>
                        </div>
                        <div class="project-dates">
                            ${project.startDate ? `<small>Started: ${project.startDate}</small><br>` : ''}
                            ${project.dueDate ? `<small>Due: ${project.dueDate}</small>` : ''}
                        </div>
                        <div class="project-actions">
                            <button class="btn-icon edit" onclick="editProject('${project.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete" onclick="deleteProject('${project.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;

            $('.projects-grid').prepend(projectHtml);
        },

        // Edit a project
        editProject: function (projectId) {
            const self = this;
            const $ = jQuery;

            // First, fetch the project details
            $.get(this.config.getUrl, { id: projectId })
                .done(function (response) {
                    if (response.success) {
                        self.openEditModal(response.project);
                    } else {
                        self.showNotification('error', response.message || 'Failed to load project details');
                    }
                })
                .fail(function () {
                    self.showNotification('error', 'Failed to load project details');
                });
        },

        // Open modal in edit mode with project data
        openEditModal: function (project) {
            const $ = jQuery;
            
            // Set mode to edit
            this.currentMode = 'edit';
            
            // Update modal title and button text
            $('#modalTitle').text('Edit Project');
            $('#modalSubtitle').text('Update your project details');
            $('#submitBtnText').text('Update Project');
            $('#submitProjectBtn i').removeClass('fa-plus').addClass('fa-save');
            
            // Show progress field for editing
            $('#progressGroup').show();
            
            // Populate form with project data
            $('#projectId').val(project.id);
            $('#projectName').val(project.name);
            $('#projectDescription').val(project.description);
            $('#projectStatus').val(project.status);
            $('#projectPriority').val(project.priority);
            $('#projectStartDate').val(project.startDate);
            $('#projectDueDate').val(project.dueDate);
            $('#projectProgress').val(project.progress);
            $('#progressValue').text(project.progress + '%');
            
            // Show modal
            this.showModal();
        },

        // Open modal in create mode
        openCreateModal: function () {
            const $ = jQuery;
            
            // Set mode to create
            this.currentMode = 'create';
            
            // Update modal title and button text
            $('#modalTitle').text('Create New Project');
            $('#modalSubtitle').text('Add a new project to your workflow');
            $('#submitBtnText').text('Create Project');
            $('#submitProjectBtn i').removeClass('fa-save').addClass('fa-plus');
            
            // Hide progress field for new projects
            $('#progressGroup').hide();
            
            // Clear form
            this.clearForm();
            
            // Show modal
            this.showModal();
        },

        // Delete a project
        deleteProject: function (projectId) {
            const self = this;

            this.showConfirmation(
                'Are you sure you want to delete this project? This action cannot be undone.',
                function () {
                    // User confirmed deletion
                    const $ = jQuery;
                    
                    // Get anti-forgery token
                    const token = $('input[name="__RequestVerificationToken"]').val();
                    
                    $.ajax({
                        url: self.config.deleteUrl + '/' + projectId,
                        type: 'POST',
                        headers: {
                            'RequestVerificationToken': token
                        },
                        data: {
                            __RequestVerificationToken: token
                        },
                        success: function (response) {
                            if (response.success) {
                                $(`.project-card[data-id="${projectId}"]`).fadeOut(300, function () {
                                    $(this).remove();

                                    // Show empty state if no projects left
                                    if ($('.project-card').length === 0) {
                                        $('.projects-grid').html(`
                                            <div class="empty-state">
                                                <i class="fas fa-folder-open empty-icon"></i>
                                                <h3>No projects yet</h3>
                                                <p>Create your first project to get started with organizing your work.</p>
                                            </div>
                                        `);
                                    }
                                });
                                self.showNotification('success', response.message || 'Project deleted successfully!');
                            } else {
                                self.showNotification('error', response.message || 'Failed to delete project.');
                            }
                        },
                        error: function (xhr, status, error) {
                            self.showNotification('error', 'Failed to delete project. Please try again.');
                        }
                    });
                },
                function () {
                    // User cancelled deletion - no action needed
                }
            );
        }
    };

    // Initialize when DOM is ready
    function initializeProjectManager() {
        // Check if jQuery is available
        if (typeof jQuery === 'undefined') {
            console.error('jQuery is not loaded!');
            return;
        }

        // Initialize ProjectManager - URLs will be set from the Razor view
        if (window.projectUrls) {
            ProjectManager.init(window.projectUrls);
        }
    }

    // Try to initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            // Wait a bit more for jQuery to load
            setTimeout(initializeProjectManager, 100);
        });
    } else {
        // DOM is already ready
        setTimeout(initializeProjectManager, 100);
    }

    // Export ProjectManager for external access if needed
    window.ProjectManager = ProjectManager;

    // Global utility functions
    window.updateProgressValue = function(value) {
        const progressValueElement = document.getElementById('progressValue');
        if (progressValueElement) {
            progressValueElement.textContent = value + '%';
        }
    };
})();