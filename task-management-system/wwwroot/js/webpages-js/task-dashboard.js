// Task Dashboard JavaScript
(function() {
    'use strict';

    let taskId = '';
    let comments = [];
    let workLog = [];
    let selectedFile = null;

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

    // Comments Functions
    window.addComment = async function() {
        const commentText = document.getElementById('commentText');
        const text = commentText.value.trim();

        if (!text) {
            showNotification('error', 'Please enter a comment');
            return;
        }

        try {
            const response = await fetch(window.taskData.addCommentUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId: taskId,
                    comment: text
                })
            });

            const result = await response.json();

            if (result.success) {
                commentText.value = '';
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

        const commentsHtml = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.author || 'You')}</span>
                    <span class="comment-date">${formatDate(comment.date)}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
            </div>
        `).join('');

        commentsList.innerHTML = commentsHtml;
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
                
                showNotification('success', 'Work submitted successfully!');
                loadWorkLog();
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
            }
        } catch (error) {
            console.error('Error loading work log:', error);
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
                    <span class="work-log-date">${formatDate(work.date)}</span>
                </div>
                <div class="work-log-description">${escapeHtml(work.description)}</div>
                ${work.fileName ? `
                    <div class="work-log-attachment">
                        ${renderFilePreview(work.fileName, work.fileUrl)}
                    </div>
                ` : ''}
            </div>
        `).join('');

        workLogList.innerHTML = workLogHtml;
    }

    // Utility Functions
    function showNotification(type, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
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

    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
        }

        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }

        .notification-success {
            border-left: 4px solid #4caf50;
        }

        .notification-success i {
            color: #4caf50;
        }

        .notification-error {
            border-left: 4px solid #f44336;
        }

        .notification-error i {
            color: #f44336;
        }

        .notification span {
            color: #333;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
})();
