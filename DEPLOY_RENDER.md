# Deploy Cafaline on Render

This repo is ready for a Render Blueprint deploy with:

- `cafaline-api`: Django API web service
- `cafaline-web`: React/Vite static site
- `cafaline-db`: Postgres database

## Deploy Steps

1. Push this project to GitHub.
2. In Render, choose **Blueprint** and select this repo.
3. Render will read `render.yaml`.
4. Set `VITE_ORDER_EMAIL_TO` when Render asks for synced env vars.
5. Deploy.

## Important

The frontend env var `VITE_API_URL` is currently set to:

```text
https://cafaline-api.onrender.com/api/
```

If Render gives your backend a different URL, update `VITE_API_URL` in the
`cafaline-web` static site settings and redeploy the frontend.

## Backend Environment

The backend uses these production variables:

```text
SECRET_KEY
DEBUG=false
ALLOWED_HOSTS
CORS_ALLOW_ALL_ORIGINS
DATABASE_URL
```

`DATABASE_URL` is connected automatically from the Render Postgres database in
`render.yaml`.

## Commands Render Runs

Backend build:

```text
pip install -r requirements.txt && python manage.py collectstatic --noinput
```

Backend pre-deploy:

```text
python manage.py migrate
```

Backend start:

```text
gunicorn backend.wsgi:application
```

Frontend build:

```text
npm install && npm run build
```
