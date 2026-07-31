import {
  isSupabaseConfigured,
  supabase
} from "./supabase.js";

async function updateLandingForSession() {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return;
  }

  document.querySelectorAll('a[href="./signup.html"]').forEach((link) => {
    link.href = "./app.html";

    if (link.classList.contains("header-signup")) {
      link.textContent = "Open app";
    }
  });

  document.querySelectorAll('a[href="./login.html"]').forEach((link) => {
    link.href = "./app.html";

    if (link.classList.contains("header-login")) {
      link.textContent = "My space";
    }
  });
}

updateLandingForSession();
