// Landing page functionality
import { isAuthenticated, redirectBasedOnRole } from '../../shared/utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeLandingPage();
});

function initializeLandingPage() {
    // Check if user is already logged in
    if (isAuthenticated()) {
        redirectBasedOnRole();
        return;
    }
    
    setupNavigationLinks();
    setupAuthButtons();
    setupFeatureHighlights();
}

function setupNavigationLinks() {
    // Setup login button
    const loginBtns = document.querySelectorAll('[data-action="login"]') || 
                     document.querySelectorAll('a[href*="login"]');
    
    loginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login.html';
        });
    });
    
    // Setup register button
    const registerBtns = document.querySelectorAll('[data-action="register"]') || 
                        document.querySelectorAll('a[href*="register"]');
    
    registerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/register.html';
        });
    });
}

function setupAuthButtons() {
    // Get Started button
    const getStartedBtn = document.querySelector('#get-started-btn') || 
                         document.querySelector('.btn-get-started');
    
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/register.html';
        });
    }
    
    // Quick Login button
    const quickLoginBtn = document.querySelector('#quick-login-btn') || 
                         document.querySelector('.btn-quick-login');
    
    if (quickLoginBtn) {
        quickLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login.html';
        });
    }
}

function setupFeatureHighlights() {
    // Add animation or interactive elements for features
    const featureCards = document.querySelectorAll('.feature-card') || 
                        document.querySelectorAll('.card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// Add some interactive elements
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements with animation class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize scroll animations after DOM load
setTimeout(addScrollAnimations, 500);