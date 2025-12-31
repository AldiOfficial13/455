const API_URL = 'http://localhost:3000/api';
let gajiChartKaryawan;
let currentUser = null;

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(user);
    if (currentUser.role !== 'karyawan') {
        window.location.href = 'admin.html';
        return;
    }
    
    // Update UI with user data
    document.getElementById('karyawanName').textContent = currentUser.nama;
    document.getElementById('karyawanRole').textContent = currentUser.role;
    document.getElementById('welcomeName').textContent = currentUser.nama;
    document.getElementById('profilName').textContent = currentUser.nama;
    document.getElementById('profilRole').textContent = currentUser.role;
    document.getElementById('editNama').value = currentUser.nama;
    document.getElementById('editUsername').value = currentUser.username;
    
    // Set current date
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Show section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section and activate menu
    document.getElementById(`${section}-section`).style.display = 'block';
    
    // Add active class to clicked menu
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    menuItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(section)) {
            item.parentElement.classList.add('active');
        }
    });
    
    // Load data for specific sections
    if (section === 'dashboard') {
        loadDashboardData();
    } else if (section === 'gaji') {
        loadRiwayatGaji();
    } else if (section === 'profil') {
        loadActivity();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load gaji data for current user
        const response = await fetch(`${API_URL}/gaji`);
        const allGaji = await response.json();
        
        // Filter gaji for current user
        const userGaji = allGaji.filter(g => g.userId === currentUser.id);
        
        // Calculate statistics
        const totalPengambilan = userGaji.length;
        const totalGaji = userGaji.reduce((sum, item) => sum + item.jumlah, 0);
        const rataRataGaji = totalPengambilan > 0 ? Math.round(totalGaji / totalPengambilan) : 0;
        
        // Get last gaji
        let gajiTerakhir = '-';
        if (userGaji.length > 0) {
            const lastGaji = userGaji[userGaji.length - 1];
            gajiTerakhir = new Date(lastGaji.tanggal).toLocaleDateString('id-ID');
        }
        
        // Update UI
        document.getElementById('totalPengambilan').textContent = totalPengambilan;
        document.getElementById('totalGajiKaryawan').textContent = `Rp ${totalGaji.toLocaleString('id-ID')}`;
        document.getElementById('gajiTerakhir').textContent = gajiTerakhir;
        document.getElementById('rataRataGaji').textContent = `Rp ${rataRataGaji.toLocaleString('id-ID')}`;
        
        // Load chart
        loadGajiChartKaryawan(userGaji);
        
        // Load recent gaji
        loadRecentGaji(userGaji);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load gaji chart for karyawan
function loadGajiChartKaryawan(userGaji) {
    try {
        // Group by month
        const monthlyData = {};
        userGaji.forEach(item => {
            const date = new Date(item.tanggal);
            const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = 0;
            }
            monthlyData[monthYear] += item.jumlah;
        });
        
        const labels = Object.keys(monthlyData);
        const data = Object.values(monthlyData);
        
        if (gajiChartKaryawan) {
            gajiChartKaryawan.destroy();
        }
        
        const ctx = document.getElementById('gajiChartKaryawan').getContext('2d');
        gajiChartKaryawan = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gaji per Bulan',
                    data: data,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading gaji chart:', error);
    }
}

// Load recent gaji
function loadRecentGaji(userGaji) {
    const container = document.getElementById('recentGajiCards');
    container.innerHTML = '';
    
    // Get 3 most recent gaji
    const recentGaji = userGaji.slice(-3).reverse();
    
    if (recentGaji.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada data pengambilan gaji.</p>';
        return;
    }
    
    recentGaji.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gaji-card';
        card.innerHTML = `
            <div class="gaji-card-header">
                <i class="fas fa-calendar-check"></i>
                <span>${new Date(item.tanggal).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="gaji-card-body">
                <h4>Rp ${item.jumlah.toLocaleString('id-ID')}</h4>
                <p>${item.keterangan || 'Pengambilan gaji'}</p>
            </div>
            <div class="gaji-card-footer">
                <span class="status-success">Berhasil</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Load riwayat gaji
async function loadRiwayatGaji() {
    try {
        const response = await fetch(`${API_URL}/gaji`);
        const allGaji = await response.json();
        
        // Filter gaji for current user
        const userGaji = allGaji.filter(g => g.userId === currentUser.id);
        
        const tbody = document.getElementById('gajiTableBodyKaryawan');
        tbody.innerHTML = '';
        
        userGaji.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                <td>Rp ${item.jumlah.toLocaleString('id-ID')}</td>
                <td>${item.keterangan || '-'}</td>
                <td><span class="status-badge status-success">Berhasil</span></td>
            `;
            tbody.appendChild(row);
        });
        
        // Calculate summary
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const bulanIniGaji = userGaji.filter(item => {
            const itemDate = new Date(item.tanggal);
            return itemDate.getMonth() + 1 === currentMonth && itemDate.getFullYear() === currentYear;
        });
        
        const totalBulanIni = bulanIniGaji.reduce((sum, item) => sum + item.jumlah, 0);
        
        document.getElementById('totalBulanIni').textContent = `Rp ${totalBulanIni.toLocaleString('id-ID')}`;
        document.getElementById('jumlahPengambilan').textContent = `${userGaji.length} kali`;
        
    } catch (error) {
        console.error('Error loading riwayat gaji:', error);
    }
}

// Filter gaji
function filterGaji() {
    const selectedMonth = document.getElementById('bulanFilter').value;
    const rows = document.querySelectorAll('#gajiTableBodyKaryawan tr');
    
    rows.forEach(row => {
        const dateText = row.cells[0].textContent;
        const date = new Date(dateText);
        const month = date.getMonth() + 1;
        
        if (selectedMonth === '' || month === parseInt(selectedMonth)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Load activity
function loadActivity() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    // Mock activity data - in real app, this would come from API
    const activities = [
        { type: 'login', text: 'Login ke sistem', time: '2 jam yang lalu' },
        { type: 'gaji', text: 'Mengambil gaji Rp 2.500.000', time: '1 hari yang lalu' },
        { type: 'profil', text: 'Update informasi profil', time: '3 hari yang lalu' },
        { type: 'gaji', text: 'Mengambil gaji Rp 2.500.000', time: '1 minggu yang lalu' }
    ];
    
    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <small>${activity.time}</small>
            </div>
        `;
        activityList.appendChild(item);
    });
}

function getActivityIcon(type) {
    const icons = {
        login: 'sign-in-alt',
        gaji: 'money-bill-wave',
        profil: 'user-edit'
    };
    return icons[type] || 'circle';
}

// Download slip gaji
function downloadSlipGaji() {
    showMessage('Fitur download slip gaji sedang dikembangkan.', 'info');
}

// Profil form submission
document.getElementById('profilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nama = document.getElementById('editNama').value;
    const password = document.getElementById('editPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password && password !== confirmPassword) {
        showMessage('Password baru tidak cocok!', 'error');
        return;
    }
    
    // Update user data (in real app, this would be an API call)
    currentUser.nama = nama;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    // Update UI
    document.getElementById('karyawanName').textContent = nama;
    document.getElementById('welcomeName').textContent = nama;
    document.getElementById('profilName').textContent = nama;
    
    showMessage('Profil berhasil diperbarui!', 'success');
    
    // Clear password fields
    document.getElementById('editPassword').value = '';
    document.getElementById('confirmPassword').value = '';
});

// Show message
function showMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.padding = '15px 20px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.animation = 'slideInRight 0.3s ease';
    
    if (type === 'info') {
        messageDiv.style.background = 'rgba(52, 152, 219, 0.1)';
        messageDiv.style.color = '#2980b9';
        messageDiv.style.border = '1px solid rgba(52, 152, 219, 0.3)';
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Initialize
window.addEventListener('load', () => {
    checkAuth();
    loadDashboardData();
});

// Add CSS animations
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
    
    .user-profile {
        text-align: center;
        padding: 20px;
        border-bottom: 1px solid #34495e;
        margin-bottom: 20px;
    }
    
    .profile-avatar {
        width: 60px;
        height: 60px;
        background: #4CAF50;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 10px;
    }
    
    .profile-avatar i {
        font-size: 24px;
        color: white;
    }
    
    .profile-info h4 {
        color: white;
        margin-bottom: 5px;
    }
    
    .profile-info p {
        color: #bdc3c7;
        font-size: 12px;
    }
    
    .welcome-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 15px;
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .welcome-content h2 {
        margin-bottom: 10px;
    }
    
    .welcome-illustration i {
        font-size: 60px;
        opacity: 0.8;
    }
    
    .dashboard-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
    }
    
    .quick-actions {
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    
    .quick-actions h2 {
        color: #2c3e50;
        margin-bottom: 20px;
    }
    
    .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    
    .action-btn {
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        padding: 15px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .action-btn:hover {
        background: #4CAF50;
        color: white;
        border-color: #4CAF50;
        transform: translateY(-2px);
    }
    
    .action-btn i {
        font-size: 20px;
    }
    
    .recent-gaji h2 {
        color: #2c3e50;
        margin-bottom: 20px;
    }
    
    .gaji-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }
    
    .gaji-card {
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s ease;
    }
    
    .gaji-card:hover {
        transform: translateY(-5px);
    }
    
    .gaji-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
        color: #7f8c8d;
    }
    
    .gaji-card-body h4 {
        color: #2c3e50;
        font-size: 24px;
        margin-bottom: 5px;
    }
    
    .gaji-card-body p {
        color: #7f8c8d;
        margin-bottom: 15px;
    }
    
    .gaji-card-footer {
        text-align: right;
    }
    
    .status-success {
        background: rgba(46, 204, 113, 0.1);
        color: #27ae60;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .no-data {
        text-align: center;
        color: #7f8c8d;
        padding: 40px;
    }
    
    .filter-controls {
        display: flex;
        gap: 15px;
        align-items: center;
    }
    
    .filter-controls select {
        padding: 10px 15px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 14px;
    }
    
    .summary-box {
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        margin-top: 20px;
    }
    
    .summary-box h3 {
        color: #2c3e50;
        margin-bottom: 15px;
    }
    
    .summary-stats {
        display: flex;
        justify-content: space-between;
        gap: 20px;
    }
    
    .summary-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    
    .summary-item span {
        color: #7f8c8d;
        font-size: 14px;
    }
    
    .summary-item strong {
        color: #2c3e50;
        font-size: 18px;
    }
    
    .profil-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
    }
    
    .profil-card {
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    
    .profil-header {
        text-align: center;
        margin-bottom: 30px;
    }
    
    .profil-avatar-large {
        width: 80px;
        height: 80px;
        background: #4CAF50;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
    }
    
    .profil-avatar-large i {
        font-size: 30px;
        color: white;
    }
    
    .profil-header h2 {
        color: #2c3e50;
        margin-bottom: 5px;
    }
    
    .profil-header p {
        color: #7f8c8d;
    }
    
    .profil-form .form-group {
        margin-bottom: 20px;
    }
    
    .activity-card {
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    
    .activity-card h3 {
        color: #2c3e50;
        margin-bottom: 20px;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 0;
        border-bottom: 1px solid #ecf0f1;
    }
    
    .activity-item:last-child {
        border-bottom: none;
    }
    
    .activity-icon {
        width: 40px;
        height: 40px;
        background: #f8f9fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4CAF50;
    }
    
    .activity-content p {
        color: #2c3e50;
        margin-bottom: 5px;
    }
    
    .activity-content small {
        color: #7f8c8d;
    }
    
    @media (max-width: 768px) {
        .dashboard-grid {
            grid-template-columns: 1fr;
        }
        
        .profil-container {
            grid-template-columns: 1fr;
        }
        
        .summary-stats {
            flex-direction: column;
        }
        
        .gaji-cards {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);

// Dark mode
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.createToggleButton();
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle-btn';
        button.innerHTML = this.currentTheme === 'light' ? '🌙' : '☀️';
        button.onclick = () => this.toggleTheme();
        document.body.appendChild(button);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update icon
        document.querySelector('.theme-toggle-btn').innerHTML = 
            this.currentTheme === 'light' ? '🌙' : '☀️';
    }
}

// Initialize dark mode
const themeManager = new ThemeManager();