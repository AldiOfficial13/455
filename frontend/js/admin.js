const API_URL = 'http://localhost:3000/api';
let gajiChart, monthlyChart, roleChart;

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
        window.location.href = 'karyawan.html';
        return;
    }
    
    document.getElementById('adminName').textContent = userData.nama;
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
    } else if (section === 'users') {
        loadUsers();
    } else if (section === 'gaji') {
        loadGaji();
    } else if (section === 'statistik') {
        loadStatistik();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load stats
        const statsResponse = await fetch(`${API_URL}/statistik`);
        const stats = await statsResponse.json();
        
        document.getElementById('totalGaji').textContent = `Rp ${stats.totalGaji.toLocaleString('id-ID')}`;
        document.getElementById('bulanIni').textContent = `Rp ${stats.bulanIni.toLocaleString('id-ID')}`;
        document.getElementById('totalPengambilan').textContent = stats.totalPengambilan;
        
        // Load users count
        const usersResponse = await fetch(`${API_URL}/users`);
        const users = await usersResponse.json();
        
        document.getElementById('totalUsers').textContent = users.length;
        
        const pendingUsers = users.filter(u => !u.approved).length;
        document.getElementById('pendingApproval').textContent = pendingUsers;
        document.getElementById('pendingCount').textContent = pendingUsers;
        
        // Load chart data
        loadGajiChart();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load gaji chart
async function loadGajiChart() {
    try {
        const response = await fetch(`${API_URL}/gaji`);
        const gajiData = await response.json();
        
        // Group by month
        const monthlyData = {};
        gajiData.forEach(item => {
            const date = new Date(item.tanggal);
            const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = 0;
            }
            monthlyData[monthYear] += item.jumlah;
        });
        
        const labels = Object.keys(monthlyData).sort();
        const data = labels.map(label => monthlyData[label]);
        
        if (gajiChart) {
            gajiChart.destroy();
        }
        
        const ctx = document.getElementById('gajiChart').getContext('2d');
        gajiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Gaji per Bulan',
                    data: data,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
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

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.nama}</td>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <span class="status-badge ${user.approved ? 'status-approved' : 'status-pending'}">
                        ${user.approved ? 'Disetujui' : 'Menunggu'}
                    </span>
                </td>
                <td>
                    ${!user.approved ? 
                        `<button class="btn-approve" onclick="approveUser(${user.id})">
                            <i class="fas fa-check"></i> Setujui
                        </button>` : 
                        '<i class="fas fa-check-circle" style="color: #27ae60;"></i>'
                    }
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Approve user
async function approveUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/approve`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showMessage('User berhasil disetujui', 'success');
            loadUsers();
            loadDashboardData();
        } else {
            showMessage('Gagal menyetujui user', 'error');
        }
    } catch (error) {
        showMessage('Terjadi kesalahan', 'error');
    }
}

// Load gaji data
async function loadGaji() {
    try {
        const response = await fetch(`${API_URL}/gaji`);
        const gaji = await response.json();
        
        const tbody = document.getElementById('gajiTableBody');
        tbody.innerHTML = '';
        
        gaji.forEach(item => {
            const row = document.createElement('tr');
            const date = new Date(item.tanggal).toLocaleDateString('id-ID');
            row.innerHTML = `
                <td>${date}</td>
                <td>${item.nama}</td>
                <td>Rp ${item.jumlah.toLocaleString('id-ID')}</td>
                <td>${item.keterangan || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading gaji:', error);
    }
}

// Load statistik
async function loadStatistik() {
    try {
        // Load gaji data for monthly chart
        const gajiResponse = await fetch(`${API_URL}/gaji`);
        const gajiData = await gajiResponse.json();
        
        // Group by month
        const monthlyData = {};
        gajiData.forEach(item => {
            const date = new Date(item.tanggal);
            const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            if (!monthlyData[monthName]) {
                monthlyData[monthName] = 0;
            }
            monthlyData[monthName] += item.jumlah;
        });
        
        // Monthly chart
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(monthlyData),
                datasets: [{
                    label: 'Total Gaji',
                    data: Object.values(monthlyData),
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: '#3498db',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
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
        
        // Role distribution chart
        const usersResponse = await fetch(`${API_URL}/users`);
        const users = await usersResponse.json();
        
        const roleData = {};
        users.forEach(user => {
            if (!roleData[user.role]) {
                roleData[user.role] = 0;
            }
            roleData[user.role]++;
        });
        
        if (roleChart) {
            roleChart.destroy();
        }
        
        const roleCtx = document.getElementById('roleChart').getContext('2d');
        roleChart = new Chart(roleCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(roleData),
                datasets: [{
                    data: Object.values(roleData),
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71',
                        '#f39c12'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading statistik:', error);
    }
}

// Modal functions
function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function showAddGajiModal() {
    loadKaryawanOptions();
    document.getElementById('addGajiModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Load karyawan options
async function loadKaryawanOptions() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        const select = document.getElementById('gajiUserId');
        select.innerHTML = '';
        
        users.filter(user => user.role === 'karyawan' && user.approved).forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nama;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading karyawan options:', error);
    }
}

// Add user form submission
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        nama: document.getElementById('newUserNama').value,
        username: document.getElementById('newUserUsername').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value
    };
    
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            showMessage('User berhasil ditambahkan', 'success');
            closeModal('addUserModal');
            loadUsers();
            loadDashboardData();
        } else {
            showMessage('Gagal menambahkan user', 'error');
        }
    } catch (error) {
        showMessage('Terjadi kesalahan', 'error');
    }
});

// Add gaji form submission
document.getElementById('addGajiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const gajiData = {
        userId: parseInt(document.getElementById('gajiUserId').value),
        nama: document.getElementById('gajiUserId').selectedOptions[0].text,
        jumlah: parseInt(document.getElementById('gajiJumlah').value),
        keterangan: document.getElementById('gajiKeterangan').value
    };
    
    try {
        const response = await fetch(`${API_URL}/gaji`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gajiData)
        });
        
        if (response.ok) {
            showMessage('Data gaji berhasil disimpan', 'success');
            closeModal('addGajiModal');
            loadGaji();
            loadDashboardData();
        } else {
            showMessage('Gagal menyimpan data gaji', 'error');
        }
    } catch (error) {
        showMessage('Terjadi kesalahan', 'error');
    }
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

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

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