import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0TrgpsjzRdBG8ixF3hsnVNwHbsB3sY4I",
  authDomain: "create-website-with-ai.firebaseapp.com",
  projectId: "create-website-with-ai",
  storageBucket: "create-website-with-ai.firebasestorage.app",
  messagingSenderId: "914443478314",
  appId: "1:914443478314:web:ffebb72e8dc8e94919aa53"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // Loader
    setTimeout(() => {
        const loader = document.getElementById("loader");
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.display = "none", 800);
        }
    }, 600);

    // Dark/Light Mode
    const darkModeToggle = document.getElementById("darkModeToggle");
    const applyTheme = () => {
        const saved = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const isLight = saved === "light" || (!saved && !prefersDark);
        document.body.classList.toggle("light-mode", isLight);
        darkModeToggle.innerHTML = isLight ? '<i class="bx bx-sun"></i>' : '<i class="bx bx-moon"></i>';
    };
    darkModeToggle?.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        const isLight = document.body.classList.contains("light-mode");
        darkModeToggle.innerHTML = isLight ? '<i class="bx bx-sun"></i>' : '<i class="bx bx-moon"></i>';
        localStorage.setItem("theme", isLight ? "light" : "dark");
    });
    applyTheme();

    // Back to Top
    const backToTop = document.getElementById("backToTop");
    window.addEventListener("scroll", () => backToTop?.classList.toggle("show", window.scrollY > 500));
    backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // Reveal Animation
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("active"));
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));

    // Mobile Menu
    document.querySelector(".menu-toggle")?.addEventListener("click", () => 
        document.querySelector(".nav-links").classList.toggle("active")
    );

    // Profile Modal
    const profileModal = document.getElementById("profileModal");
    document.getElementById("profileAvatar")?.addEventListener("click", () => profileModal.classList.add("active"));
    document.querySelector(".close-modal")?.addEventListener("click", () => profileModal.classList.remove("active"));
    profileModal?.addEventListener("click", e => e.target === profileModal && profileModal.classList.remove("active"));

            // ============== UPLOAD PHOTO ប្រើ IMGBB (ឥតគិតថ្លៃ + មិនត្រូវកាត) ==============
    const photoInput = document.getElementById('photoInput');

    const openPhotoPicker = () => {
        photoInput.value = '';  // Clear old file
        photoInput.click();
    };

    // បើក file picker
    document.querySelector('.pretty-photo-btn')?.addEventListener('click', openPhotoPicker);
    document.getElementById('cameraTrigger')?.addEventListener('click', openPhotoPicker);

    // ពេលជ្រើសរូបភាព
    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            // ← ដាក់ API Key របស់បងនៅទីនេះ!
            const IMGBB_API_KEY = "806409a13d04337e8a06f2ba26e1cc68"; // ← ជំនួសទៅជា Key របស់បង!!!

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const photoURL = data.data.url;

                // រក្សាទុកក្នុង Firebase Auth + Firestore
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { photoURL });
                    await setDoc(doc(db, "users", auth.currentUser.uid), { photo: photoURL }, { merge: true });
                }

                // Update រូបភាពក្នុង UI
                const newUrl = photoURL + "?v=" + Date.now();
                document.getElementById('modalAvatar').src = newUrl;
                document.getElementById('userAvatarImg').src = newUrl;

                alert("Photo changed successfully! 🎉");
            } else {
                alert("Upload failed: " + data.error.message);
            }
        } catch (err) {
            console.error(err);
            alert("Upload failed! Check internet or API key");
        }
    });

    // Skill Bar Animation
    const skillSection = document.querySelector('#skills');
    const skillBars = document.querySelectorAll('.skill-progress');
    const animateSkillBars = () => {
        skillBars.forEach(bar => {
            bar.style.width = '0%';
            setTimeout(() => bar.style.width = bar.dataset.width, 150);
        });
    };
    if (skillSection) {
        new IntersectionObserver(([entry]) => entry.isIntersecting && animateSkillBars(), { threshold: 0.5 })
            .observe(skillSection);
    }

    // Auth State
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const snap = await getDoc(doc(db, "users", user.uid));
            const data = snap.exists() ? snap.data() : {};
            const name = data.name || user.displayName || "User";
            const photo = data.photo || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

            const timestamp = Date.now();
            document.getElementById('userAvatarImg').src = photo + "?t=" + timestamp;
            document.getElementById('modalAvatar').src = photo + "?t=" + timestamp;
            document.getElementById('modalName').textContent = name;
            document.getElementById('modalEmail').textContent = user.email;
            document.getElementById('editName').value = name;
            document.getElementById('editPhone').value = data.phone || "";
            document.getElementById('editBio').value = data.bio || "";
            document.getElementById('editLocation').value = data.location || "";

            document.getElementById('signInBtn').style.display = "none";
            document.getElementById('userView').style.display = "block";
        } else {
            document.getElementById('signInBtn').style.display = "block";
            document.getElementById('userView').style.display = "none";
        }
    });

    // Save Profile
    document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        const updatedData = {
            name: document.getElementById('editName').value.trim() || "User",
            phone: document.getElementById('editPhone').value.trim(),
            bio: document.getElementById('editBio').value.trim(),
            location: document.getElementById('editLocation').value.trim()
        };

        await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
        document.getElementById('modalName').textContent = updatedData.name;
        alert("Profile saved!");
        profileModal.classList.remove('active');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => signOut(auth).then(() => location.reload()));



    // ============== MUSIC PLAYER – ឮសំឡេងភ្លាម 100% (កែរួចហើយ!) ==============
    const musicToggle = document.getElementById("musicToggle");
    const audio = document.getElementById("backgroundMusic");
    let isPlaying = false;
    let userHasInteracted = false;

    // ដោះសោ auto-play ពេល visitor click លើកដំបូង
    const unlockAudio = () => {
        if (userHasInteracted) return;
        userHasInteracted = true;
        
        audio.volume = 0;
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0.4;
        }).catch(() => {});
        
        document.removeEventListener("click", unlockAudio);
        document.removeEventListener("keydown", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    // បញ្ជីបទខ្មែរ chill ស្អាតៗ
        const playlist = [

        "https://files.catbox.moe/3r5q9k.mp3",  // Laura Mam - សុំស្រលាញ់
        "https://files.catbox.moe/x7p2m1.mp3",  // Khmer Lofi Beat
        "https://files.catbox.moe/9f4g2h.mp3",  // Sereymon - ខ្យល់អូរ៉ូរ៉ា
        "https://files.catbox.moe/k3m8v9.mp3"   // G-Devith - ស្រលាញ់អូយ
    ];

    let currentTrack = 0;
    audio.src = playlist[currentTrack];
    audio.volume = 0.4;

    audio.addEventListener("ended", () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        audio.src = playlist[currentTrack];
        if (isPlaying) audio.play();
    });

    musicToggle?.addEventListener("click", () => {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            musicToggle.classList.remove("playing");
        } else {
            audio.play().catch(() => {
                alert("ចុចលើ website ម្ដងសិន ទើបអាចចាក់ចម្រៀងបាន ❤️");
            });
            isPlaying = true;
            musicToggle.classList.add("playing");
        }
    });

    // ចងចាំថាធ្លាប់ចាក់ឬអត់
    if (localStorage.getItem("musicEnabled") === "true") {
        musicToggle.classList.add("playing");
    }

    audio.addEventListener("play", () => localStorage.setItem("musicEnabled", "true"));
    audio.addEventListener("pause", () => localStorage.setItem("musicEnabled", "false"));

        // ============== CLEAR FORM ពេលចុច Menu ណាមួយ (Desktop + Mobile) ==============
    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");
    const sendBtn = contactForm?.querySelector(".send-btn");

    // មុខងារ clear form
    const clearContactForm = () => {
        if (contactForm) {
            contactForm.reset();
            formStatus.innerHTML = "";
            if (sendBtn) {
                sendBtn.innerHTML = "Send Message";
                sendBtn.disabled = false;
            }
        }
    };

    // 1. Desktop menu (ចុច Home, About, Skills...)
    document.querySelectorAll(".nav-links a").forEach(link => {
        link.addEventListener("click", clearContactForm);
    });

    // 2. Mobile menu (ចុច hamburger ឬចុច menu item ក្នុង mobile)
    document.querySelector(".menu-toggle")?.addEventListener("click", () => {
        setTimeout(clearContactForm, 300); // រង់ចាំ animation បើក menu រួច
    });

    // 3. បើ mobile menu មាន link ខាងក្នុង (សុវត្ថិភាពបំផុត)
    document.querySelectorAll(".nav-links li a").forEach(link => {
        link.addEventListener("click", () => {
            clearContactForm();
            // បិទ mobile menu ផង
            document.querySelector(".nav-links").classList.remove("active");
        });
    });

    // EmailJS ដដែល (ខ្ញុំដាក់បញ្ចូលឱ្យរួចរាល់)
    emailjs.init("dviMDBON91Iwtuf-s");

    contactForm?.addEventListener("submit", function(e) {
        e.preventDefault();
        const originalText = sendBtn.innerHTML;

        sendBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Sending...';
        sendBtn.disabled = true;
        formStatus.innerHTML = "";

        emailjs.sendForm('service_gn0aiw7', 'template_ias91a7', this)
            .then(() => {
                formStatus.innerHTML = '<p style="color:#00ff88; font-weight:600;">Message sent successfully! I\'ll reply soon ❤️</p>';
                this.reset();

                setTimeout(() => {
                    formStatus.innerHTML = "";
                    sendBtn.innerHTML = originalText;
                    sendBtn.disabled = false;
                }, 4000);
            })
            .catch(() => {
                formStatus.innerHTML = '<p style="color:#ff2d55; font-weight:600;">Failed to send. Try again!</p>';
                sendBtn.innerHTML = originalText;
                sendBtn.disabled = false;
            });
    });

            
});