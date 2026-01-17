// Collabthon UI Replica - JavaScript Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Collabthon Database UI Replica Loaded');
    
    // Initialize all functionality
    initializeNavigation();
    initializeThemeToggle();
    initializeMobileMenu();
    initializePages();
    initializeSearch();
    initializeFilters();
    populateMockData();
    initializeScrollEffects();
});

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
        const name = card.querySelector('.student-name')?.textContent.toLowerCase() || '';
        const skills = card.querySelector('.student-skills')?.textContent.toLowerCase() || '';
        const college = card.querySelector('.student-college')?.textContent.toLowerCase() || '';
        
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
            const cardCategory = card.getAttribute('data-category');
            card.style.display = cardCategory === category ? 'block' : 'none';
        }
    });
}

// Mock Data Population
function populateMockData() {
    populateStudents();
    populateProjects();
    setupFormHandlers();
}

function populateStudents() {
    const studentsGrid = document.getElementById('studentsGrid');
    if (!studentsGrid) return;
    
    const students = [
        {
            name: "Arjun Patel",
            role: "Full Stack Developer",
            skills: "React, Node.js, MongoDB, AWS, Docker",
            college: "IIT Bombay",
            avatar: "AP",
            rating: 4.9,
            projects: 32,
            bio: "Passionate about building scalable web applications with modern technologies. Specialized in MERN stack development.",
            location: "Mumbai, India",
            experience: "3 years internship experience"
        },
        {
            name: "Priya Sharma",
            role: "Machine Learning Engineer",
            skills: "Python, TensorFlow, PyTorch, NLP, Computer Vision",
            college: "IIT Delhi",
            avatar: "PS",
            rating: 4.8,
            projects: 28,
            bio: "AI enthusiast with expertise in deep learning and neural networks. Published research in computer vision applications.",
            location: "Delhi, India",
            experience: "2 years research experience"
        },
        {
            name: "Rohan Mehta",
            role: "Mobile App Developer",
            skills: "Flutter, React Native, Kotlin, Swift, Firebase",
            college: "IIT Madras",
            avatar: "RM",
            rating: 4.7,
            projects: 25,
            bio: "Cross-platform mobile developer creating intuitive user experiences. Expert in performance optimization and native integrations.",
            location: "Chennai, India",
            experience: "2.5 years app development"
        },
        {
            name: "Ananya Singh",
            role: "UI/UX Designer",
            skills: "Figma, Adobe Creative Suite, User Research, Prototyping",
            college: "NID Ahmedabad",
            avatar: "AS",
            rating: 4.9,
            projects: 35,
            bio: "Design thinker focused on creating meaningful digital experiences. Specializes in user-centered design and accessibility.",
            location: "Ahmedabad, India",
            experience: "3 years design experience"
        },
        {
            name: "Vikram Kumar",
            role: "DevOps Engineer",
            skills: "AWS, Kubernetes, CI/CD, Terraform, Jenkins",
            college: "BITS Pilani",
            avatar: "VK",
            rating: 4.8,
            projects: 29,
            bio: "Infrastructure automation specialist with cloud architecture expertise. Passionate about scalable and secure deployments.",
            location: "Hyderabad, India",
            experience: "2 years DevOps experience"
        },
        {
            name: "Meera Desai",
            role: "Data Scientist",
            skills: "Python, R, SQL, Tableau, Statistical Analysis",
            college: "IISc Bangalore",
            avatar: "MD",
            rating: 4.9,
            projects: 22,
            bio: "Analytics professional with strong statistical foundation. Experienced in predictive modeling and business intelligence.",
            location: "Bangalore, India",
            experience: "1.5 years data science"
        },
        {
            name: "Karan Gupta",
            role: "Blockchain Developer",
            skills: "Solidity, Ethereum, Web3.js, Smart Contracts",
            college: "IIIT Hyderabad",
            avatar: "KG",
            rating: 4.7,
            projects: 18,
            bio: "Web3 enthusiast building decentralized applications. Expertise in smart contract development and blockchain security.",
            location: "Hyderabad, India",
            experience: "2 years blockchain development"
        },
        {
            name: "Sneha Reddy",
            role: "Cybersecurity Analyst",
            skills: "Network Security, Ethical Hacking, SIEM, Risk Assessment",
            college: "Jadavpur University",
            avatar: "SR",
            rating: 4.8,
            projects: 24,
            bio: "Security professional protecting digital assets. Specialized in penetration testing and vulnerability assessment.",
            location: "Kolkata, India",
            experience: "2 years cybersecurity"
        },
        {
            name: "Aditya Verma",
            role: "Game Developer",
            skills: "Unity, C#, Unreal Engine, 3D Modeling, VR/AR",
            college: "DITU, Greater Noida",
            avatar: "AV",
            rating: 4.6,
            projects: 20,
            bio: "Interactive entertainment creator passionate about immersive experiences. Expert in game mechanics and player engagement.",
            location: "Greater Noida, India",
            experience: "1.5 years game development"
        },
        {
            name: "Neha Joshi",
            role: "Product Manager",
            skills: "Agile, Scrum, Product Strategy, Market Research",
            college: "XLRI Jamshedpur",
            avatar: "NJ",
            rating: 4.9,
            projects: 30,
            bio: "Strategic product leader bridging technology and business needs. Experienced in launching successful digital products.",
            location: "Jamshedpur, India",
            experience: "3 years product management"
        },
        {
            name: "Rajesh Pillai",
            role: "Cloud Architect",
            skills: "Azure, Google Cloud, Microservices, Serverless, Architecture",
            college: "Anna University",
            avatar: "RP",
            rating: 4.8,
            projects: 26,
            bio: "Enterprise cloud solutions architect designing scalable infrastructure. Expert in multi-cloud strategies and cost optimization.",
            location: "Chennai, India",
            experience: "4 years cloud architecture"
        },
        {
            name: "Tanvi Shah",
            role: "Frontend Engineer",
            skills: "React, Vue.js, Angular, TypeScript, GraphQL",
            college: "DAIICT Gandhinagar",
            avatar: "TS",
            rating: 4.7,
            projects: 27,
            bio: "Modern web interface specialist creating responsive and accessible applications. Passionate about performance optimization.",
            location: "Gandhinagar, India",
            experience: "2 years frontend development"
        },
        {
            name: "Manish Rao",
            role: "Backend Developer",
            skills: "Go, Python, Redis, PostgreSQL, API Design",
            college: "COEP Pune",
            avatar: "MR",
            rating: 4.6,
            projects: 23,
            bio: "High-performance backend systems engineer. Expertise in distributed systems and database optimization.",
            location: "Pune, India",
            experience: "2 years backend development"
        },
        {
            name: "Kavya Nair",
            role: "Content Strategist",
            skills: "SEO, Content Marketing, Technical Writing, Brand Strategy",
            college: "Christ University",
            avatar: "KN",
            rating: 4.8,
            projects: 33,
            bio: "Digital storytelling expert creating compelling content strategies. Specialized in technical documentation and brand voice.",
            location: "Bangalore, India",
            experience: "2.5 years content strategy"
        },
        {
            name: "Deepak Menon",
            role: "IoT Developer",
            skills: "Embedded Systems, Raspberry Pi, Arduino, MQTT, Sensors",
            college: "NIT Trichy",
            avatar: "DM",
            rating: 4.7,
            projects: 19,
            bio: "Connected devices innovator building smart IoT solutions. Expertise in hardware-software integration and edge computing.",
            location: "Trichy, India",
            experience: "2 years IoT development"
        },
        {
            name: "Pooja Bhatia",
            role: "QA Automation Engineer",
            skills: "Selenium, Cypress, JUnit, TestNG, CI/CD Testing",
            college: "Thapar Institute",
            avatar: "PB",
            rating: 4.8,
            projects: 28,
            bio: "Quality assurance specialist ensuring software reliability. Expert in automated testing frameworks and test strategy.",
            location: "Patiala, India",
            experience: "2 years QA automation"
        },
        {
            name: "Siddharth Iyer",
            role: "AR/VR Developer",
            skills: "Unity3D, ARKit, ARCore, Oculus SDK, 3D Graphics",
            college: "SRM University",
            avatar: "SI",
            rating: 4.6,
            projects: 16,
            bio: "Immersive technology pioneer creating augmented and virtual reality experiences. Specialized in spatial computing.",
            location: "Chennai, India",
            experience: "1.5 years AR/VR development"
        },
        {
            name: "Ritu Malhotra",
            role: "Business Analyst",
            skills: "Requirements Gathering, Process Modeling, Data Analysis, Stakeholder Management",
            college: "IMT Ghaziabad",
            avatar: "RM",
            rating: 4.9,
            projects: 31,
            bio: "Business process optimization expert translating requirements into technical solutions. Strong analytical and communication skills.",
            location: "Ghaziabad, India",
            experience: "3 years business analysis"
        },
        {
            name: "Amitabh Choudhary",
            role: "Database Administrator",
            skills: "Oracle, MySQL, PostgreSQL, MongoDB, Database Design",
            college: "BIT Mesra",
            avatar: "AC",
            rating: 4.7,
            projects: 25,
            bio: "Data infrastructure specialist ensuring optimal database performance and security. Expert in data modeling and optimization.",
            location: "Ranchi, India",
            experience: "3 years DBA experience"
        },
        {
            name: "Swati Agarwal",
            role: "Digital Marketing Specialist",
            skills: "PPC, Social Media, Analytics, Campaign Management, Growth Hacking",
            college: "MICA Ahmedabad",
            avatar: "SA",
            rating: 4.8,
            projects: 34,
            bio: "Growth marketing strategist driving customer acquisition and retention. Expertise in data-driven marketing campaigns.",
            location: "Ahmedabad, India",
            experience: "2.5 years digital marketing"
        }
    ];
    
    studentsGrid.innerHTML = students.map((student, index) => `
        <div class="student-card premium-card" onclick="showStudentProfile('${student.name}')" style="animation-delay: ${index * 0.1}s">
            <div class="flex items-center mb-4">
                <div class="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                    ${student.avatar}
                </div>
                <div>
                    <h3 class="font-bold text-lg student-name text-slate-900 dark:text-white">${student.name}</h3>
                    <p class="text-slate-600 dark:text-slate-400 font-medium">${student.role}</p>
                    <div class="flex items-center mt-1">
                        <span class="material-symbols-outlined text-yellow-500 text-sm">location_on</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 ml-1">${student.location}</span>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skills</div>
                <div class="student-skills text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">${student.skills}</div>
            </div>
            
            <div class="mb-3">
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College</div>
                <div class="student-college text-sm text-slate-600 dark:text-slate-400 font-medium">${student.college}</div>
            </div>
            
            <div class="mb-3">
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Experience</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">${student.experience}</div>
            </div>
            
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">${student.bio}</p>
            
            <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <div class="flex items-center space-x-3">
                    <div class="flex items-center">
                        <span class="material-symbols-outlined text-yellow-500 text-sm">star</span>
                        <span class="ml-1 text-sm font-bold text-slate-900 dark:text-white">${student.rating}</span>
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                        (${student.projects} projects)
                    </div>
                </div>
                <button class="btn btn-primary btn-small">
                    View Profile
                </button>
            </div>
        </div>
    `).join('');
}

function populateProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    
    const projects = [
        {
            title: "E-commerce Mobile App for Indian Market",
            description: "Building a React Native e-commerce application tailored for Indian consumers with UPI payment integration, regional language support, and local delivery partner APIs. Need developers familiar with Indian payment gateways and localization requirements.",
            skills: "React Native, Firebase, Razorpay, UPI Integration, Localization, Redux",
            budget: "₹2,00,000-₹4,00,000",
            category: "frontend",
            posted: "2 days ago",
            duration: "3-4 months",
            company: "StartupXYZ Pvt Ltd",
            location: "Bangalore, India"
        },
        {
            title: "Agricultural Yield Prediction ML Model",
            description: "Developing machine learning models to predict crop yields for Indian farmers using satellite imagery, weather data, and soil analysis. Looking for data scientists experienced with agricultural datasets and geospatial analysis.",
            skills: "Python, TensorFlow, Satellite Imagery, Weather APIs, Geospatial Analysis, Scikit-learn",
            budget: "₹3,50,000-₹6,00,000",
            category: "backend",
            posted: "1 day ago",
            duration: "4-6 months",
            company: "AgriTech Solutions",
            location: "Hyderabad, India"
        },
        {
            title: "EdTech Platform UI/UX Redesign",
            description: "Complete redesign of online learning platform focusing on Indian educational patterns, mobile-first approach, and accessibility. Need designers who understand Indian education system and rural connectivity challenges.",
            skills: "Figma, User Research, Education Design, Accessibility, Mobile Design, Wireframing",
            budget: "₹1,50,000-₹3,00,000",
            category: "design",
            posted: "3 days ago",
            duration: "2-3 months",
            company: "LearnIndia EdTech",
            location: "Mumbai, India"
        },
        {
            title: "Healthcare Appointment Booking System",
            description: "Building HIPAA-compliant healthcare appointment booking system with telemedicine features, prescription management, and integration with Indian medical databases. Requires full-stack developers with healthcare domain knowledge.",
            skills: "React, Node.js, MongoDB, HIPAA Compliance, Telemedicine APIs, Express.js",
            budget: "₹4,00,000-₹7,00,000",
            category: "frontend",
            posted: "5 days ago",
            duration: "5-6 months",
            company: "MediCare Digital Health",
            location: "Chennai, India"
        },
        {
            title: "FinTech Personal Finance Tracker",
            description: "Developing personal finance management app for Indian users with bank statement analysis, investment tracking, and tax calculation features. Need developers experienced with Indian banking APIs and financial regulations.",
            skills: "Flutter, Firebase, Banking APIs, Data Visualization, Financial Calculations, Security",
            budget: "₹2,50,000-₹5,00,000",
            category: "frontend",
            posted: "1 week ago",
            duration: "4-5 months",
            company: "WealthTrack FinTech",
            location: "Pune, India"
        },
        {
            title: "Smart City Traffic Management System",
            description: "IoT-based traffic monitoring and management system using computer vision, real-time data processing, and predictive analytics for Indian metropolitan cities. Seeking engineers with IoT and CV expertise.",
            skills: "Computer Vision, IoT Sensors, Real-time Processing, OpenCV, Data Analytics, Cloud Computing",
            budget: "₹6,00,000-₹10,00,000",
            category: "backend",
            posted: "4 days ago",
            duration: "6-8 months",
            company: "SmartCity Solutions",
            location: "Delhi, India"
        },
        {
            title: "Regional Language Translation App",
            description: "Building mobile app for real-time translation between major Indian languages (Hindi, Tamil, Telugu, Bengali, Marathi) with offline capabilities and voice recognition. Need linguists and ML engineers.",
            skills: "Natural Language Processing, Speech Recognition, Mobile Development, Offline ML, Linguistics, Android/iOS",
            budget: "₹3,00,000-₹5,50,000",
            category: "backend",
            posted: "3 days ago",
            duration: "5-7 months",
            company: "BhashaTranslate",
            location: "Bangalore, India"
        },
        {
            title: "Restaurant Management SaaS Platform",
            description: "Cloud-based restaurant management system with inventory tracking, order management, staff scheduling, and customer loyalty programs. Targeting small to medium restaurants across India.",
            skills: "Vue.js, Laravel, PostgreSQL, Payment Gateways, SMS Integration, Cloud Deployment",
            budget: "₹4,50,000-₹8,00,000",
            category: "frontend",
            posted: "6 days ago",
            duration: "6-9 months",
            company: "FoodTech Solutions",
            location: "Ahmedabad, India"
        }
    ];
    
    projectsGrid.innerHTML = projects.map((project, index) => `
        <div class="project-card premium-card" data-category="${project.category}" onclick="showProjectDetails('${project.title}')" style="animation-delay: ${index * 0.1}s">
            <div class="flex justify-between items-start mb-4">
                <h3 class="font-bold text-lg text-slate-900 dark:text-white">${project.title}</h3>
                <div class="flex flex-col items-end space-y-2">
                    <span class="text-xs px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                        ${project.category}
                    </span>
                    <div class="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <span class="material-symbols-outlined text-sm mr-1">business</span>
                        ${project.company}
                    </div>
                </div>
            </div>
            
            <p class="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">${project.description}</p>
            
            <div class="mb-4">
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Required Skills</div>
                <div class="flex flex-wrap gap-2">
                    ${project.skills.split(', ').map(skill => `
                        <span class="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full">${skill}</span>
                    `).join('')}
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Duration</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400">${project.duration}</div>
                </div>
                <div>
                    <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Location</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400">${project.location}</div>
                </div>
            </div>
            
            <div class="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                    <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Budget</div>
                    <div class="font-bold text-lg text-green-600 dark:text-green-400">${project.budget}</div>
                </div>
                <div class="text-right">
                    <div class="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <span class="material-symbols-outlined text-sm mr-1">schedule</span>
                        ${project.posted}
                    </div>
                    <button class="btn btn-primary btn-small">
                        Apply Now
                        <span class="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
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

// Utility Functions
function showStudentProfile(name) {
    alert(`Viewing profile for ${name}\n\nIn a real application, this would show detailed student information.`);
}

function showProjectDetails(title) {
    alert(`Viewing details for: ${title}\n\nIn a real application, this would show full project details and application form.`);
}

// Debounce function for search
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
    
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroSection.style.transform = `translateY(${rate}px)`;
        });
    }
    
    console.log('📊 Scroll effects initialized');
}

console.log('✨ Collabthon UI Replica initialized successfully!');