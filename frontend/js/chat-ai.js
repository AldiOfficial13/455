// Chat AI untuk Gaji System
class ChatAI {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createChatWidget();
        this.addEventListeners();
        this.addWelcomeMessage();
    }

    createChatWidget() {
        const chatHTML = `
            <div id="ai-chat-widget" class="chat-widget" style="display:none; flex-direction:column;">
                <div class="chat-header">
                    <div class="chat-title">
                        <i class="fas fa-robot"></i>
                        <span>AI Assistant</span>
                    </div>
                    <button class="close-chat" onclick="chatAI.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chat-body">
                    <div class="chat-messages" id="chatMessages"></div>
                </div>
                
                <div class="chat-input-container">
                    <div class="input-group">
                        <input type="text" id="chatInput" placeholder="Tanya tentang gaji..." />
                        <button id="sendBtn" class="send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div class="quick-actions">
                        <button class="quick-btn" data-q="Berapa total gaji saya?">Total Gaji</button>
                        <button class="quick-btn" data-q="Kapan gaji terakhir saya?">Gaji Terakhir</button>
                        <button class="quick-btn" data-q="Bantuan">Bantuan</button>
                    </div>
                </div>
                
                <div class="typing-indicator" id="typingIndicator" style="display:none;">
                    <span></span><span></span><span></span>
                </div>
            </div>
            
            <div id="chatToggle" class="chat-toggle">
                <i class="fas fa-comments"></i>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    addEventListeners() {
        // Toggle button
        const toggle = document.getElementById('chatToggle');
        toggle.addEventListener('click', () => this.toggleChat());

        // Send button
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter key support
        const input = document.getElementById('chatInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const q = e.currentTarget.getAttribute('data-q') || '';
                this.quickAsk(q);
            });
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const widget = document.getElementById('ai-chat-widget');
        widget.style.display = this.isOpen ? 'flex' : 'none';
        
        if (this.isOpen) {
            document.getElementById('chatInput').focus();
        }
    }

    close() {
        this.isOpen = false;
        const widget = document.getElementById('ai-chat-widget');
        if (widget) widget.style.display = 'none';
    }

    addWelcomeMessage() {
        this.addMessage("Halo! 👋 Saya AI Assistant Aldi Official Store.", 'ai');
        this.addMessage("Saya bisa bantu tentang:", 'ai');
        this.addMessage("• 💰 Info gaji Anda\n• 📊 Riwayat pengambilan\n• ⚙️ Panduan sistem\n• ❓ Pertanyaan umum", 'ai');
        this.addMessage("Silakan tanya saya apa saja!", 'ai');
    }

    addMessage(content, sender = 'user') {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;

        const avatar = sender === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // sanitize minimal: convert to string and escape HTML
        const safeContent = String(content)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        messageDiv.innerHTML = `
            <div class="msg-avatar">${avatar}</div>
            <div class="msg-content">
                <div class="msg-text">${safeContent}</div>
                <div class="msg-time">${time}</div>
            </div>
        `;

        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    showTyping() {
        const t = document.getElementById('typingIndicator');
        if (t) t.style.display = 'block';
    }

    hideTyping() {
        const t = document.getElementById('typingIndicator');
        if (t) t.style.display = 'none';
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        input.value = '';
        this.showTyping();

        // Simulasi respons AI sederhana — ganti dengan panggilan ke backend jika diinginkan
        setTimeout(() => {
            this.hideTyping();
            const reply = this.generateReply(text);
            this.addMessage(reply, 'ai');
        }, 700);
    }

    quickAsk(question) {
        const input = document.getElementById('chatInput');
        if (input) input.value = question;
        this.sendMessage();
    }

    generateReply(userText) {
        const t = userText.toLowerCase();
        if (t.includes('total gaji')) return 'Total gaji Anda dapat dilihat di halaman Statistik. Jika ingin, saya bisa ambil datanya untuk Anda.';
        if (t.includes('gaji terakhir') || t.includes('terakhir')) return 'Gaji terakhir dicatat pada entri terakhir di riwayat pengambilan.';
        if (t.includes('bantuan')) return 'Untuk bantuan: gunakan menu Users untuk manajemen user, menu Gaji untuk menambah/melihat pengambilan gaji, dan Statistik untuk ringkasan.';
        return "Maaf, saya belum paham. Coba tanyakan dengan kalimat lain atau cek dokumentasi.";
    }
}

// buat instance global agar onclick inline bekerja
window.chatAI = new ChatAI();