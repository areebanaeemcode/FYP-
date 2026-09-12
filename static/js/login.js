const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const messageBox = document.getElementById("message");

loginForm.addEventListener("submit", loginUser);

async function loginUser(event) {

    event.preventDefault();

    messageBox.innerHTML = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {
        showMessage("Please fill all required fields.", "red");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {

        const response = await fetch("/client/api/login/", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                email: email,
                password: password,
            }),

        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { detail: "Server returned an unexpected response. Please try again." };
        }

        if (response.ok) {

            if (data.tokens) {
                localStorage.setItem("pt_access_token", data.tokens.access);
                localStorage.setItem("pt_refresh_token", data.tokens.refresh);
            }
            if (data.user) {
                localStorage.setItem("pt_user", JSON.stringify(data.user));
            }

            showMessage("Login Successful!", "green");
            loginForm.reset();

            const urlParams = new URLSearchParams(window.location.search);
            const nextUrl = urlParams.get("next");
            const targetUrl = (nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//"))
                ? nextUrl
                : "/client/dashboard/";

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 800);

        } else {
            displayErrors(data);
        }

    } catch (error) {

        console.error(error);
        showMessage("Server Error. Please try again later.", "red");

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Login";

    }

}

function showMessage(message, color) {
    messageBox.innerHTML = `
        <div class="p-3 rounded-lg text-white bg-${color}-500">
            ${message}
        </div>
    `;
}

function displayErrors(errors) {
    let html = "";
    if (errors && typeof errors === "object" && errors.detail) {
        html = `<p class="text-red-600 font-medium">${errors.detail}</p>`;
    } else if (errors && typeof errors === "string") {
        html = `<p class="text-red-600 font-medium">${errors}</p>`;
    } else {
        for (let field in errors) {
            if (Array.isArray(errors[field])) {
                html += `
                    <p class="text-red-600 font-medium">
                        ${errors[field][0]}
                    </p>
                `;
            } else {
                html += `
                    <p class="text-red-600 font-medium">
                        ${errors[field]}
                    </p>
                `;
            }
        }
    }
    messageBox.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const nextUrl = urlParams.get("next");
    if (nextUrl) {
        const regLink = document.querySelector('a[href^="/register"]');
        if (regLink) {
            regLink.href = `/register/?next=${encodeURIComponent(nextUrl)}`;
        }
    }
});
