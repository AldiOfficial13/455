// Chart customization
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.color = '#7f8c8d';

// Animation for charts
Chart.defaults.animation.duration = 1000;
Chart.defaults.animation.easing = 'easeOutQuart';

// Add CSS animation for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);