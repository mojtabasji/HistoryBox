# Auth0 Universal Login — Custom Templates

This folder contains Liquid-based templates you can paste into Auth0's Universal Login (Classic experience with Page Templates). They render a polished dark-card UI and embed the Auth0 widget via reserved tags.

## Files
- `base.html.liquid` — Shared layout with styles and required Auth0 tags. Other pages extend this via `{% layout "base" %}`.
- `login.html.liquid` — Login page heading copy.
- `signup.html.liquid` — Signup page heading copy.
- `reset-password.html.liquid` — Reset password page heading copy.
- `mfa.html.liquid` — MFA prompt heading copy.
- `error.html.liquid` — Generic error page heading copy.

## How to use
1. Go to Auth0 Dashboard → Branding → Universal Login → Page Templates.
2. Enable "Customize". Choose each template (Login, Signup, Reset Password, MFA, Error) and paste the corresponding file contents.
3. Ensure these reserved tags are present:
   - `{{ auth0:head }}` and `{{ auth0:assets }}` in the `<head>`
   - `{{ auth0:widget }}` where the login form should render
   - `{{ auth0:foot }}` before `</body>`
4. Save and preview each page.

## Variables you can use
- `application.name` — The current app's name.
- `tenant.branding.logo_url` — Logo from Branding settings.
- `tenant.friendly_name` — Tenant display name.
- `page.name`, `prompt.name` — Current page/prompt.
- `error` / `error.description` — Error context when present.
- `locale` — Current locale code.

## Notes
- These templates are designed for the Classic Page Templates (Liquid). If you're using New Universal Login with the theme editor, adapt the styles and slots accordingly.
- The CSS is minimal and responsive, uses Inter font, and supports dark backgrounds.
- You can tweak colors (accent, background) at the top of the `<style>` block.
