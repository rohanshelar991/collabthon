// Collabthon Integrated Frontend - API Connection Layer
console.log('🚀 Initializing Collabthon Integrated Frontend...');

// State Management
let currentState = {
    isAuthenticated: false,
    currentUser: null,
    currentPage: 'home',
    projects: [],
    students: [],
    profiles: []
};

// Initialize the integrated application
async function initializeIntegratedApp() {
    console.log('Initializing integrated application...');
    
    // Check authentication status
    await checkAuthStatus();
    
    // Load initial data
    await loadInitialData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update UI based on auth state
    updateAuthUI();
    
    console.log('Integrated application initialized successfully!');
}

// Authentication Functions
async function checkAuthStatus() {
    try {
        const user = await api.getCurrentUser();
        currentState.isAuthenticated = true;
        currentState.currentUser = user;
        console.log('User authenticated:', user.username);
    } catch (error) {
        console.log('No valid authentication token found');
        currentState.isAuthenticated = false;
        currentState.currentUser = null;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        showLoadingIndicator('Logging in...');
        const result = await auth.login(credentials);
        
        if (result.success) {
            hideLoadingIndicator();
            showNotification('Login successful!', 'success');
            updateAuthUI();
            showPage('dashboard');
        } else {
            hideLoadingIndicator();
            showNotification(result.error, 'error');
        }
    } catch (error) {
        hideLoadingIndicator();
        showNotification('Login failed: ' + error.message, 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        showLoadingIndicator('Creating account...');
        const result = await auth.register(userData);
        
        if (result.success) {
            hideLoadingIndicator();
            showNotification('Account created successfully! Please login.', 'success');
            showPage('login');
        } else {
            hideLoadingIndicator();
            showNotification(result.error, 'error');
        }
    } catch (error) {
        hideLoadingIndicator();
        showNotification('Registration failed: ' + error.message, 'error');
    }
}

function handleLogout() {
    auth.logout();
    showNotification('Logged out successfully', 'info');
    showPage('home');
}

// Data Loading Functions
async function loadInitialData() {
    try {
        // Load projects
        const projectsResponse = await api.getProjects({ limit: 20 });
        currentState.projects = projectsResponse.items || [];
        renderProjects();
        
        // Load profiles
        const profilesResponse = await api.getProfiles({ limit: 20 });
        currentState.profiles = profilesResponse.items || [];
        renderProfiles();
        
        // Load statistics
        const stats = await api.getProjectStats();
        updateStatistics(stats);
        
    } catch (error) {
        console.error('Failed to load initial data:', error);
        // Fall back to mock data if API unavailable
        loadMockData();
    }
}

function loadMockData() {
    console.log('Loading mock data as fallback...');
    currentState.projects = getMockProjects();
    currentState.profiles = getMockProfiles();
    renderProjects();
    renderProfiles();
}

// UI Rendering Functions
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    currentState.projects.forEach(project => {
        const card = createProjectCard(project);
        grid.appendChild(card);
    });
}

function renderProfiles() {
    const grid = document.getElementById('studentsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    currentState.profiles.forEach(profile => {
        const card = createProfileCard(profile);
        grid.appendChild(card);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="card-header">
            <div>
                <h3 class="card-title">${project.title}</h3>
                <p class="card-subtitle">${project.status || 'Open'}</p>
            </div>
        </div>
        <p class="card-description">${project.description}</p>
        <div class="skills">
            ${(project.required_skills || []).map(skill => 
                `<span class="skill-tag">${skill}</span>`
            ).join('')}
        </div>
        <div class="card-footer">
            <div class="budget">₹${project.budget_min || 0} - ₹${project.budget_max || 'N/A'}</div>
            <button class="apply-btn" onclick="applyToProject(${project.id})">
                Apply Now
            </button>
        </div>
    `;
    return card;
}

function createProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
        <div class="card-header">
            <div class="avatar">${getInitials(profile.first_name, profile.last_name)}</div>
            <div>
                <h3 class="card-title">${profile.first_name} ${profile.last_name}</h3>
                <p class="card-subtitle">${profile.college}</p>
            </div>
        </div>
        <p class="card-description">${profile.bio || 'No bio available'}</p>
        <div class="skills">
            ${(JSON.parse(profile.skills || '[]') || []).map(skill => 
                `<span class="skill-tag">${skill}</span>`
            ).join('')}
        </div>
        <div class="card-footer">
            <span class="experience">${profile.experience || 'Entry level'}</span>
            <button class="apply-btn" onclick="connectWithStudent(${profile.user_id})">
                Connect
            </button>
        </div>
    `;
    return card;
}

// Helper Functions
function getInitials(firstName, lastName) {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

function getMockProjects() {
    return [
        {
            id: 1,
            title: "E-commerce Mobile App",
            description: "Building a React Native e-commerce application with payment integration",
            required_skills: ["React Native", "Firebase", "Stripe"],
            budget_min: 3000,
            budget_max: 5000,
            status: "open"
        },
        {
            id: 2,
            title: "Machine Learning Model",
            description: "Developing a recommendation system using Python and TensorFlow",
            required_skills: ["Python", "TensorFlow", "Data Science"],
            budget_min: 5000,
            budget_max: 8000,
            status: "open"
        }
    ];
}

function getMockProfiles() {
    return [
        {
            user_id: 1,
            first_name: "Rohan",
            last_name: "Shelar",
            college: "IIT Bombay",
            bio: "Full-stack developer passionate about building scalable web applications",
            skills: JSON.stringify(["React", "Node.js", "Python"]),
            experience: "2 years"
        },
        {
            user_id: 2,
            first_name: "Priya",
            last_name: "Sharma",
            college: "Delhi University",
            bio: "Data science enthusiast with expertise in machine learning algorithms",
            skills: JSON.stringify(["Python", "TensorFlow", "SQL"]),
            experience: "1 year"
        }
    ];
}

// Event Handlers
function setupEventListeners() {
    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutButton = document.getElementById('logoutButton');
    const projectForm = document.getElementById('projectForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmission);
    }
    
    // Search functionality
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterClick);
    });
}

async function handleProjectSubmission(event) {
    event.preventDefault();
    
    if (!currentState.isAuthenticated) {
        showNotification('Please login to post projects', 'warning');
        showPage('login');
        return;
    }
    
    const formData = new FormData(event.target);
    const projectData = {
        title: formData.get('projectTitle'),
        description: formData.get('projectDescription'),
        required_skills: formData.get('requiredSkills').split(',').map(s => s.trim()).filter(s => s),
        budget_min: parseFloat(formData.get('budgetMin')) || 0,
        budget_max: parseFloat(formData.get('budgetMax')) || 0,
        timeline: formData.get('timeline') || 'Flexible'
    };
    
    try {
        showLoadingIndicator('Posting project...');
        await api.createProject(projectData);
        hideLoadingIndicator();
        showNotification('Project posted successfully!', 'success');
        event.target.reset();
        loadInitialData(); // Refresh projects
    } catch (error) {
        hideLoadingIndicator();
        showNotification('Failed to post project: ' + error.message, 'error');
    }
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    if (query.length < 2) return;
    
    try {
        const results = await api.searchProjects(query, 10);
        currentState.projects = results;
        renderProjects();
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function handleFilterClick(event) {
    const filterType = event.target.dataset.filter;
    
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => 
        btn.classList.remove('active')
    );
    event.target.classList.add('active');
    
    // Apply filter (simplified for demo)
    if (filterType === 'all') {
        loadInitialData();
    } else {
        // Filter by skill
        const filtered = currentState.projects.filter(project =>
            project.required_skills?.some(skill => 
                skill.toLowerCase().includes(filterType.toLowerCase())
            )
        );
        currentState.projects = filtered;
        renderProjects();
    }
}

// UI Update Functions
function updateAuthUI() {
    const authElements = document.querySelectorAll('.auth-required');
    const guestElements = document.querySelectorAll('.guest-only');
    
    if (currentState.isAuthenticated) {
        authElements.forEach(el => el.style.display = 'block');
        guestElements.forEach(el => el.style.display = 'none');
        
        // Update user info
        const userInfo = document.querySelector('.user-info');
        if (userInfo && currentState.currentUser) {
            userInfo.textContent = currentState.currentUser.username;
        }
    } else {
        authElements.forEach(el => el.style.display = 'none');
        guestElements.forEach(el => el.style.display = 'block');
    }
}

function updateStatistics(stats) {
    // Update project statistics if elements exist
    const totalElement = document.querySelector('[data-stat="total"]');
    const openElement = document.querySelector('[data-stat="open"]');
    
    if (totalElement) totalElement.textContent = stats.total_projects || 0;
    if (openElement) openElement.textContent = stats.open_projects || 0;
}

// Utility Functions
function showLoadingIndicator(message = 'Loading...') {
    // Create or show loading overlay
    let loader = document.getElementById('loadingOverlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        loader.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; justify-content: center;
            align-items: center; z-index: 10000;
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001; animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIntegratedApp);
} else {
    initializeIntegratedApp();
}

// Make functions globally available
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.applyToProject = function(projectId) {
    if (!currentState.isAuthenticated) {
        showNotification('Please login to apply for projects', 'warning');
        showPage('login');
        return;
    }
    showNotification(`Applied to project ${projectId}!`, 'success');
};

window.connectWithStudent = function(userId) {
    if (!currentState.isAuthenticated) {
        showNotification('Please login to connect with students', 'warning');
        showPage('login');
        return;
    }
    showNotification(`Connection request sent to user ${userId}!`, 'success');
};