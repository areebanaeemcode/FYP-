(function () {
    "use strict";

    if (typeof PTApi === "undefined") {
        console.error("profile.js requires api.js (window.PTApi)");
        return;
    }
    const { requireAuthRedirect, apiFetch, getUser, setUser, showMessageBox, displayErrorsBox } = PTApi;
    if (!requireAuthRedirect()) return;

    const firstEl = document.getElementById("id_first_name");
    const lastEl = document.getElementById("id_last_name");
    const emailEl = document.getElementById("id_email");
    const phoneEl = document.getElementById("id_phone_number");
    const formEl = document.getElementById("profileForm");
    const msgEl = document.getElementById("profileMessage");
    const saveBtn = document.getElementById("saveProfileBtn");
    const imgWrap = document.getElementById("profileImageWrap");
    const imgEl = document.getElementById("profileImage");
    const initialEl = document.getElementById("profileInitial");
    const fileInput = document.getElementById("id_profile_image_upload");

    function renderProfileImage(user) {
        const url = user && user.profile_image;
        if (url) {
            imgEl.src = url;
            imgEl.classList.remove("hidden");
            if (initialEl) initialEl.classList.add("hidden");
        }
    }

    function fillFromUser(user) {
        if (!user) return;
        if (firstEl) firstEl.value = user.first_name || "";
        if (lastEl) lastEl.value = user.last_name || "";
        if (emailEl) emailEl.value = user.email || "";
        if (phoneEl) phoneEl.value = user.phone_number || "";
        renderProfileImage(user);
    }

    async function loadProfile() {
        const local = getUser();
        if (local) fillFromUser(local);
        const res = await apiFetch("/client/api/profile/", { method: "GET" });
        if (res.ok && res.data) {
            setUser(res.data);
            fillFromUser(res.data);
        } else if (res.status === 401) {
            window.location.href = "/login/";
        }
    }

    loadProfile();

    if (formEl) {
        formEl.addEventListener("submit", async function (ev) {
            ev.preventDefault();
            msgEl.innerHTML = "";
            saveBtn.disabled = true;
            const oldBtnText = saveBtn.textContent;
            saveBtn.textContent = "Saving...";
            try {
                const fd = new FormData();
                if (firstEl && firstEl.value) fd.append("first_name", firstEl.value);
                if (lastEl && lastEl.value) fd.append("last_name", lastEl.value);
                if (phoneEl && phoneEl.value) fd.append("phone_number", phoneEl.value);
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    fd.append("profile_image", fileInput.files[0]);
                }
                const res = await apiFetch("/client/api/profile/update/", {
                    method: "PATCH",
                    body: fd,
                });
                if (res.ok) {
                    setUser(res.data);
                    fillFromUser(res.data);
                    showMessageBox(msgEl, "Profile updated successfully.", "green");
                } else {
                    displayErrorsBox(msgEl, res.data || { detail: "Unable to save profile." });
                }
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = oldBtnText;
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener("change", function () {
            const f = fileInput.files && fileInput.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                imgEl.src = e.target.result;
                imgEl.classList.remove("hidden");
                if (initialEl) initialEl.classList.add("hidden");
            };
            reader.readAsDataURL(f);
        });
    }
})();
