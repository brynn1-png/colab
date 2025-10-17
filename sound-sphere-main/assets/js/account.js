'use strict';

// CLIENT: extracted application logic
// IMPORTANT: do NOT hardcode secrets here. Either set window.SUPABASE_ANON_KEY at runtime
// or route privileged operations through the server proxy (see server/ example).

const SUPABASE_URL = 'https://tqttpbhspgqwniwaokqh.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'REPLACE_WITH_ANON_KEY_OR_USE_SERVER_PROXY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const accountForm = document.getElementById('accountForm');
const updateBtn = document.getElementById('updateBtn');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const publicTracksList = document.getElementById('publicTracksList');
const privateTracksList = document.getElementById('privateTracksList');

let currentUser = null;

async function loadPageData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.replace('SignIn.html');
        return;
    }
    currentUser = user;
    await Promise.all([ loadProfile(), loadUserMusic() ]);
}

async function loadProfile() {
    emailInput.value = currentUser.email;
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUser.id)
        .single();

    if (error) console.error('Error fetching profile:', error);
    else if (profile) usernameInput.value = profile.username || '';
}

async function loadUserMusic() {
    const { data: tracks, error } = await supabase
        .from('music')
        .select('track_title, artist_name, privacy')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user music:', error);
        return;
    }

    const publicTracks = tracks.filter(t => t.privacy === 'public');
    const privateTracks = tracks.filter(t => t.privacy === 'private');

    publicTracksList.innerHTML = '';
    if (publicTracks.length) {
        publicTracks.forEach(track => {
            const li = document.createElement('li');
            li.className = 'track-item';
            li.innerHTML = `
                <div class="track-info">
                    <span class="track-icon">🎵</span>
                    <div>
                        <div class="track-title">${track.track_title}</div>
                        <div class="track-artist">${track.artist_name}</div>
                    </div>
                </div>
            `;
            publicTracksList.appendChild(li);
        });
    } else {
        publicTracksList.innerHTML = '<li class="no-tracks-message">You have not uploaded any public tracks.</li>';
    }

    privateTracksList.innerHTML = '';
    if (privateTracks.length) {
        privateTracks.forEach(track => {
            const li = document.createElement('li');
            li.className = 'track-item';
            li.innerHTML = `
                <div class="track-info">
                    <span class="track-icon">🔒</span>
                    <div>
                        <div class="track-title">${track.track_title}</div>
                        <div class="track-artist">${track.artist_name}</div>
                    </div>
                </div>
            `;
            privateTracksList.appendChild(li);
        });
    } else {
        privateTracksList.innerHTML = '<li class="no-tracks-message">You have not uploaded any private tracks.</li>';
    }
}

async function updateProfileServerProxy(newUsername) {
    // Example: proxy update to server-side endpoint which uses service role key.
    // Server must validate the Authorization Bearer <access_token> you forward.
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) throw new Error('No access token');

    const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ username: newUsername })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Server proxy error');
    }
    return res.json();
}

accountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';
    const newUsername = usernameInput.value.trim();

    try {
        if (window.USE_SERVER_PROXY) {
            // Preferred: perform privileged writes via server proxy
            await updateProfileServerProxy(newUsername);
        } else {
            // Client update: requires anon key (less secure)
            const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', currentUser.id);
            if (error) throw error;
            await supabase.auth.updateUser({ data: { username: newUsername } });
        }
        alert('Profile updated successfully!');
    } catch (err) {
        console.error(err);
        alert('Error updating profile: ' + (err.message || err));
    } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = 'Update Profile';
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.replace('SignIn.html');
});

document.addEventListener('DOMContentLoaded', loadPageData);