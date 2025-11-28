import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

    // ============== UPLOAD PHOTO ប្រើ IMGBB ==============
    const photoInput = document.getElementById('photoInput');
    const openPhotoPicker = () => {
        photoInput.value = '';
        photoInput.click();
    };
    document.querySelector('.pretty-photo-btn')?.addEventListener('click', openPhotoPicker);
    document.getElementById('cameraTrigger')?.addEventListener('click', openPhotoPicker);

    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const IMGBB_API_KEY = "806409a13d04337e8a06f2ba26e1cc68";
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                const photoURL = data.data.url;
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { photoURL });
                    await setDoc(doc(db, "users", auth.currentUser.uid), { photo: photoURL }, { merge: true });
                }
                const newUrl = photoURL + "?v=" + Date.now();
                document.getElementById('modalAvatar').src = newUrl;
                document.getElementById('userAvatarImg').src = newUrl;
                alert("Photo changed successfully!");
            } else {
                alert("Upload failed: " + data.error.message);
            }
        } catch (err) {
            console.error(err);
            alert("Upload failed! Check internet or API key");
        }
    });

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

    // ============== MUSIC PLAYER ==============
    const musicToggle = document.getElementById("musicToggle");
    const audio = document.getElementById("backgroundMusic");
    let isPlaying = false;
    let userHasInteracted = false;

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

    const playlist = [
        "https://files.catbox.moe/3r5q9k.mp3",
        "https://files.catbox.moe/x7p2m1.mp3",
        "https://files.catbox.moe/9f4g2h.mp3",
        "https://files.catbox.moe/k3m8v9.mp3"
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
            audio.play().catch(() => alert("ចុចលើ website ម្ដងសិន ❤️"));
            isPlaying = true;
            musicToggle.classList.add("playing");
        }
    });

    if (localStorage.getItem("musicEnabled") === "true") {
        musicToggle.classList.add("playing");
    }
    audio.addEventListener("play", () => localStorage.setItem("musicEnabled", "true"));
    audio.addEventListener("pause", () => localStorage.setItem("musicEnabled", "false"));

    // ============== CLEAR FORM + CONFETTI ==============
    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");
    const sendBtn = contactForm?.querySelector(".send-btn");

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

    document.querySelectorAll(".nav-links a, .nav-links li a").forEach(link => {
        link.addEventListener("click", clearContactForm);
    });
    document.querySelector(".menu-toggle")?.addEventListener("click", () => setTimeout(clearContactForm, 300));

    function launchConfetti() {
        const canvas = document.createElement("canvas");
        canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:9999;width:100%;height:100%";
        document.body.appendChild(canvas);
        const confetti = new ConfettiGenerator({ target: canvas, max: 200, clock: 40 });
        confetti.render();
        setTimeout(() => { confetti.clear(); canvas.remove(); }, 4000);
    }

    emailjs.init("dviMDBON91Iwtuf-s");
    contactForm?.addEventListener("submit", function(e) {
        e.preventDefault();
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Sending...';
        sendBtn.disabled = true;
        formStatus.innerHTML = "";

        emailjs.sendForm('service_gn0aiw7', 'template_ias91a7', this)
            .then(() => {
                formStatus.innerHTML = '<p style="color:#00ff88;font-weight:600;">Message sent successfully! I\'ll reply soon</p>';
                this.reset();
                launchConfetti();
                setTimeout(() => {
                    formStatus.innerHTML = "";
                    sendBtn.innerHTML = originalText;
                    sendBtn.disabled = false;
                }, 4000);
            })
            .catch(() => {
                formStatus.innerHTML = '<p style="color:#ff2d55;font-weight:600;">Failed to send. Try again!</p>';
                sendBtn.innerHTML = originalText;
                sendBtn.disabled = false;
            });
    });

    // ============== VISITOR COUNTER + CV BUTTON (មិនជាន់គ្នា) ==============
    const isMobile = window.innerWidth <= 768;
    const bottomCenterBar = document.createElement("div");
    bottomCenterBar.style.cssText = `
        position:fixed;bottom:${isMobile?"20px":"30px"};left:50%;transform:translateX(-50%);
        display:flex;gap:${isMobile?"15px":"25px"};align-items:center;
        background:rgba(20,20,40,0.7);backdrop-filter:blur(20px);
        padding:${isMobile?"12px 20px":"14px 30px"};border-radius:60px;
        border:2px solid rgba(255,20,147,0.4);box-shadow:0 0 40px rgba(255,20,147,0.6);
        z-index:999;opacity:0;transition:all 0.6s ease;
    `;
    document.body.appendChild(bottomCenterBar);

    // Visitor Counter
    const visitorBox = document.createElement("div");
    visitorBox.innerHTML = `Visitors: <span id="visitorCountNum">0</span>`;
    visitorBox.style.cssText = "color:#ff14ff;font-weight:800;font-size:1rem;";
    bottomCenterBar.appendChild(visitorBox);

    const visitorCountNum = visitorBox.querySelector("#visitorCountNum");
    let visitors = parseInt(localStorage.getItem("visitors") || "0") + 1;
    localStorage.setItem("visitors", visitors);
    visitorCountNum.textContent = visitors.toLocaleString();

    // Download CV Button
    const cvButton = document.createElement("a");
    cvButton.href = "CV-Panha-2025.pdf";
    cvButton.download = "Panha-CV-2025.pdf";
    cvButton.innerHTML = `<i class='bx bxs-download'></i> Download CV`;
    cvButton.style.cssText = `
        background:linear-gradient(135deg,#ff14ff,#8a2be2);color:white;
        padding:12px 24px;border-radius:50px;font-weight:700;
        font-size:0.95rem;text-decoration:none;box-shadow:0 0 30px rgba(255,20,147,0.7);
        transition:all 0.4s ease;display:flex;align-items:center;gap:8px;
    `;
    cvButton.addEventListener("mouseenter", () => cvButton.style.transform = "scale(1.1)");
    cvButton.addEventListener("mouseleave", () => cvButton.style.transform = "scale(1)");
    bottomCenterBar.appendChild(cvButton);

    // Show only when reach footer
    const footer = document.querySelector("footer");
    if (footer) {
        new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    bottomCenterBar.style.opacity = "1";
                    bottomCenterBar.style.transform = "translateX(-50%) translateY(0)";
                } else {
                    bottomCenterBar.style.opacity = "0";
                    bottomCenterBar.style.transform = "translateX(-50%) translateY(50px)";
                }
            });
        }, { threshold: 0.3 }).observe(footer);
    }

    setTimeout(() => {
        if (!footer || footer.getBoundingClientRect().top > window.innerHeight) {
            bottomCenterBar.style.opacity = "1";
            bottomCenterBar.style.transform = "translateX(-50%) translateY(0)";
        }
    }, 1000);
});