/**
 * BeatStream Music Player Controller Script
 * 
 * This file handles all audio playback logic using the HTML5 Audio API,
 * dynamic UI updates (song titles, artist names, album art), progress scrubbing,
 * volume controls, ambient CSS variable updates, and playback modes (Shuffle/Repeat).
 */

// ==========================================================================
// 1. Tracklist Database (Sample audio files and styling configurations)
// ==========================================================================
const tracklist = [
    {
        title: "Neon Horizon",
        artist: "Retro Spectrum",
        cover: "assets/neon_horizon.png",
        audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: "6:12",
        // Color configuration for card glow and background gradient blobs
        accentColor: "#a29bfe",      // Soft purple
        accentGlow: "rgba(162, 155, 254, 0.3)"
    },
    {
        title: "Midnight Cafe",
        artist: "Lofi Dreams",
        cover: "assets/midnight_cafe.png",
        audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: "7:05",
        accentColor: "#e17055",      // Sunset orange
        accentGlow: "rgba(225, 112, 85, 0.3)"
    },
    {
        title: "Stellar Drift",
        artist: "Cosmic Echoes",
        cover: "assets/stellar_drift.png",
        audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        duration: "5:02",
        accentColor: "#00cec9",      // Deep teal
        accentGlow: "rgba(0, 206, 201, 0.3)"
    },
    {
        title: "Cyberpunk Pulse",
        artist: "Synthwave City",
        cover: "assets/cyberpunk_pulse.png",
        audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        duration: "6:02",
        accentColor: "#ff7675",      // Neon pink/coral
        accentGlow: "rgba(255, 118, 117, 0.3)"
    },
    {
        title: "Ocean Breeze",
        artist: "Pastel Shore",
        cover: "assets/ocean_breeze.png",
        audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        duration: "5:38",
        accentColor: "#55efc4",      // Mint green
        accentGlow: "rgba(85, 239, 196, 0.3)"
    }
];

// ==========================================================================
// 2. DOM Elements Selection
// ==========================================================================
const audio = document.getElementById("audio-element");
const playerCard = document.getElementById("player-card");
const ambientGlow1 = document.getElementById("ambient-glow-1");

// Metadata elements
const songTitle = document.getElementById("song-title");
const artistName = document.getElementById("artist-name");
const albumArt = document.getElementById("album-art");
const vinylRecord = document.getElementById("vinyl-record");

// Playback controls
const playPauseBtn = document.getElementById("btn-play-pause");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const prevBtn = document.getElementById("btn-prev");
const nextBtn = document.getElementById("btn-next");
const shuffleBtn = document.getElementById("btn-shuffle");
const repeatBtn = document.getElementById("btn-repeat");

// Progress indicators
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");

// Volume elements
const volumeBtn = document.getElementById("btn-volume");
const volumeHighIcon = document.getElementById("volume-high-icon");
const volumeMuteIcon = document.getElementById("volume-mute-icon");
const volumeSlider = document.getElementById("volume-slider");
const volumeFill = document.getElementById("volume-fill");

// Playlist DOM elements
const playlistPanel = document.getElementById("playlist-panel");
const playlistToggleBtn = document.getElementById("btn-playlist-toggle");
const playlistCloseBtn = document.getElementById("btn-playlist-close");
const playlistItemsContainer = document.getElementById("playlist-items");
const trackCountEl = document.getElementById("track-count");

// ==========================================================================
// 3. Audio Player State Variables
// ==========================================================================
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let previousVolume = 0.8; // Store last volume setting for unmuting

// ==========================================================================
// 4. Core Player Functions
// ==========================================================================

/**
 * Loads a track from the playlist based on its index and updates the UI.
 * @param {number} index - Index of the track in the tracklist array.
 */
function loadTrack(index) {
    const track = tracklist[index];
    
    // Update active index
    currentTrackIndex = index;
    
    // Update audio source
    audio.src = track.audioSrc;
    
    // Update text labels
    songTitle.textContent = track.title;
    artistName.textContent = track.artist;
    
    // Update cover art
    albumArt.src = track.cover;
    albumArt.alt = `${track.title} Cover Art`;
    
    // Dynamically update theme CSS variables to morph player accents and shadows
    document.documentElement.style.setProperty('--accent-color', track.accentColor);
    document.documentElement.style.setProperty('--accent-glow', track.accentGlow);
    ambientGlow1.style.backgroundColor = track.accentColor;
    
    // Reset time labels
    currentTimeEl.textContent = "0:00";
    totalTimeEl.textContent = "0:00";
    progressBar.value = 0;
    progressFill.style.width = "0%";

    // If a track was already playing, auto-play the next loaded track
    if (isPlaying) {
        playTrack();
    } else {
        updatePlaylistUI();
    }
}

/**
 * Commences audio playback, updates play/pause buttons, and spins the vinyl cover.
 */
function playTrack() {
    isPlaying = true;
    audio.play()
        .then(() => {
            // Success - update UI icons and start cover rotation animation
            playIcon.classList.add("hidden");
            pauseIcon.classList.remove("hidden");
            vinylRecord.classList.add("playing");
            updatePlaylistUI();
        })
        .catch(err => {
            console.error("Audio playback failed or was interrupted:", err);
            // Revert state if play was blocked by browser autoplay policies
            isPlaying = false;
            updatePlaylistUI();
        });
}

/**
 * Pauses audio playback, updates UI icons, and stops the vinyl cover rotation.
 */
function pauseTrack() {
    isPlaying = false;
    audio.pause();
    
    // Update UI icons and pause vinyl rotation
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
    vinylRecord.classList.remove("playing");
    updatePlaylistUI();
}

/**
 * Toggles between playing and pausing states.
 */
function togglePlayPause() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

/**
 * Navigates to the previous track.
 * If the current track has been playing for more than 3 seconds, restarts the track instead.
 */
function prevTrack() {
    // Standard media player UX: restart song if it has played past 3 seconds
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        let index = currentTrackIndex - 1;
        
        // Wrap around to end of playlist
        if (index < 0) {
            index = tracklist.length - 1;
        }
        
        loadTrack(index);
        playTrack();
    }
}

/**
 * Navigates to the next track. Picks a random track if Shuffle mode is enabled.
 */
function nextTrack() {
    let index = currentTrackIndex;

    if (isShuffle) {
        // Pick a random track index that is different from current track (if list length > 1)
        if (tracklist.length > 1) {
            do {
                index = Math.floor(Math.random() * tracklist.length);
            } while (index === currentTrackIndex);
        }
    } else {
        index = currentTrackIndex + 1;
        
        // Wrap around to start of playlist
        if (index >= tracklist.length) {
            index = 0;
        }
    }
    
    loadTrack(index);
    playTrack();
}

/**
 * Formats time in seconds into an "M:SS" string for displays.
 * @param {number} secs - Time in seconds.
 * @returns {string} Formatted MM:SS time string.
 */
function formatTime(secs) {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// ==========================================================================
// 5. Interactive Event Listeners
// ==========================================================================

// Play/Pause, Next, and Previous buttons
playPauseBtn.addEventListener("click", togglePlayPause);
prevBtn.addEventListener("click", prevTrack);
nextBtn.addEventListener("click", nextTrack);

// Shuffle mode button
shuffleBtn.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
});

// Repeat mode button
repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle("active", isRepeat);
});

// Real-time track progress updates (while playing)
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        const progressPercent = (currentTime / duration) * 100;
        
        // Update range input value and visual fill gradient width
        progressBar.value = progressPercent;
        progressFill.style.width = `${progressPercent}%`;
        
        // Update current time label
        currentTimeEl.textContent = formatTime(currentTime);
    }
});

// Track metadata loaded event (reads audio length)
audio.addEventListener("loadedmetadata", () => {
    totalTimeEl.textContent = formatTime(audio.duration);
});

// Song seek/scrub input (dragging progress bar slider)
progressBar.addEventListener("input", (e) => {
    if (audio.duration) {
        const seekPercent = parseFloat(e.target.value);
        const seekTime = (seekPercent / 100) * audio.duration;
        
        // Sync time text label and slider progress fill instantly on slide/drag
        currentTimeEl.textContent = formatTime(seekTime);
        progressFill.style.width = `${seekPercent}%`;
    }
});

// Commit the seek operation when user stops dragging / clicks slider
progressBar.addEventListener("change", (e) => {
    if (audio.duration) {
        const seekPercent = parseFloat(e.target.value);
        audio.currentTime = (seekPercent / 100) * audio.duration;
    }
});

// Audio playback completion handler (ended event)
audio.addEventListener("ended", () => {
    if (isRepeat) {
        // Repeat mode: replay same track from start
        audio.currentTime = 0;
        playTrack();
    } else {
        // Normal mode: auto advance to next song
        nextTrack();
    }
});

// Volume slider input handler (updating volume percentage and UI)
function updateVolume(val) {
    // Val ranges from 0 to 100
    const volumeLevel = val / 100;
    audio.volume = volumeLevel;
    
    // Sync slider fill bar width
    volumeFill.style.width = `${val}%`;
    
    // Switch between audio and mute icons
    if (volumeLevel === 0) {
        volumeHighIcon.classList.add("hidden");
        volumeMuteIcon.classList.remove("hidden");
    } else {
        volumeHighIcon.classList.remove("hidden");
        volumeMuteIcon.classList.add("hidden");
    }
}

// Adjust volume on dragging/sliding
volumeSlider.addEventListener("input", (e) => {
    updateVolume(e.target.value);
});

// Volume icon button click handler (Mute/Unmute toggle)
volumeBtn.addEventListener("click", () => {
    if (audio.volume > 0) {
        // Store current volume level before muting
        previousVolume = audio.volume;
        
        // Update audio properties and slider element
        updateVolume(0);
        volumeSlider.value = 0;
    } else {
        // Restore last volume level
        const restoreVal = Math.round(previousVolume * 100);
        updateVolume(restoreVal);
        volumeSlider.value = restoreVal;
    }
});

// ==========================================================================
// 6. Playlist Interface Logic
// ==========================================================================

/**
 * Toggles the playlist overlay visual state.
 */
function togglePlaylist() {
    const isOpen = playlistPanel.classList.toggle("open");
    playlistToggleBtn.classList.toggle("active", isOpen);
}

/**
 * Closes the playlist overlay.
 */
function closePlaylist() {
    playlistPanel.classList.remove("open");
    playlistToggleBtn.classList.remove("active");
}

/**
 * Dynamically renders all tracks from the database into the playlist drawer.
 */
function renderPlaylist() {
    playlistItemsContainer.innerHTML = "";
    tracklist.forEach((track, index) => {
        const item = document.createElement("div");
        item.classList.add("playlist-item");
        if (index === currentTrackIndex) {
            item.classList.add("active");
        }
        item.setAttribute("data-index", index);
        
        const displayIndex = (index + 1).toString().padStart(2, '0');
        
        item.innerHTML = `
            <div class="playlist-item-index">${displayIndex}</div>
            <img src="${track.cover}" alt="${track.title} Cover" class="playlist-item-art">
            <div class="playlist-item-details">
                <span class="playlist-item-title">${track.title}</span>
                <span class="playlist-item-artist">${track.artist}</span>
            </div>
            <span class="playlist-item-duration">${track.duration}</span>
        `;
        
        // Click track to load/play or toggle play state
        item.addEventListener("click", () => {
            if (currentTrackIndex === index) {
                togglePlayPause();
            } else {
                loadTrack(index);
                playTrack();
            }
        });
        
        playlistItemsContainer.appendChild(item);
    });
}

/**
 * Updates the playlist items to highlight the active track,
 * and toggles the CSS-based visual equalizer/visualizer animation.
 */
function updatePlaylistUI() {
    const items = playlistItemsContainer.querySelectorAll(".playlist-item");
    items.forEach((item, index) => {
        const indexEl = item.querySelector(".playlist-item-index");
        if (index === currentTrackIndex) {
            item.classList.add("active");
            
            if (isPlaying) {
                item.classList.remove("paused");
                indexEl.innerHTML = `
                    <div class="eq-animation">
                        <div class="eq-bar"></div>
                        <div class="eq-bar"></div>
                        <div class="eq-bar"></div>
                        <div class="eq-bar"></div>
                    </div>
                `;
            } else {
                item.classList.add("paused");
                indexEl.innerHTML = `
                    <div class="eq-animation">
                        <div class="eq-bar"></div>
                        <div class="eq-bar"></div>
                        <div class="eq-bar"></div>
                        <div class="eq-bar"></div>
                    </div>
                `;
            }
        } else {
            item.classList.remove("active", "paused");
            const displayIndex = (index + 1).toString().padStart(2, '0');
            indexEl.innerHTML = displayIndex;
        }
    });
}

// Bind playlist toggle button events
playlistToggleBtn.addEventListener("click", togglePlaylist);
playlistCloseBtn.addEventListener("click", closePlaylist);

// Keyboard Accessibility Shortcuts
document.addEventListener("keydown", (e) => {
    // Only capture keys if user is not typing in an input text field (none here, but good practice)
    if (document.activeElement.tagName === "INPUT" && document.activeElement.type === "text") return;
    
    switch (e.code) {
        case "Space":
            e.preventDefault(); // Stop standard screen scroll down action
            togglePlayPause();
            break;
        case "ArrowRight":
            // Skip forward 5 seconds
            audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
            break;
        case "ArrowLeft":
            // Skip backward 5 seconds
            audio.currentTime = Math.max(audio.currentTime - 5, 0);
            break;
        case "Escape":
            closePlaylist();
            break;
        case "KeyP":
            togglePlaylist();
            break;
    }
});

// ==========================================================================
// 7. Application Initialization
// ==========================================================================
// Initialize dynamic track list count tag
trackCountEl.textContent = `${tracklist.length} Tracks`;

// Dynamically render the visual playlist structure
renderPlaylist();

// Load initial track (First track)
loadTrack(0);

// Initialize volume slider to match state (default 80% volume)
audio.volume = 0.8;
volumeSlider.value = 80;
volumeFill.style.width = "80%";
