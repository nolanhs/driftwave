NOEMA VANILLA APP

FILES
- index.html       Public landing page
- signup.html      Account creation
- login.html       Member login
- app.html         Protected audio dashboard
- auth.css         Landing/auth styling
- auth.js          Signup/login logic
- landing.js       Detects logged-in users on landing page
- styles.css       Dashboard styling
- app.js           Dashboard functionality and auth guard
- supabase.js      Supabase client, database, and storage helpers

SETUP
1. Create a Supabase project.
2. Open supabase.js.
3. Replace:
   YOUR_SUPABASE_PROJECT_URL
   YOUR_SUPABASE_ANON_KEY
4. In Supabase Authentication settings, enable Email provider.
5. Add your local and deployed URLs to Authentication > URL Configuration.
6. Run the sessions-table SQL included inside supabase.js.
7. Serve this folder through Live Server or:
   python -m http.server 5500

FLOW
index.html -> signup.html -> login.html -> app.html

The app.html page checks for a valid Supabase user and redirects unauthenticated
visitors back to login.html.
