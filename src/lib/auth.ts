import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize from LocalStorage if available
const storedToken = browser ? localStorage.getItem('token') : null;
const storedEmail = browser ? localStorage.getItem('email') : null;

export const token = writable(storedToken);
export const email = writable(storedEmail);

// Subscribe to changes and update LocalStorage
if (browser) {
    token.subscribe((value) => {
        if (value) localStorage.setItem('token', value);
        else localStorage.removeItem('token');
    });
    
    email.subscribe((value) => {
        if (value) localStorage.setItem('email', value);
        else localStorage.removeItem('email');
    });
}

// API Helper
export const API_URL = 'http://localhost:8080/api';