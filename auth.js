import {
  isSupabaseConfigured,
  supabase
} from "./supabase.js";

const messageElement = document.querySelector("#auth-message");

function showMessage(message, type = "") {
  if (!messageElement) {
    return;
  }

  messageElement.textContent = message;
  messageElement.classList.toggle(
    "auth-message--error",
    type === "error"
  );
  messageElement.classList.toggle(
    "auth-message--success",
    type === "success"
  );
}

function setButtonLoading(button, loading, loadingText) {
  if (!button) {
    return;
  }

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.innerHTML;
  }

  button.disabled = loading;
  button.innerHTML = loading
    ? `<span>${loadingText}</span><span>···</span>`
    : button.dataset.originalText;
}

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Add your Supabase project URL and anon key inside supabase.js first."
    );
  }
}

async function redirectLoggedInUser() {
  if (!supabase) {
    return;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    window.location.replace("./app.html");
  }
}

const signupForm = document.querySelector("#signup-form");

if (signupForm) {
  const submitButton = document.querySelector("#signup-submit");

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    const displayName =
      document.querySelector("#signup-name").value.trim();
    const email =
      document.querySelector("#signup-email").value.trim();
    const password =
      document.querySelector("#signup-password").value;
    const confirmPassword =
      document.querySelector("#signup-confirm-password").value;

    if (!displayName) {
      showMessage("Enter a display name.", "error");
      return;
    }

    if (!email) {
      showMessage("Enter your email address.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage(
        "Your password must contain at least 6 characters.",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Your passwords do not match.", "error");
      return;
    }

    setButtonLoading(submitButton, true, "Creating account");

    try {
      requireSupabase();

      const emailRedirectTo = new URL(
        "./login.html?confirmed=1",
        window.location.href
      ).href;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          },
          emailRedirectTo
        }
      });

      if (error) {
        throw error;
      }

      /*
        Supabase may return a session immediately when email confirmation
        is disabled. The requested flow is still signup -> login, so we
        sign out before redirecting.
      */
      if (data.session) {
        await supabase.auth.signOut();
      }

      sessionStorage.setItem(
        "noema-auth-notice",
        data.session
          ? "Account created. Log in to enter your space."
          : "Account created. Confirm your email if required, then log in."
      );

      window.location.replace("./login.html?created=1");
    } catch (error) {
      showMessage(error.message, "error");
      setButtonLoading(submitButton, false);
    }
  });
}

const loginForm = document.querySelector("#login-form");

if (loginForm) {
  const submitButton = document.querySelector("#login-submit");

  const params = new URLSearchParams(window.location.search);
  const storedNotice = sessionStorage.getItem("noema-auth-notice");

  if (storedNotice) {
    showMessage(storedNotice, "success");
    sessionStorage.removeItem("noema-auth-notice");
  } else if (params.get("confirmed") === "1") {
    showMessage(
      "Email confirmed. You can log in now.",
      "success"
    );
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    const email =
      document.querySelector("#login-email").value.trim();
    const password =
      document.querySelector("#login-password").value;

    if (!email || !password) {
      showMessage("Enter your email and password.", "error");
      return;
    }

    setButtonLoading(submitButton, true, "Entering");

    try {
      requireSupabase();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      window.location.replace("./app.html");
    } catch (error) {
      showMessage(error.message, "error");
      setButtonLoading(submitButton, false);
    }
  });
}

redirectLoggedInUser();
