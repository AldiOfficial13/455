const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const usersFilePath = path.join(__dirname, 'data/users.json');
const gajiFilePath = path.join(__dirname, 'data/gaji.json');

const readData = (filepath) => {
    try {
        if (!fs.existsSync(filepath)) return [];
        const data = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('readData error', err);
        return [];
    }
};

const writeData = (filepath, data) => {
    try {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('writeData error', err);
    }
};

if (!fs.existsSync(usersFilePath)) {
    const initialUsers = [
        {
            id: 1,
            username: 'admin',
            password: bcrypt.hashSync('admin123', 10),
            role: 'admin',
            nama: 'Administrator',
            approved: true
        }
    ];
    writeData(usersFilePath, initialUsers);
}

if (!fs.existsSync(gajiFilePath)) {
    writeData(gajiFilePath, []);
}

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readData(usersFilePath);

    const user = users.find(u => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Username atau password salah' });
    }

    if (!user.approved) {
        return res.status(403).json({ message: 'Akun belum disetujui admin' });
    }

    res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        nama: user.nama
    });
});

// Users
app.get('/api/users', (req, res) => {
    const users = readData(usersFilePath);
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const users = readData(usersFilePath);
    const newUser = {
        id: Date.now(),
        ...req.body,
        password: bcrypt.hashSync(String(req.body.password || ''), 10),
        approved: false
    };

    users.push(newUser);
    writeData(usersFilePath, users);

    res.json({ message: 'User berhasil ditambahkan, menunggu persetujuan admin' });
});

app.put('/api/users/:id/approve', (req, res) => {
    const users = readData(usersFilePath);
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id, 10));

    if (userIndex !== -1) {
        users[userIndex].approved = true;
        writeData(usersFilePath, users);
        res.json({ message: 'User berhasil disetujui' });
    } else {
        res.status(404).json({ message: 'User tidak ditemukan' });
    }
});

// Gaji
app.get('/api/gaji', (req, res) => {
    const gaji = readData(gajiFilePath);
    res.json(gaji);
});

app.post('/api/gaji', (req, res) => {
    const gaji = readData(gajiFilePath);
    const newGaji = {
        id: Date.now(),
        ...req.body,
        tanggal: new Date().toISOString()
    };

    gaji.push(newGaji);
    writeData(gajiFilePath, gaji);

    res.json({ message: 'Data gaji berhasil disimpan' });
});

// Statistik
app.get('/api/statistik', (req, res) => {
    const gaji = readData(gajiFilePath);

    const totalGaji = gaji.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
    const now = new Date();
    const bulanIni = gaji
        .filter(g => {
            const gajiDate = new Date(g.tanggal);
            return gajiDate.getMonth() === now.getMonth() && gajiDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);

    res.json({
        totalGaji,
        bulanIni,
        totalPengambilan: gaji.length
    });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});