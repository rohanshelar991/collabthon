// Collabthon Integrated Frontend - Complete UI and API Solution
console.log('🚀 Initializing Collabthon Integrated Frontend...');

// Initialize all functionality on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// State Management
let currentState = {
    isAuthenticated: false,
    currentUser: null,
    currentPage: 'home',
    projects: [],
    students: [],
    profiles: []
};

// Initialize the complete application
async function initializeApp() {
    console.log('Initializing complete application...');
    
    try {
        // Initialize UI functionality first
        initializeNavigation();
        initializeThemeToggle();
        initializeMobileMenu();
        initializePages();
        initializeSearch();
        initializeFilters();
        initializeScrollEffects();
        setupFormHandlers();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI based on auth state
        updateAuthUI();
        
        // Then handle API functionality
        await checkAuthStatus();
        await loadInitialData();
        
        console.log('Complete application initialized successfully!');
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('Application initialization failed, loading with limited functionality', 'warning');
        // Still show the UI with mock data
        populateMockData();
    } finally {
        // Always hide the loading indicator
        setTimeout(hideLoadingIndicator, 1000);
    }
}

// Navigation System
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const mobileNavItems = document.querySelectorAll('#mobileMenu a[data-page]');
    
    // Desktop navigation
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
            
            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Mobile navigation
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
            closeMobileMenu();
            
            // Update active states
            mobileNavItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Page Management
function initializePages() {
    const pages = document.querySelectorAll('.page');
    const hash = window.location.hash.substring(1) || 'home';
    
    // Show initial page
    showPage(hash);
    
    // Handle browser back/forward
    window.addEventListener('hashchange', function() {
        const newHash = window.location.hash.substring(1) || 'home';
        showPage(newHash);
    });
}

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show requested page
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
        window.location.hash = pageName;
        
        // Update navigation active states
        updateNavigationStates(pageName);
        
        // Special handling for services page to render talent cards
        if (pageName === 'services') {
            renderTalentCards();
            
            // Reset filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => 
                btn.classList.remove('active')
            );
            // Set 'All Talents' as active
            const allTalentsBtn = document.querySelector('[data-filter="all"]');
            if (allTalentsBtn) {
                allTalentsBtn.classList.add('active');
            }
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`Showing page: ${pageName}`);
    }
}

function updateNavigationStates(activePage) {
    // Update desktop navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        if (item.getAttribute('data-page') === activePage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update mobile navigation
    document.querySelectorAll('#mobileMenu a[data-page]').forEach(item => {
        if (item.getAttribute('data-page') === activePage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Mobile Menu
function initializeMobileMenu() {
    const menuToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            this.classList.toggle('active');
        });
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('navToggle');
    
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }
    if (menuToggle) {
        menuToggle.classList.remove('active');
    }
}

// Theme Toggle
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        updateThemeToggleIcons(true);
    }
    
    // Desktop theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
        });
    }
    
    // Mobile theme toggle
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', function() {
            toggleTheme();
            closeMobileMenu();
        });
    }
    
    // Listen for OS theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.documentElement.classList.add('dark');
                updateThemeToggleIcons(true);
            } else {
                document.documentElement.classList.remove('dark');
                updateThemeToggleIcons(false);
            }
        }
    });
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeToggleIcons(isDark);
}

function updateThemeToggleIcons(isDark) {
    const desktopIcon = document.querySelector('#themeToggle .material-symbols-outlined');
    const mobileIcon = document.querySelector('#mobileThemeToggle .material-symbols-outlined');
    
    if (desktopIcon) {
        desktopIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
    if (mobileIcon) {
        mobileIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
}

// Search Functionality
function initializeSearch() {
    const searchInput = document.getElementById('studentSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterStudents(searchTerm);
        }, 300));
    }
}

function filterStudents(searchTerm) {
    const studentCards = document.querySelectorAll('.student-card');
    
    studentCards.forEach(card => {
        const name = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const skills = Array.from(card.querySelectorAll('.skill-tag') || []).map(el => el.textContent.toLowerCase()).join(' ');
        const college = card.querySelector('.card-subtitle')?.textContent.toLowerCase() || '';
        
        const matches = name.includes(searchTerm) || 
                       skills.includes(searchTerm) || 
                       college.includes(searchTerm);
        
        card.style.display = matches ? 'block' : 'none';
    });
}

// Filter Functionality
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            filterProjects(filter);
        });
    });
}

function filterProjects(category) {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            // For demo purposes, just show all since we don't have category attribute
            card.style.display = 'block';
        }
    });
}

// Form Handlers
function setupFormHandlers() {
    // Project form
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Project posted successfully! Students will be notified.');
            this.reset();
        });
    }
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your submission! We\'ll connect you with suitable collaborators soon.');
            this.reset();
        });
    }
}

// Scroll Effects Functionality
function initializeScrollEffects() {
    const scrollProgressBar = document.querySelector('.scroll-progress-bar');
    const backToTopButton = document.getElementById('backToTop');
    
    // Scroll progress indicator
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        if (scrollProgressBar) {
            scrollProgressBar.style.transform = `scaleX(${scrollPercent / 100})`;
        }
        
        // Back to top button visibility
        if (backToTopButton) {
            if (scrollTop > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        }
    });
    
    // Back to top button click handler
    if (backToTopButton) {
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    console.log('📊 Scroll effects initialized');
}

// Mock data for initial display
function populateMockData() {
    // Populate with sample projects if none loaded from API
    if (document.getElementById('projectsGrid') && currentState.projects.length === 0) {
        const mockProjects = getMockProjects();
        currentState.projects = mockProjects;
        renderProjects();
    }
    
    // Populate with sample profiles if none loaded from API
    if (document.getElementById('studentsGrid') && currentState.profiles.length === 0) {
        const mockProfiles = getMockProfiles();
        currentState.profiles = mockProfiles;
        renderProfiles();
    }
}

// Utility function to show student profile
function showStudentProfile(name) {
    alert(`Viewing profile for ${name}\n\nIn a real application, this would show detailed student information.`);
}

// Utility function to show project details
function showProjectDetails(title) {
    alert(`Viewing details for: ${title}\n\nIn a real application, this would show full project details and application form.`);
}

// Utility function to connect with student
function connectWithStudent(name, userId = null) {
    if (!currentState.isAuthenticated) {
        showNotification('Please login to connect with students', 'warning');
        showPage('login');
        return;
    }
    
    // If userId is provided as the first argument (backward compatibility)
    if (typeof name === 'number' || typeof name === 'string' && !isNaN(name)) {
        alert(`Connecting with student (ID: ${name})\n\nIn a real application, this would initiate a connection request.`);
        return;
    }
    
    alert(`Connecting with ${name}\n\nIn a real application, this would send a collaboration request.`);
    
    // Log the connection attempt for analytics
    trackActivity('connect_with_student', { student_name: name });
}

// Utility function to apply to project
function applyToProject(projectId) {
    if (!currentState.isAuthenticated) {
        showNotification('Please login to apply for projects', 'warning');
        showPage('login');
        return;
    }
    
    alert(`Applying to project (ID: ${projectId})\n\nIn a real application, this would submit an application.`);
}

// Initialize the integrated application
async function initializeIntegratedApp() {
    console.log('Initializing integrated application...');
    
    try {
        // Setup event listeners first to ensure basic functionality
        setupEventListeners();
        
        // Update UI based on auth state
        updateAuthUI();
        
        // Check authentication status
        await checkAuthStatus();
        
        // Load initial data
        await loadInitialData();
        
        // Initialize talent cards on services page if currently visible
        if (window.location.hash === '#services' || document.getElementById('services')?.classList.contains('active')) {
            renderTalentCards();
        }
        
        console.log('Integrated application initialized successfully!');
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('Application initialization failed, loading with limited functionality', 'warning');
    } finally {
        // Always hide the loading indicator
        setTimeout(hideLoadingIndicator, 1000);
    }
}

// Authentication Functions
async function checkAuthStatus() {
    try {
        const user = await api.getCurrentUser();
        if (user) {  // Check if user object exists (not null)
            currentState.isAuthenticated = true;
            currentState.currentUser = user;
            console.log('User authenticated:', user.username);
        } else {
            console.log('No authenticated user found');
            currentState.isAuthenticated = false;
            currentState.currentUser = null;
        }
    } catch (error) {
        console.log('Error checking authentication status:', error.message);
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
        showNotification('Could not connect to server, loading demo content', 'info');
        // Fall back to mock data if API unavailable
        loadMockData();
    }
}

function loadMockData() {
    console.log('Loading mock data as fallback...');
    currentState.projects = getMockProjects();
    currentState.profiles = getIndianStudentProfiles(); // Use Indian student profiles instead of generic mock profiles
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
    
    // If no profiles loaded from API, use mock data
    if (currentState.profiles.length === 0) {
        currentState.profiles = getIndianStudentProfiles();
    }
    
    currentState.profiles.forEach(profile => {
        const card = createProfileCard(profile);
        grid.appendChild(card);
    });
    
    // Also render talent cards on the services page
    renderTalentCards();
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

function createTalentCard(profile) {
    const card = document.createElement('div');
    card.className = 'talent-card card';
    card.innerHTML = `
        <div class="talent-content-wrapper">
            <div class="talent-header">
                <div class="talent-avatar">
                    ${getInitials(profile.first_name, profile.last_name)}
                </div>
                <h3 class="talent-name text-slate-900 dark:text-white">${profile.first_name} ${profile.last_name}</h3>
                <p class="talent-role text-slate-600 dark:text-slate-400 font-medium">${profile.role || 'Developer'}</p>
            </div>
            <div class="talent-details">
                <div class="talent-section">
                    <div class="talent-label text-slate-700 dark:text-slate-300">Skills</div>
                    <div class="talent-skills">
                        ${(JSON.parse(profile.skills || '[]') || []).slice(0, 3).map(skill => 
                            '<span class="talent-skill-tag bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">' + skill + '</span>'
                        ).join('')}
                    </div>
                </div>
                <div class="talent-section">
                    <div class="talent-label text-slate-700 dark:text-slate-300">College</div>
                    <div class="talent-college text-slate-600 dark:text-slate-400 font-medium">${profile.college}</div>
                </div>
            </div>
            <p class="talent-bio text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">${profile.bio || 'Passionate about technology and innovation.'}</p>
            <button class="talent-button" onclick="connectWithStudent('${profile.first_name} ${profile.last_name}', ${profile.user_id})">
                Connect
            </button>
        </div>
    `;
    return card;
}

function renderTalentCards(talentList = null) {
    const grid = document.getElementById('talentGrid');
    if (!grid) return;
    
    // Clear the grid
    grid.innerHTML = '';
    
    // Get talent profiles (first 15 from the Indian student profiles)
    const talentProfiles = talentList || getTalentProfiles();
    
    talentProfiles.forEach(profile => {
        const card = createTalentCard(profile);
        grid.appendChild(card);
    });
}

function getIndianStudentProfiles() {
    return [
        {
            user_id: 1,
            first_name: "Arjun",
            last_name: "Patel",
            college: "IIT Bombay",
            bio: "Full Stack Developer with expertise in MERN stack and cloud technologies.",
            skills: JSON.stringify(["React", "Node.js", "MongoDB", "AWS"]),
            experience: "3 years",
            role: "Full Stack Developer"
        },
        {
            user_id: 2,
            first_name: "Priya",
            last_name: "Sharma",
            college: "IIT Delhi",
            bio: "ML Engineer specializing in computer vision and NLP applications.",
            skills: JSON.stringify(["Python", "TensorFlow", "PyTorch", "OpenCV"]),
            experience: "2 years",
            role: "ML Engineer"
        },
        {
            user_id: 3,
            first_name: "Rohan",
            last_name: "Mehta",
            college: "IIT Madras",
            bio: "Mobile App Developer creating cross-platform solutions with Flutter.",
            skills: JSON.stringify(["Flutter", "Dart", "Firebase", "API Integration"]),
            experience: "2 years",
            role: "Mobile Developer"
        },
        {
            user_id: 4,
            first_name: "Ananya",
            last_name: "Singh",
            college: "NID Ahmedabad",
            bio: "UI/UX Designer focused on creating intuitive user experiences.",
            skills: JSON.stringify(["Figma", "Adobe XD", "Prototyping", "User Research"]),
            experience: "3 years",
            role: "UI/UX Designer"
        },
        {
            user_id: 5,
            first_name: "Vikram",
            last_name: "Kumar",
            college: "BITS Pilani",
            bio: "DevOps Engineer with expertise in cloud infrastructure and CI/CD.",
            skills: JSON.stringify(["AWS", "Docker", "Kubernetes", "Jenkins"]),
            experience: "2 years",
            role: "DevOps Engineer"
        },
        {
            user_id: 6,
            first_name: "Meera",
            last_name: "Desai",
            college: "IISc Bangalore",
            bio: "Data Scientist with strong statistical modeling and visualization skills.",
            skills: JSON.stringify(["Python", "R", "SQL", "Tableau"]),
            experience: "2 years",
            role: "Data Scientist"
        },
        {
            user_id: 7,
            first_name: "Karan",
            last_name: "Gupta",
            college: "IIIT Hyderabad",
            bio: "Blockchain developer building decentralized applications.",
            skills: JSON.stringify(["Solidity", "Ethereum", "Web3.js", "Smart Contracts"]),
            experience: "1 year",
            role: "Blockchain Developer"
        },
        {
            user_id: 8,
            first_name: "Sneha",
            last_name: "Reddy",
            college: "Jadavpur University",
            bio: "Cybersecurity analyst with expertise in ethical hacking.",
            skills: JSON.stringify(["Network Security", "Ethical Hacking", "Risk Assessment", "SIEM"]),
            experience: "2 years",
            role: "Security Analyst"
        },
        {
            user_id: 9,
            first_name: "Aditya",
            last_name: "Verma",
            college: "DITU, Greater Noida",
            bio: "Game developer passionate about creating immersive experiences.",
            skills: JSON.stringify(["Unity", "C#", "3D Modeling", "VR/AR"]),
            experience: "1 year",
            role: "Game Developer"
        },
        {
            user_id: 10,
            first_name: "Neha",
            last_name: "Joshi",
            college: "XLRI Jamshedpur",
            bio: "Product Manager with technical background in software development.",
            skills: JSON.stringify(["Agile", "Scrum", "Product Strategy", "Market Research"]),
            experience: "3 years",
            role: "Product Manager"
        },
        {
            user_id: 11,
            first_name: "Rajesh",
            last_name: "Pillai",
            college: "Anna University",
            bio: "Cloud architect designing scalable enterprise solutions.",
            skills: JSON.stringify(["Azure", "GCP", "Microservices", "Serverless"]),
            experience: "4 years",
            role: "Cloud Architect"
        },
        {
            user_id: 12,
            first_name: "Tanvi",
            last_name: "Shah",
            college: "DAIICT Gandhinagar",
            bio: "Frontend specialist creating responsive and accessible interfaces.",
            skills: JSON.stringify(["React", "Vue.js", "TypeScript", "GraphQL"]),
            experience: "2 years",
            role: "Frontend Engineer"
        },
        {
            user_id: 13,
            first_name: "Manish",
            last_name: "Rao",
            college: "COEP Pune",
            bio: "Backend engineer specializing in high-performance systems.",
            skills: JSON.stringify(["Go", "Python", "Redis", "PostgreSQL"]),
            experience: "2 years",
            role: "Backend Developer"
        },
        {
            user_id: 14,
            first_name: "Kavya",
            last_name: "Nair",
            college: "Christ University",
            bio: "Content strategist with technical writing expertise.",
            skills: JSON.stringify(["SEO", "Technical Writing", "Brand Strategy", "Content Marketing"]),
            experience: "2 years",
            role: "Content Strategist"
        },
        {
            user_id: 15,
            first_name: "Deepak",
            last_name: "Menon",
            college: "NIT Trichy",
            bio: "IoT developer building connected device ecosystems.",
            skills: JSON.stringify(["Embedded Systems", "Raspberry Pi", "Arduino", "MQTT"]),
            experience: "2 years",
            role: "IoT Developer"
        },
        {
            user_id: 16,
            first_name: "Pooja",
            last_name: "Bhatia",
            college: "Thapar Institute",
            bio: "QA engineer specializing in test automation frameworks.",
            skills: JSON.stringify(["Selenium", "Cypress", "JUnit", "TestNG"]),
            experience: "2 years",
            role: "QA Automation Engineer"
        },
        {
            user_id: 17,
            first_name: "Siddharth",
            last_name: "Iyer",
            college: "SRM University",
            bio: "AR/VR developer creating immersive digital experiences.",
            skills: JSON.stringify(["Unity3D", "ARKit", "ARCore", "3D Graphics"]),
            experience: "1 year",
            role: "AR/VR Developer"
        },
        {
            user_id: 18,
            first_name: "Ritu",
            last_name: "Malhotra",
            college: "IMT Ghaziabad",
            bio: "Business analyst bridging technical and business teams.",
            skills: JSON.stringify(["Requirements Gathering", "Process Modeling", "Data Analysis", "Stakeholder Management"]),
            experience: "3 years",
            role: "Business Analyst"
        },
        {
            user_id: 19,
            first_name: "Amitabh",
            last_name: "Choudhary",
            college: "BIT Mesra",
            bio: "Database administrator ensuring optimal performance and security.",
            skills: JSON.stringify(["Oracle", "MySQL", "MongoDB", "Database Design"]),
            experience: "3 years",
            role: "Database Administrator"
        },
        {
            user_id: 20,
            first_name: "Swati",
            last_name: "Agarwal",
            college: "MICA Ahmedabad",
            bio: "Digital marketing specialist driving growth through data-driven campaigns.",
            skills: JSON.stringify(["PPC", "Social Media", "Analytics", "Growth Hacking"]),
            experience: "2 years",
            role: "Digital Marketing Specialist"
        }
    ];
}

function getTalentProfiles() {
    return [
        {
            user_id: 1,
            first_name: "Arjun",
            last_name: "Patel",
            college: "IIT Bombay",
            bio: "Full Stack Developer with expertise in MERN stack and cloud technologies.",
            skills: JSON.stringify(["React", "Node.js", "MongoDB", "AWS"]),
            experience: "3 years",
            role: "Full Stack Developer"
        },
        {
            user_id: 2,
            first_name: "Priya",
            last_name: "Sharma",
            college: "IIT Delhi",
            bio: "ML Engineer specializing in computer vision and NLP applications.",
            skills: JSON.stringify(["Python", "TensorFlow", "PyTorch", "OpenCV"]),
            experience: "2 years",
            role: "ML Engineer"
        },
        {
            user_id: 3,
            first_name: "Rohan",
            last_name: "Mehta",
            college: "IIT Madras",
            bio: "Mobile App Developer creating cross-platform solutions with Flutter.",
            skills: JSON.stringify(["Flutter", "Dart", "Firebase", "API Integration"]),
            experience: "2 years",
            role: "Mobile Developer"
        },
        {
            user_id: 4,
            first_name: "Ananya",
            last_name: "Singh",
            college: "NID Ahmedabad",
            bio: "UI/UX Designer focused on creating intuitive user experiences.",
            skills: JSON.stringify(["Figma", "Adobe XD", "Prototyping", "User Research"]),
            experience: "3 years",
            role: "UI/UX Designer"
        },
        {
            user_id: 5,
            first_name: "Vikram",
            last_name: "Kumar",
            college: "BITS Pilani",
            bio: "DevOps Engineer with expertise in cloud infrastructure and CI/CD.",
            skills: JSON.stringify(["AWS", "Docker", "Kubernetes", "Jenkins"]),
            experience: "2 years",
            role: "DevOps Engineer"
        },
        {
            user_id: 6,
            first_name: "Meera",
            last_name: "Desai",
            college: "IISc Bangalore",
            bio: "Data Scientist with strong statistical modeling and visualization skills.",
            skills: JSON.stringify(["Python", "R", "SQL", "Tableau"]),
            experience: "2 years",
            role: "Data Scientist"
        },
        {
            user_id: 7,
            first_name: "Karan",
            last_name: "Gupta",
            college: "IIIT Hyderabad",
            bio: "Blockchain developer building decentralized applications.",
            skills: JSON.stringify(["Solidity", "Ethereum", "Web3.js", "Smart Contracts"]),
            experience: "1 year",
            role: "Blockchain Developer"
        },
        {
            user_id: 8,
            first_name: "Sneha",
            last_name: "Reddy",
            college: "Jadavpur University",
            bio: "Cybersecurity analyst with expertise in ethical hacking.",
            skills: JSON.stringify(["Network Security", "Ethical Hacking", "Risk Assessment", "SIEM"]),
            experience: "2 years",
            role: "Security Analyst"
        },
        {
            user_id: 9,
            first_name: "Aditya",
            last_name: "Verma",
            college: "DITU, Greater Noida",
            bio: "Game developer passionate about creating immersive experiences.",
            skills: JSON.stringify(["Unity", "C#", "3D Modeling", "VR/AR"]),
            experience: "1 year",
            role: "Game Developer"
        },
        {
            user_id: 10,
            first_name: "Neha",
            last_name: "Joshi",
            college: "XLRI Jamshedpur",
            bio: "Product Manager with technical background in software development.",
            skills: JSON.stringify(["Agile", "Scrum", "Product Strategy", "Market Research"]),
            experience: "3 years",
            role: "Product Manager"
        },
        {
            user_id: 11,
            first_name: "Rajesh",
            last_name: "Pillai",
            college: "Anna University",
            bio: "Cloud architect designing scalable enterprise solutions.",
            skills: JSON.stringify(["Azure", "GCP", "Microservices", "Serverless"]),
            experience: "4 years",
            role: "Cloud Architect"
        },
        {
            user_id: 12,
            first_name: "Tanvi",
            last_name: "Shah",
            college: "DAIICT Gandhinagar",
            bio: "Frontend specialist creating responsive and accessible interfaces.",
            skills: JSON.stringify(["React", "Vue.js", "TypeScript", "GraphQL"]),
            experience: "2 years",
            role: "Frontend Engineer"
        },
        {
            user_id: 13,
            first_name: "Manish",
            last_name: "Rao",
            college: "COEP Pune",
            bio: "Backend engineer specializing in high-performance systems.",
            skills: JSON.stringify(["Go", "Python", "Redis", "PostgreSQL"]),
            experience: "2 years",
            role: "Backend Developer"
        },
        {
            user_id: 14,
            first_name: "Kavya",
            last_name: "Nair",
            college: "Christ University",
            bio: "Content strategist with technical writing expertise.",
            skills: JSON.stringify(["SEO", "Technical Writing", "Brand Strategy", "Content Marketing"]),
            experience: "2 years",
            role: "Content Strategist"
        },
        {
            user_id: 15,
            first_name: "Deepak",
            last_name: "Menon",
            college: "NIT Trichy",
            bio: "IoT developer building connected device ecosystems.",
            skills: JSON.stringify(["Embedded Systems", "Raspberry Pi", "Arduino", "MQTT"]),
            experience: "2 years",
            role: "IoT Developer"
        }
    ];
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
    
    // Talent search functionality
    const talentSearchInput = document.getElementById('talentSearch');
    if (talentSearchInput) {
        talentSearchInput.addEventListener('input', debounce(handleTalentSearch, 300));
    }
    
    // Filter buttons - update the existing ones
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.removeEventListener('click', handleFilterClick); // Remove old listeners if any
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

async function handleTalentSearch(event) {
    const query = event.target.value.trim();
    
    // If no query, show all talent
    if (query.length < 2) {
        renderTalentCards();
        return;
    }
    
    try {
        // Filter talent based on search query
        const allTalent = getTalentProfiles();
        const filteredTalent = allTalent.filter(talent => 
            talent.first_name.toLowerCase().includes(query.toLowerCase()) ||
            talent.last_name.toLowerCase().includes(query.toLowerCase()) ||
            talent.college.toLowerCase().includes(query.toLowerCase()) ||
            talent.role.toLowerCase().includes(query.toLowerCase()) ||
            JSON.parse(talent.skills).some(skill => skill.toLowerCase().includes(query.toLowerCase()))
        );
        
        // Render filtered talent
        renderTalentCards(filteredTalent);
    } catch (error) {
        console.error('Talent search failed:', error);
    }
}

function handleFilterClick(event) {
    const filterType = event.target.dataset.filter;
    
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => 
        btn.classList.remove('active')
    );
    event.target.classList.add('active');
    
    // Check if this is a talent filter (on services page)
    const isTalentPage = window.location.hash === '#services' || document.getElementById('services')?.classList.contains('active');
    
    if (isTalentPage) {
        // Apply talent filter
        if (filterType === 'all') {
            renderTalentCards();
        } else {
            // Filter talent by role or skills
            const allTalent = getTalentProfiles();
            let filteredTalent = [];
            
            switch(filterType) {
                case 'frontend':
                    filteredTalent = allTalent.filter(talent => 
                        talent.role.toLowerCase().includes('frontend') ||
                        talent.role.toLowerCase().includes('ui') ||
                        talent.role.toLowerCase().includes('ux') ||
                        JSON.parse(talent.skills).some(skill => 
                            skill.toLowerCase().includes('react') ||
                            skill.toLowerCase().includes('vue') ||
                            skill.toLowerCase().includes('angular') ||
                            skill.toLowerCase().includes('html') ||
                            skill.toLowerCase().includes('css')
                        )
                    );
                    break;
                case 'backend':
                    filteredTalent = allTalent.filter(talent => 
                        talent.role.toLowerCase().includes('backend') ||
                        talent.role.toLowerCase().includes('api') ||
                        JSON.parse(talent.skills).some(skill => 
                            skill.toLowerCase().includes('node') ||
                            skill.toLowerCase().includes('python') ||
                            skill.toLowerCase().includes('java') ||
                            skill.toLowerCase().includes('go') ||
                            skill.toLowerCase().includes('django') ||
                            skill.toLowerCase().includes('express')
                        )
                    );
                    break;
                case 'design':
                    filteredTalent = allTalent.filter(talent => 
                        talent.role.toLowerCase().includes('design') ||
                        talent.role.toLowerCase().includes('ui') ||
                        talent.role.toLowerCase().includes('ux') ||
                        JSON.parse(talent.skills).some(skill => 
                            skill.toLowerCase().includes('figma') ||
                            skill.toLowerCase().includes('xd') ||
                            skill.toLowerCase().includes('photoshop') ||
                            skill.toLowerCase().includes('illustrator')
                        )
                    );
                    break;
                case 'data':
                    filteredTalent = allTalent.filter(talent => 
                        talent.role.toLowerCase().includes('data') ||
                        talent.role.toLowerCase().includes('science') ||
                        talent.role.toLowerCase().includes('analyst') ||
                        JSON.parse(talent.skills).some(skill => 
                            skill.toLowerCase().includes('python') ||
                            skill.toLowerCase().includes('r') ||
                            skill.toLowerCase().includes('sql') ||
                            skill.toLowerCase().includes('tableau') ||
                            skill.toLowerCase().includes('tensorflow') ||
                            skill.toLowerCase().includes('pytorch')
                        )
                    );
                    break;
                default:
                    filteredTalent = allTalent;
            }
            
            renderTalentCards(filteredTalent);
        }
    } else {
        // Apply project filter (existing functionality)
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

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    hideLoadingIndicator();
});

// Function to track user activity for analytics
async function trackActivity(activityType, additionalData = {}) {
    try {
        // Get current page URL
        const pageUrl = window.location.href;
        
        // Get referrer
        const referrer = document.referrer;
        
        // Get element information if available
        let elementId = null;
        let elementClass = null;
        
        if (additionalData.event && additionalData.event.target) {
            elementId = additionalData.event.target.id || null;
            elementClass = additionalData.event.target.className || null;
        }
        
        const activityData = {
            activity_type: activityType,
            page_url: pageUrl,
            element_id: elementId,
            element_class: elementClass,
            referrer: referrer,
            metadata: {
                ...additionalData,
                timestamp: new Date().toISOString()
            }
        };
        
        // Send to analytics API
        await api.trackActivity(activityData);
        
        console.log('Activity tracked:', activityType);
    } catch (error) {
        console.error('Failed to track activity:', error);
    }
}

// Enhanced event listener setup to track activities
function setupEnhancedEventListeners() {
    // Track page views
    window.addEventListener('hashchange', function() {
        const page = window.location.hash.substring(1) || 'home';
        trackActivity('page_view', { page: page });
    });
    
    // Track button clicks
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Track clicks on buttons, links, and other interactive elements
        if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.classList.contains('btn') || target.classList.contains('link')) {
            const elementInfo = {
                tag: target.tagName,
                id: target.id,
                className: target.className,
                text: target.textContent?.trim().substring(0, 50) || '',
                href: target.href || '',
                event: event
            };
            
            trackActivity('button_click', elementInfo);
        }
    });
    
    // Track form submissions
    document.addEventListener('submit', function(event) {
        const target = event.target;
        if (target.tagName === 'FORM') {
            const formInfo = {
                id: target.id,
                action: target.action,
                method: target.method,
                event: event
            };
            
            trackActivity('form_submit', formInfo);
        }
    });
    
    // Track search interactions
    document.addEventListener('input', function(event) {
        const target = event.target;
        if (target.type === 'search' || target.id === 'studentSearch' || target.classList.contains('search-input')) {
            const searchInfo = {
                search_term: target.value,
                id: target.id,
                event: event
            };
            
            // Debounce search tracking to avoid too many calls
            if (typeof debouncedSearchTracker === 'undefined') {
                let searchTimeout;
                window.debouncedSearchTracker = function(term) {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        trackActivity('search', searchInfo);
                    }, 1000); // Track search after 1 second of inactivity
                };
            }
            window.debouncedSearchTracker(target.value);
        }
    });
}

// Global flag to track reCAPTCHA verification status
let isRecaptchaVerified = false;

// Function to handle the security verification
function verifyHuman() {
    return new Promise((resolve, reject) => {
        // Check if grecaptcha is loaded
        if (typeof grecaptcha === 'undefined') {
            console.error('reCAPTCHA script not loaded');
            reject(new Error('reCAPTCHA script not loaded'));
            return;
        }
        
        // Execute reCAPTCHA with your site key
        // Using test key for development - replace with your actual site key in production
        grecaptcha.execute('6LeIxAcTAAAAAGTVH7yLmQLNFq_D6LiRYb3sPAz3', {action: 'homepage'})
        .then(function(token) {
            // Send token to backend for verification
            fetch(`${api.baseURL}/auth/google/verify-recaptcha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({token: token})
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.detail || 'Verification failed');
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('reCAPTCHA verification successful');
                isRecaptchaVerified = true;
                
                // Update UI to show verified status
                const verificationElement = document.querySelector('.security-verification');
                if (verificationElement) {
                    verificationElement.classList.remove('border-green-200', 'dark:border-green-700/50');
                    verificationElement.classList.add('border-blue-500', 'dark:border-blue-500');
                    
                    const verificationText = verificationElement.querySelector('.verification-text');
                    if (verificationText) {
                        const statusDiv = verificationText.querySelector('.font-medium');
                        const descDiv = verificationText.querySelector('.text-xs');
                        
                        if (statusDiv) statusDiv.textContent = 'Verified Human';
                        if (descDiv) descDiv.textContent = 'Security confirmed ✓';
                        
                        statusDiv.classList.remove('text-green-800', 'dark:text-green-300');
                        statusDiv.classList.add('text-blue-600', 'dark:text-blue-300');
                        
                        descDiv.classList.remove('text-green-600', 'dark:text-green-400');
                        descDiv.classList.add('text-blue-500', 'dark:text-blue-400');
                    }
                    
                    // Change icon to blue checkmark
                    const iconElement = verificationElement.querySelector('.verification-icon');
                    if (iconElement) {
                        iconElement.classList.remove('bg-green-500');
                        iconElement.classList.add('bg-blue-500');
                    }
                }
                
                resolve(true);
            })
            .catch(error => {
                console.error('reCAPTCHA verification error:', error);
                reject(error);
            });
        })
        .catch(error => {
            console.error('reCAPTCHA execution error:', error);
            reject(error);
        });
    });
}

// Add event listener for security verification
function setupSecurityVerification() {
    const securityVerificationElement = document.querySelector('.security-verification');
    if (securityVerificationElement) {
        securityVerificationElement.addEventListener('click', function(e) {
            e.preventDefault();
            showLoadingIndicator();
            
            verifyHuman()
            .then(success => {
                if (success) {
                    showNotification('Security verification successful!', 'success');
                }
            })
            .catch(error => {
                console.error('Security verification failed:', error);
                showNotification(`Security verification failed: ${error.message}`, 'error');
            })
            .finally(() => {
                hideLoadingIndicator();
            });
        });
        
        // Also handle keyboard events for accessibility
        securityVerificationElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                securityVerificationElement.click();
            }
        });
    }
}

// Initialize security verification when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSecurityVerification);
} else {
    setupSecurityVerification();
}

// Initialize enhanced event tracking
setupEnhancedEventListeners();

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    hideLoadingIndicator();
});

