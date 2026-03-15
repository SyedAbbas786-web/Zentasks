// App State - Load from localStorage or use defaults
let tasks = JSON.parse(localStorage.getItem('tasks')) || [
    {
        id: Date.now() - 1000000,
        title: 'Welcome to TodoMaster!',
        completed: false,
        important: true,
        category: 'personal',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: Date.now() - 2000000,
        title: 'Click the checkbox to complete tasks',
        completed: false,
        important: false,
        category: 'work',
        priority: 'low',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    },
    {
        id: Date.now() - 3000000,
        title: 'Star important tasks',
        completed: true,
        important: true,
        category: 'personal',
        priority: 'high',
        dueDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    }
];

let currentFilter = 'all';
let currentCategory = 'all';
let sortOrder = 'newest';

// DOM Elements
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const filterTabs = document.querySelectorAll('.filter-tab');
const categoryItems = document.querySelectorAll('.category-item');
const navItems = document.querySelectorAll('.nav-item');
const sortBtn = document.getElementById('sortBtn');

// Create overlay for mobile
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

// Save to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Toggle sidebar on mobile
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// Format date nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// Check if date is overdue
function isOverdue(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

// Render tasks
function renderTasks() {
    let filteredTasks = [...tasks];
    
    // Apply category filter
    if (currentCategory && currentCategory !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
    }
    
    // Apply main filter
    switch(currentFilter) {
        case 'today':
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = filteredTasks.filter(task => task.dueDate === today);
            break;
        case 'important':
            filteredTasks = filteredTasks.filter(task => task.important === true);
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed === true);
            break;
        case 'pending':
            filteredTasks = filteredTasks.filter(task => task.completed === false);
            break;
        // 'all' shows everything
    }
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortOrder === 'oldest') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortOrder === 'priority') {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        } else if (sortOrder === 'dueDate') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    });
    
    // Update counts
    updateCounts();
    
    // Show empty state or tasks
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <i class="fas fa-clipboard-list"></i>
            <p>No tasks found</p>
            <small>Click the + button to add a new task</small>
        `;
    } else {
        emptyState.style.display = 'none';
        tasksList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
        
        // Add event listeners to new tasks
        filteredTasks.forEach(task => {
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            if (taskElement) {
                const checkbox = taskElement.querySelector('.task-checkbox');
                const deleteBtn = taskElement.querySelector('.delete-btn');
                const importantBtn = taskElement.querySelector('.important-btn');
                const editBtn = taskElement.querySelector('.edit-btn');
                
                checkbox?.addEventListener('change', (e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                });
                
                deleteBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                });
                
                importantBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleImportant(task.id);
                });
                
                editBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editTask(task.id);
                });
            }
        });
    }
}

// Create task HTML
function createTaskHTML(task) {
    const priorityClass = `priority-${task.priority}`;
    const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
    const overdue = isOverdue(task.dueDate) && !task.completed;
    const dateDisplay = formatDate(task.dueDate);
    
    return `
        <div class="task-item ${overdue ? 'task-overdue' : ''}" data-task-id="${task.id}">
            <div class="task-check">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            </div>
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="task-category">
                        <i class="fas ${getCategoryIcon(task.category)}"></i> ${task.category}
                    </span>
                    <span class="task-priority ${priorityClass}">
                        ${priorityIcon} ${task.priority}
                    </span>
                    <span class="task-date ${overdue ? 'date-overdue' : ''}">
                        <i class="far fa-calendar"></i> ${dateDisplay}
                        ${overdue ? ' (Overdue)' : ''}
                    </span>
                    ${task.important ? '<span class="task-important"><i class="fas fa-star"></i> Important</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="important-btn" title="Mark important">
                    <i class="fa${task.important ? 's' : 'r'} fa-star"></i>
                </button>
                <button class="delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        work: 'fa-briefcase',
        personal: 'fa-user',
        shopping: 'fa-shopping-cart',
        health: 'fa-heart',
        education: 'fa-book'
    };
    return icons[category] || 'fa-tag';
}

// Update counts
function updateCounts() {
    document.getElementById('totalCount').textContent = tasks.length;
    document.getElementById('todayCount').textContent = tasks.filter(t => {
        const today = new Date().toISOString().split('T')[0];
        return t.dueDate === today && !t.completed;
    }).length;
    document.getElementById('importantCount').textContent = tasks.filter(t => t.important && !t.completed).length;
    document.getElementById('completedCount').textContent = tasks.filter(t => t.completed).length;
}

// Add task
function addTask() {
    const title = taskInput.value.trim();
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    // Simple prompt for options (in a real app, use a modal)
    const category = prompt('Enter category (work, personal, shopping):', 'personal');
    if (!category) return;
    
    const priority = prompt('Enter priority (high, medium, low):', 'medium');
    if (!priority) return;
    
    const newTask = {
        id: Date.now(),
        title: title,
        completed: false,
        important: false,
        category: category.toLowerCase(),
        priority: priority.toLowerCase(),
        dueDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    taskInput.value = '';
    renderTasks();
    
    // Show success message
    showNotification('Task added successfully!');
}

// Edit task
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle === null) return;
    
    if (newTitle.trim()) {
        task.title = newTitle.trim();
        saveTasks();
        renderTasks();
        showNotification('Task updated!');
    }
}

// Toggle task completion
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        
        if (task.completed) {
            showNotification('Task completed! 🎉');
        }
    }
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        showNotification('Task deleted');
    }
}

// Toggle important
function toggleImportant(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.important = !task.important;
        saveTasks();
        renderTasks();
        
        if (task.important) {
            showNotification('Marked as important ⭐');
        }
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #6366f1;
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        z-index: 2000;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
    
    .task-overdue {
        border-left: 3px solid #ef4444 !important;
    }
    
    .date-overdue {
        color: #ef4444 !important;
        font-weight: bold;
    }
    
    .notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
`;
document.head.appendChild(style);

// Event Listeners
addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Filter tabs
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderTasks();
        
        // Update active nav item
        navItems.forEach(item => {
            if (item.dataset.filter === currentFilter) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    });
});

// Category items
categoryItems.forEach(item => {
    item.addEventListener('click', () => {
        categoryItems.forEach(c => c.classList.remove('active'));
        item.classList.add('active');
        currentCategory = item.dataset.category;
        renderTasks();
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
});

// Navigation items
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        const filter = item.dataset.filter;
        if (filter) {
            currentFilter = filter;
            
            // Update filter tabs
            filterTabs.forEach(tab => {
                if (tab.dataset.filter === filter) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            renderTasks();
        }
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
});

// Sort button
let sortIndex = 0;
const sortOptions = ['newest', 'oldest', 'priority', 'dueDate'];
const sortIcons = {
    newest: 'fa-sort-amount-down',
    oldest: 'fa-sort-amount-up',
    priority: 'fa-star',
    dueDate: 'fa-calendar'
};

sortBtn.addEventListener('click', () => {
    sortIndex = (sortIndex + 1) % sortOptions.length;
    sortOrder = sortOptions[sortIndex];
    
    // Update icon
    const icon = sortBtn.querySelector('i');
    icon.className = `fas ${sortIcons[sortOrder]}`;
    
    // Show sort mode
    showNotification(`Sorting by: ${sortOrder}`);
    
    renderTasks();
});

// Clear completed tasks
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        showNotification('No completed tasks to clear');
        return;
    }
    
    if (confirm(`Clear ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        showNotification('Completed tasks cleared');
    }
}

// Add clear completed button
const clearBtn = document.createElement('button');
clearBtn.className = 'clear-completed-btn';
clearBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Clear Completed';
clearBtn.style.cssText = `
    background: none;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    padding: 8px 16px;
    border-radius: 8px;
    margin-top: 16px;
    width: 100%;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
`;
clearBtn.addEventListener('mouseenter', () => {
    clearBtn.style.background = '#f3f4f6';
    clearBtn.style.color = '#ef4444';
});
clearBtn.addEventListener('mouseleave', () => {
    clearBtn.style.background = 'none';
    clearBtn.style.color = '#6b7280';
});
clearBtn.addEventListener('click', clearCompleted);

// Add clear button to sidebar
document.querySelector('.categories').appendChild(clearBtn);

// Export tasks
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Tasks exported!');
}

// Add export button
const exportBtn = document.createElement('button');
exportBtn.className = 'export-btn';
exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Tasks';
exportBtn.style.cssText = clearBtn.style.cssText + 'margin-top: 8px;';
exportBtn.addEventListener('click', exportTasks);
document.querySelector('.categories').appendChild(exportBtn);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        taskInput.focus();
    }
    
    // / to focus search
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        taskInput.focus();
    }
    
    // Escape to blur input
    if (e.key === 'Escape') {
        taskInput.blur();
    }
});

// Initial render
renderTasks();

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
});

// Add sample tasks button
function addSampleTasks() {
    if (tasks.length > 3) {
        if (!confirm('This will add sample tasks. Continue?')) {
            return;
        }
    }
    
    const sampleTasks = [
        {
            id: Date.now() - 5000000,
            title: 'Complete project presentation',
            completed: false,
            important: true,
            category: 'work',
            priority: 'high',
            dueDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() - 4000000,
            title: 'Buy groceries for the week',
            completed: false,
            important: false,
            category: 'shopping',
            priority: 'medium',
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() - 3000000,
            title: 'Call doctor for appointment',
            completed: false,
            important: true,
            category: 'personal',
            priority: 'high',
            dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() - 2000000,
            title: 'Read 30 minutes',
            completed: false,
            important: false,
            category: 'personal',
            priority: 'low',
            dueDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() - 1000000,
            title: 'Team meeting',
            completed: true,
            important: false,
            category: 'work',
            priority: 'medium',
            dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        }
    ];
    
    tasks = [...tasks, ...sampleTasks];
    saveTasks();
    renderTasks();
    showNotification('Sample tasks added!');
}

// Add sample tasks button
const sampleBtn = document.createElement('button');
sampleBtn.className = 'sample-btn';
sampleBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Samples';
sampleBtn.style.cssText = clearBtn.style.cssText + 'margin-top: 8px; background: #f3f4f6; color: #6366f1;';
sampleBtn.addEventListener('click', addSampleTasks);
document.querySelector('.categories').appendChild(sampleBtn);