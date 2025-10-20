// Global Search Functionality

$(document).ready(function() {
    const searchInput = $('#globalSearch');
    const searchClear = $('#searchClear');
    const searchResults = $('#searchResults');
    let searchTimeout;
    let isSearching = false;

    // Search input handler with debounce
    searchInput.on('input', function() {
        const query = $(this).val().trim();
        
        // Show/hide clear button
        if (query.length > 0) {
            searchClear.show();
        } else {
            searchClear.hide();
            searchResults.empty().hide();
            return;
        }

        // Debounce search
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            searchResults.empty().hide();
            return;
        }

        // Show loading state
        searchResults.html(`
            <div class="search-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Searching...</span>
            </div>
        `).show();

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Clear button handler
    searchClear.on('click', function() {
        searchInput.val('');
        searchClear.hide();
        searchResults.empty().hide();
        searchInput.focus();
    });

    // Click outside to close results
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.search-container').length) {
            searchResults.hide();
        }
    });

    // Focus input to show results again if there are any
    searchInput.on('focus', function() {
        if (searchResults.children().length > 0 && $(this).val().trim().length >= 2) {
            searchResults.show();
        }
    });

    // Perform the search
    function performSearch(query) {
        if (isSearching) return;
        
        isSearching = true;

        $.ajax({
            url: '/Dashboard/Search',
            method: 'GET',
            data: { query: query },
            success: function(response) {
                if (response.success) {
                    displaySearchResults(response.tasks, response.projects, query);
                } else {
                    showSearchError(response.message || 'Search failed');
                }
            },
            error: function(xhr) {
                console.error('Search error:', xhr);
                showSearchError('An error occurred while searching');
            },
            complete: function() {
                isSearching = false;
            }
        });
    }

    // Display search results
    function displaySearchResults(tasks, projects, query) {
        searchResults.empty();

        const totalResults = tasks.length + projects.length;

        if (totalResults === 0) {
            searchResults.html(`
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p>No results found for "${escapeHtml(query)}"</p>
                    <small>Try different keywords</small>
                </div>
            `).show();
            return;
        }

        let html = '<div class="search-results-container">';

        // Display tasks
        if (tasks.length > 0) {
            html += '<div class="search-section">';
            html += '<h6 class="search-section-title"><i class="fas fa-tasks"></i> Tasks</h6>';
            html += '<div class="search-items">';
            
            tasks.forEach(task => {
                const statusClass = task.status.toLowerCase();
                const priorityClass = task.priority.toLowerCase();
                const completedClass = task.isCompleted ? 'completed' : '';
                
                html += `
                    <a href="${task.url}" class="search-item ${completedClass}">
                        <div class="search-item-icon task-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="search-item-content">
                            <h6 class="search-item-title">${highlightMatch(escapeHtml(task.title), query)}</h6>
                            <p class="search-item-description">${highlightMatch(escapeHtml(task.description || ''), query)}</p>
                            <div class="search-item-meta">
                                <span class="badge badge-status badge-${statusClass}">${task.status}</span>
                                <span class="badge badge-priority badge-${priorityClass}">${task.priority}</span>
                                ${task.dueDate ? `<span class="badge badge-date"><i class="fas fa-calendar"></i> ${task.dueDate}</span>` : ''}
                            </div>
                        </div>
                    </a>
                `;
            });
            
            html += '</div></div>';
        }

        // Display projects
        if (projects.length > 0) {
            html += '<div class="search-section">';
            html += '<h6 class="search-section-title"><i class="fas fa-folder-open"></i> Projects</h6>';
            html += '<div class="search-items">';
            
            projects.forEach(project => {
                const statusClass = project.status.toLowerCase();
                const priorityClass = project.priority.toLowerCase();
                
                html += `
                    <a href="${project.url}" class="search-item">
                        <div class="search-item-icon project-icon">
                            <i class="fas fa-folder"></i>
                        </div>
                        <div class="search-item-content">
                            <h6 class="search-item-title">${highlightMatch(escapeHtml(project.name), query)}</h6>
                            <p class="search-item-description">${highlightMatch(escapeHtml(project.description || ''), query)}</p>
                            <div class="search-item-meta">
                                <span class="badge badge-status badge-${statusClass}">${project.status}</span>
                                <span class="badge badge-priority badge-${priorityClass}">${project.priority}</span>
                            </div>
                        </div>
                    </a>
                `;
            });
            
            html += '</div></div>';
        }

        html += '</div>';
        searchResults.html(html).show();
    }

    // Show search error
    function showSearchError(message) {
        searchResults.html(`
            <div class="search-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${escapeHtml(message)}</p>
            </div>
        `).show();
    }

    // Highlight matching text
    function highlightMatch(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Escape regex special characters
    function escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});
