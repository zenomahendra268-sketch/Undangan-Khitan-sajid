const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GUESTS_FILE = path.join(__dirname, 'guests.json');

// Initialize guests.json if not exists
if (!fs.existsSync(GUESTS_FILE)) {
    fs.writeFileSync(GUESTS_FILE, JSON.stringify([]));
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper to read/write guests
const getGuests = () => JSON.parse(fs.readFileSync(GUESTS_FILE));
const saveGuests = (guests) => fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2));

// Admin Route
app.get('/admin', (req, res) => {
    const guests = getGuests();
    res.render('admin', { guests });
});

app.post('/admin/add-guest', (req, res) => {
    const { name } = req.body;
    if (name) {
        const guests = getGuests();
        const slug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        
        const existing = guests.find(g => g.slug === slug);
        if (!existing) {
            // Memastikan menggunakan https jika di production (seperti Railway)
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const guestLink = `${protocol}://${req.get('host')}/to/${slug}`;
            guests.push({ id: Date.now(), name, slug, link: guestLink });
            saveGuests(guests);
        }
    }
    res.redirect('/admin');
});

app.post('/admin/edit-guest', (req, res) => {
    const { id, name } = req.body;
    const guests = getGuests();
    const index = guests.findIndex(g => g.id == id);
    if (index !== -1) {
        const slug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const guestLink = `${protocol}://${req.get('host')}/to/${slug}`;
        guests[index] = { ...guests[index], name, slug, link: guestLink };
        saveGuests(guests);
    }
    res.redirect('/admin');
});

app.post('/admin/delete-guest', (req, res) => {
    const { id } = req.body;
    let guests = getGuests();
    guests = guests.filter(g => g.id != id);
    saveGuests(guests);
    res.redirect('/admin');
});

// Invitation Route
app.get('/to/:slug', (req, res) => {
    const guests = getGuests();
    const guest = guests.find(g => g.slug === req.params.slug);
    if (guest) {
        res.render('invitation', { guestName: guest.name });
    } else {
        const nameFromSlug = req.params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        res.render('invitation', { guestName: nameFromSlug || 'Tamu Undangan' });
    }
});

// General Invitation Route
app.get('/undangan', (req, res) => {
    res.render('invitation', { guestName: 'Tamu Undangan' });
});

// Default Route
app.get('/', (req, res) => {
    res.render('invitation', { guestName: 'Tamu Undangan' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
