// Task Dashboard JavaScript
(function() {
    'use strict';

    let taskId = '';
    let comments = [];
    let workLog = [];
    let selectedFile = null;
    let selectedCommentFile = null;

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        if (window.taskData) {
            taskId = window.taskData.taskId;
            initializeTaskDashboard();
        }
    });

    function initializeTaskDashboard() {
        loadComments();
        loadWorkLog();
        setupDragAndDrop();
        
        // Auto-refresh comments every 5 seconds to show new comments from other users
        setInterval(() => {
            loadComments();
        }, 5000);
        
        // Auto-refresh work log every 10 seconds
        setInterval(() => {
            loadWorkLog();
        }, 10000);
    }

    // File Upload Functions
    window.handleFileSelect = function(event) {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            displayFilePreview(file);
        }
    };

    window.removeFile = function() {
        selectedFile = null;
        document.getElementById('workFile').value = '';
        document.getElementById('filePreview').style.display = 'none';
        document.getElementById('fileLabel').textContent = 'Choose a file or drag & drop';
    };

    function displayFilePreview(file) {
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        filePreview.style.display = 'block';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    function setupDragAndDrop() {
        const uploadLabel = document.querySelector('.file-upload-label');
        if (!uploadLabel) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, () => {
                uploadLabel.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, () => {
                uploadLabel.classList.remove('drag-over');
            }, false);
        });

        uploadLabel.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                selectedFile = files[0];
                document.getElementById('workFile').files = files;
                displayFilePreview(files[0]);
            }
        }, false);
    }

    // Comment File Functions
    window.handleCommentFileSelect = function(event) {
        const file = event.target.files[0];
        if (file) {
            selectedCommentFile = file;
            displayCommentFilePreview(file);
        }
    };

    window.removeCommentFile = function() {
        selectedCommentFile = null;
        document.getElementById('commentFileInput').value = '';
        document.getElementById('commentFilePreview').style.display = 'none';
    };

    function displayCommentFilePreview(file) {
        const filePreview = document.getElementById('commentFilePreview');
        const fileName = document.getElementById('commentFileName');
        const fileIcon = document.getElementById('commentFileIcon');

        // Set appropriate icon based on file type
        const iconClass = getFileIcon(file.type, file.name);
        fileIcon.className = iconClass;

        fileName.textContent = file.name;
        filePreview.style.display = 'block';
    }

    function getFileIcon(fileType, fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Images
        if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
            return 'fas fa-file-image';
        }
        // PDFs
        if (fileType === 'application/pdf' || extension === 'pdf') {
            return 'fas fa-file-pdf';
        }
        // Word documents
        if (fileType.includes('word') || ['doc', 'docx'].includes(extension)) {
            return 'fas fa-file-word';
        }
        // Excel documents
        if (fileType.includes('excel') || fileType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension)) {
            return 'fas fa-file-excel';
        }
        // PowerPoint
        if (fileType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) {
            return 'fas fa-file-powerpoint';
        }
        // Archives
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
            return 'fas fa-file-archive';
        }
        // Code files
        if (['js', 'ts', 'css', 'html', 'json', 'xml', 'cs', 'java', 'py', 'php'].includes(extension)) {
            return 'fas fa-file-code';
        }
        // Text files
        if (fileType.startsWith('text/') || extension === 'txt') {
            return 'fas fa-file-alt';
        }
        // Videos
        if (fileType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
            return 'fas fa-file-video';
        }
        // Audio
        if (fileType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
            return 'fas fa-file-audio';
        }
        
        // Default
        return 'fas fa-file';
    }

    // Comments Functions
    window.addComment = async function() {
        const commentText = document.getElementById('commentText');
        const text = commentText.value.trim();

        if (!text && !selectedCommentFile) {
            showNotification('error', 'Please enter a comment or attach a file');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('comment', text);

            // Add file if selected
            if (selectedCommentFile) {
                formData.append('file', selectedCommentFile);
            }

            const response = await fetch(window.taskData.addCommentUrl, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                commentText.value = '';
                removeCommentFile();
                showNotification('success', 'Comment added successfully!');
                loadComments();
            } else {
                showNotification('error', result.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showNotification('error', 'An error occurred. Please try again.');
        }
    };

    async function loadComments() {
        try {
            const response = await fetch(`${window.taskData.getCommentsUrl}?taskId=${taskId}`);
            const result = await response.json();

            if (result.success) {
                comments = result.comments || [];
                renderComments();
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    function renderComments() {
        const commentsList = document.getElementById('commentsList');
        const commentCount = document.getElementById('commentCount');

        commentCount.textContent = comments.length;

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-comments">
                    <i class="fas fa-comment-slash"></i>
                    <p>No comments yet. Be the first to add one!</p>
                </div>
            `;
            return;
        }

        // Reverse comments to show newest at bottom (stack)
        const sortedComments = [...comments].reverse();

        const commentsHtml = sortedComments.map(comment => {
            // Convert text to HTML with clickable links
            const commentTextWithLinks = linkifyText(comment.text || comment.commentText);
            
            return `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author-info">
                        ${comment.profilePicture 
                            ? `<img src="${comment.profilePicture}" alt="${escapeHtml(comment.userName)}" class="comment-avatar-img" />` 
                            : '<i class="fas fa-user-circle"></i>'}
                        <span class="comment-author">${escapeHtml(comment.userName)}</span>
                    </div>
                    <span class="comment-date">${comment.timeAgo || formatDate(comment.createdAt)}</span>
                </div>
                <div class="comment-text">${commentTextWithLinks}</div>
                ${comment.fileUrl ? `
                    <div class="comment-attachment">
                        <a href="${comment.fileUrl}" target="_blank" class="attachment-link" download>
                            <i class="${getFileIcon(comment.fileType || '', comment.fileName || '')}"></i>
                            <span>${escapeHtml(comment.fileName || 'Download file')}</span>
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
        }).join('');

        commentsList.innerHTML = commentsHtml;
        
        // Scroll to bottom to show latest comment
        commentsList.scrollTop = commentsList.scrollHeight;
    }

    function linkifyText(text) {
        if (!text) return '';
        
        // Escape HTML first
        text = escapeHtml(text);
        
        // URL regex pattern
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        
        // Replace URLs with clickable links
        text = text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" class="comment-link">$1</a>');
        
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    // Work Functions
    window.submitWork = async function() {
        const workDescription = document.getElementById('workDescription').value.trim();

        if (!workDescription) {
            showNotification('error', 'Please enter a work description');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('description', workDescription);

            // Add file if selected
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const response = await fetch(window.taskData.addWorkUrl, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Clear form
                document.getElementById('workDescription').value = '';
                removeFile();
                
                showNotification('success', result.message || 'Work submitted successfully! Task status updated to In Progress.');
                
                // Reload page after a short delay to show updated status
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification('error', result.message || 'Failed to submit work');
            }
        } catch (error) {
            console.error('Error submitting work:', error);
            showNotification('error', 'An error occurred. Please try again.');
        }
    };

    async function loadWorkLog() {
        try {
            const response = await fetch(`${window.taskData.getWorkUrl}?taskId=${taskId}`);
            const result = await response.json();

            if (result.success) {
                workLog = result.workLog || [];
                renderWorkLog();
                
                // Update submit button state based on whether user has submitted work
                updateSubmitButtonState(result.hasSubmittedWork);
            }
        } catch (error) {
            console.error('Error loading work log:', error);
        }
    }

    function updateSubmitButtonState(hasSubmitted) {
        const submitButton = document.querySelector('button[onclick="submitWork()"]');
        
        if (submitButton) {
            // Check if task status is pending (visible in the page)
            const statusBadge = document.querySelector('.task-status-badge');
            const isPending = statusBadge && statusBadge.textContent.toLowerCase().includes('pending');
            
            if (hasSubmitted && !isPending) {
                // Change button to outline style, disabled state
                submitButton.classList.remove('btn-primary');
                submitButton.classList.add('btn-outline-success');
                submitButton.disabled = true;
                submitButton.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    Submitted
                `;
            } else if (isPending) {
                // Reset button to active state if task was returned to pending
                submitButton.classList.add('btn-primary');
                submitButton.classList.remove('btn-outline-success');
                submitButton.disabled = false;
                submitButton.innerHTML = `
                    <i class="fas fa-check"></i>
                    Submit Work
                `;
            }
        }
    }

    function renderWorkLog() {
        const workLogList = document.getElementById('workLogList');

        if (workLog.length === 0) {
            workLogList.innerHTML = `
                <div class="empty-work-log">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No work logged yet</p>
                </div>
            `;
            return;
        }

        const workLogHtml = workLog.map(work => `
            <div class="work-log-item">
                <div class="work-log-header">
                    <div class="work-log-author">
                        <i class="fas fa-user-circle"></i>
                        <span>${escapeHtml(work.userName)}</span>
                    </div>
                    <span class="work-log-date">${work.timeAgo}</span>
                </div>
                <div class="work-log-description">${escapeHtml(work.description)}</div>
                ${work.fileName ? `
                    <div class="work-log-attachment">
                        <a href="${work.fileUrl}" target="_blank" class="attachment-link">
                            <i class="fas fa-file"></i>
                            <span class="attachment-name">${escapeHtml(work.fileName)}</span>
                            ${work.fileSize ? `<span class="attachment-size">(${formatFileSize(work.fileSize)})</span>` : ''}
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');

        workLogList.innerHTML = workLogHtml;
    }

    // Utility Functions
    function showNotification(type, message) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    function formatDate(dateString) {
        if (!dateString) return 'Just now';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderFilePreview(fileName, fileUrl) {
        const extension = fileName.split('.').pop().toLowerCase();
        const fileNameEscaped = escapeHtml(fileName);
        
        // Image files
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
            return `
                <div class="file-preview-container">
                    <div class="file-preview-image">
                        <img src="${fileUrl}" alt="${fileNameEscaped}" onclick="openFileModal('${fileUrl}', '${fileNameEscaped}', 'image')">
                    </div>
                    <div class="file-info-bar">
                        <div class="file-info-content">
                            <i class="fas fa-image"></i>
                            <span class="file-name-text">${fileNameEscaped}</span>
                        </div>
                        <div class="file-actions">
                            <button class="file-action-btn" onclick="openFileModal('${fileUrl}', '${fileNameEscaped}', 'image')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <a href="${fileUrl}" download="${fileNameEscaped}" class="file-action-btn" title="Download">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // PDF files
        if (extension === 'pdf') {
            return `
                <div class="file-preview-container">
                    <div class="file-preview-pdf">
                        <iframe src="${fileUrl}" frameborder="0"></iframe>
                    </div>
                    <div class="file-info-bar">
                        <div class="file-info-content">
                            <i class="fas fa-file-pdf"></i>
                            <span class="file-name-text">${fileNameEscaped}</span>
                        </div>
                        <div class="file-actions">
                            <a href="${fileUrl}" target="_blank" class="file-action-btn" title="Open">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                            <a href="${fileUrl}" download="${fileNameEscaped}" class="file-action-btn" title="Download">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Video files
        if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
            return `
                <div class="file-preview-container">
                    <div class="file-preview-video">
                        <video controls>
                            <source src="${fileUrl}" type="video/${extension}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div class="file-info-bar">
                        <div class="file-info-content">
                            <i class="fas fa-video"></i>
                            <span class="file-name-text">${fileNameEscaped}</span>
                        </div>
                        <div class="file-actions">
                            <a href="${fileUrl}" download="${fileNameEscaped}" class="file-action-btn" title="Download">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Audio files
        if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
            return `
                <div class="file-preview-container">
                    <div class="file-preview-audio">
                        <i class="fas fa-music file-icon-large"></i>
                        <audio controls>
                            <source src="${fileUrl}" type="audio/${extension}">
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                    <div class="file-info-bar">
                        <div class="file-info-content">
                            <i class="fas fa-file-audio"></i>
                            <span class="file-name-text">${fileNameEscaped}</span>
                        </div>
                        <div class="file-actions">
                            <a href="${fileUrl}" download="${fileNameEscaped}" class="file-action-btn" title="Download">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Document files
        const docIcon = getDocumentIcon(extension);
        return `
            <div class="file-preview-container">
                <div class="file-preview-document">
                    <i class="${docIcon} file-icon-large"></i>
                    <span class="file-extension">${extension.toUpperCase()}</span>
                </div>
                <div class="file-info-bar">
                    <div class="file-info-content">
                        <i class="${docIcon}"></i>
                        <span class="file-name-text">${fileNameEscaped}</span>
                    </div>
                    <div class="file-actions">
                        <a href="${fileUrl}" target="_blank" class="file-action-btn" title="Open">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                        <a href="${fileUrl}" download="${fileNameEscaped}" class="file-action-btn" title="Download">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    function getDocumentIcon(extension) {
        const iconMap = {
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint',
            'txt': 'fas fa-file-alt',
            'csv': 'fas fa-file-csv',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive',
            '7z': 'fas fa-file-archive',
            'exe': 'fas fa-file-code',
            'json': 'fas fa-file-code',
            'xml': 'fas fa-file-code',
            'html': 'fas fa-file-code',
            'css': 'fas fa-file-code',
            'js': 'fas fa-file-code'
        };
        return iconMap[extension] || 'fas fa-file';
    }

    // Modal for viewing images
    window.openFileModal = function(fileUrl, fileName, type) {
        const modal = document.createElement('div');
        modal.className = 'file-modal-overlay';
        modal.innerHTML = `
            <div class="file-modal">
                <div class="file-modal-header">
                    <span>${escapeHtml(fileName)}</span>
                    <button class="file-modal-close" onclick="this.closest('.file-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="file-modal-body">
                    ${type === 'image' ? `<img src="${fileUrl}" alt="${escapeHtml(fileName)}">` : ''}
                </div>
                <div class="file-modal-footer">
                    <a href="${fileUrl}" download="${escapeHtml(fileName)}" class="btn btn-primary">
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };

    
    document.head.appendChild(style);
})();
