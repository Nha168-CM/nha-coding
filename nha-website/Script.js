

const firebaseConfig = {
  apiKey: "AIzaSyB0TrgpsjzRdBG8ixF3hsnVNwHbsB3sY4I",
  authDomain: "create-website-with-ai.firebaseapp.com",
  projectId: "create-website-with-ai",
  storageBucket: "create-website-with-ai.firebasestorage.app",
  messagingSenderId: "914443478314",
  appId: "1:914443478314:web:ffebb72e8dc8e94919aa53",
  measurementId: "G-X405GLSH0H"
};



// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== Toggle Form ====================
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const container = document.getElementById('container');

registerBtn.addEventListener('click', () => container.classList.add("active"));
loginBtn.addEventListener('click', () => container.classList.remove("active"));

// ==================== Toast Function ====================
function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.className = "toast", 3000);
}

// ==================== Sign Up ====================
document.querySelector('.sign-up form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = e.target[0].value.trim();
    const email = e.target[1].value.trim();
    const password = e.target[2].value;

    // Loading
    e.target.querySelector('button').textContent = "Creating...";

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return db.collection("users").doc(user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            showToast(`Welcome ${name}! Account created 🎉`, "success");
            e.target.reset();
            e.target.querySelector('button').textContent = "Sign Up";
            container.classList.remove("active");
        })
        .catch((error) => {
            showToast(error.message, "error");
            e.target.querySelector('button').textContent = "Sign Up";
        });
});

// ==================== Sign In ====================
document.querySelector('.sign-in form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target[0].value.trim();
    const password = e.target[1].value;

    e.target.querySelector('button').textContent = "Signing In...";

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return db.collection("users").doc(userCredential.user.uid).get();
        })
        .then((doc) => {
            const name = doc.data().name || "User";
            showToast(`Welcome back, ${name}! ❤️`, "success");
            e.target.querySelector('button').textContent = "Sign In";
            // អាច redirect ទៅ dashboard បាន
            // setTimeout(() => location.href = "dashboard.html", 1500);
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        })
        .catch((error) => {
            showToast(error.message, "error");
            e.target.querySelector('button').textContent = "Sign In";
        });
});

// ==================== Real-time Auth State ====================
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User logged in:", user.email);
    } else {
        console.log("No user logged in");
    }
});
