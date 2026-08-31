# AdaptaFit 🏋️

Plataforma de generación de rutinas de entrenamiento personalizadas con IA.
React (Vite) + Django REST Framework + PostgreSQL.

## Estructura

```
frontend/   → App React (Vite, MUI, Tailwind)
backend/    → API Django (DRF, TokenAuth, Motor adaptativo + Gemini IA)
```

## 🔧 Desarrollo local

### Backend (Django)
```bash
cd backend
pip install -r requirements.txt
# (opcional) configura backend/.env copiando backend/.env.example
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Copiar `frontend/.env.example` → `frontend/.env.local` y ajustar `VITE_API_URL`
(por defecto `http://localhost:8000`).

---

## 🌐 Despliegue

### 1) Frontend → Netlify (gratis)

1. Sube el repositorio a **GitHub**.
2. En [netlify.com](https://netlify.com) → **Add new site → Import existing project**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio.
4. Netlify leerá automáticamente el `netlify.toml` configurado:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
5. En **Site → Environment variables** define:
   - `VITE_API_URL` → la URL de tu backend (ej. `https://adaptafit.onrender.com`)
6. Deploy. Obtendrás una URL como `https://adaptafit.netlify.app`.

El `netlify.toml` ya incluye el **SPA fallback** (`/* → /index.html`) para que el
routing de React Router funcione con deep links.

### 2) Backend Django → Render (gratis)

> Netlify es solo para archivos estáticos; **no ejecuta Django**.
> Para el backend usa **Render**, **Railway** o **PythonAnywhere**.

En Render (render.com) con plan free (Web Service, **Python**):
1. **Build command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
2. **Start command:** `gunicorn adaptafit_backend.wsgi:application`
3. **Root directory:** `backend`
4. **Environment variables** (las define `settings.py`):
   - `DJANGO_SECRET_KEY` → clave segura y única (**obligatorio en producción**)
   - `DJANGO_DEBUG` → `False`
   - `DJANGO_ALLOWED_HOSTS` → tu dominio de Render + el de Netlify (coma-separado)
   - `DJANGO_CORS_ORIGINS` → `https://adaptafit.netlify.app`
   - `DATABASE_URL` → tu PostgreSQL en la nube (Render, Neon o Supabase)
   - `GEMINI_API_KEY` → (opcional) clave Gemini de https://aistudio.google.com/
   - `EMAIL_*` → configuración SMTP opcional

### 3) Base de datos

Configura PostgreSQL en la nube (Render, Neon o Supabase - gratis) y pasa la URL
en la variable `DATABASE_URL` del backend.

---

## 🧠 Generación de rutinas con IA

- **Motor adaptativo determinista** (por defecto): genera la rutina según perfil
  (objetivo, experiencia, frecuencia, tipo de entrenamiento) y se auto-adapta al
  progreso real del usuario (racha, completitud, estancamiento).
- **Capa Gemini (opcional)**: si defines `GEMINI_API_KEY`, enriquece cada ejercicio
  con notas técnicas personalizadas (según lesiones/objetivo) y una mejor búsqueda
  de video. Si no hay clave o la API falla, **la app sigue funcionando** con el motor
  determinista (fallback automático).

## 🎬 Videos de ejercicios

Cada ejercicio incluye un botón de demostración que:
1. Usa el `video_url` guardado (video exacto) si existe.
2. Si no, usa una base de datos curada de videos de YouTube en `MiRutina.jsx`.
3. Como último recurso, enlaza a una búsqueda en YouTube del ejercicio.

## 👨‍🏫 Entrenadores

Los entrenadores pueden:
- Ver las rutinas y progreso de sus usuarios asignados.
- Modificar ejercicios (sets, reps, descanso, notas y video).
- Iniciar videollamadas (Jitsi) con sus clientes.
