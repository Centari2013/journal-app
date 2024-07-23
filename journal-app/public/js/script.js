// Function to handle login
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('token', data.token); // Store token in local storage
        window.location.href = 'journal.html'; // Redirect to journal page on successful login
    } else {
        alert('Login failed!');
    }
}

// Function to handle registration
async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
        alert('Registration successful! Please log in.');
        window.location.href = 'index.html'; // Redirect to login page after successful registration
    } else {
        alert('Registration failed!');
    }
}

// Function to handle entry creation
async function createEntry() {
    const content = document.getElementById('entryContent').value;
    const token = localStorage.getItem('token'); // Retrieve token from local storage
    const response = await fetch('/entries', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Send token in Authorization header
        },
        body: JSON.stringify({ content })
    });
    const data = await response.json();
    if (data.id) {
        loadEntries();
    }
}

// Function to handle entry update
async function updateEntry(id, newContent) {
    const token = localStorage.getItem('token'); // Retrieve token from local storage
    const response = await fetch(`/entries/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Send token in Authorization header
        },
        body: JSON.stringify({ content: newContent })
    });
    const data = await response.json();
    if (data.success) {
        loadEntries();
    } else {
        alert('Failed to update entry!');
    }
}

// Function to handle entry deletion
async function deleteEntry(id) {
    const token = localStorage.getItem('token'); // Retrieve token from local storage
    const response = await fetch(`/entries/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}` // Send token in Authorization header
        }
    });
    const data = await response.json();
    if (data.success) {
        loadEntries();
    } else {
        alert('Failed to delete entry!');
    }
}

// Function to load entries
async function loadEntries() {
    const token = localStorage.getItem('token'); // Retrieve token from local storage
    const response = await fetch('/entries', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` // Send token in Authorization header
        }
    });
    const data = await response.json();
    const entriesDiv = document.getElementById('entries');
    entriesDiv.innerHTML = data.entries.map(entry => `
        <div>
            <p>${entry.content}</p>
            <small>${entry.timestamp}</small>
            <button onclick="editEntry(${entry.id})">Edit</button>
            <button onclick="deleteEntry(${entry.id})">Delete</button>
        </div>
    `).join('');
}

// Function to handle logout
function logout() {
    localStorage.removeItem('token'); // Remove token from local storage
    window.location.href = 'index.html';
}

// Load entries on journal page load
if (window.location.pathname.endsWith('journal.html')) {
    window.onload = loadEntries;
}

// Function to edit an entry
function editEntry(id) {
    const newContent = prompt('Enter new content:');
    if (newContent !== null) {
        updateEntry(id, newContent);
    }
}
