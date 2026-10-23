# Module: Auth
Supabase email/password. `/admin/*` is guarded client-side in `app/admin/layout.tsx`; data is protected server-side by RLS (`authenticated` only). Create admin users in Supabase → Authentication → Users; disable public sign-ups.
