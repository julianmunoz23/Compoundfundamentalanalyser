# Compounder Analyst 📈
Sistema de análisis fundamental inspirado en Buffett & Munger.

## 🚀 Deploy en Vercel (paso a paso)

### 1. Instala Node.js
Descarga desde: https://nodejs.org (versión LTS)

### 2. Crea tu API Key de Anthropic
- Ve a: https://console.anthropic.com
- Crea una cuenta y genera una API key
- Cópiala, la necesitarás en el paso 5

### 3. Sube el proyecto a GitHub
- Crea cuenta en https://github.com
- Crea un nuevo repositorio (New repository)
- Arrastra esta carpeta completa al repositorio

### 4. Deploy en Vercel
- Ve a https://vercel.com y crea cuenta con GitHub
- Click "New Project" → importa tu repositorio
- Framework: Vite (se detecta automático)

### 5. Agrega tu API Key en Vercel
En la pantalla de configuración de Vercel, antes de hacer deploy:
- Click "Environment Variables"
- Name: `VITE_ANTHROPIC_KEY`
- Value: `sk-ant-...` (tu API key)
- Click "Add" → luego "Deploy"

### ✅ Listo — tendrás una URL pública tipo:
`https://compounder-analyst.vercel.app`

---

## 💻 Desarrollo local

```bash
# 1. Instala dependencias
npm install

# 2. Crea el archivo .env con tu API key
cp .env.example .env
# Edita .env y pon tu API key real

# 3. Corre el servidor local
npm run dev

# Abre http://localhost:5173
```

## ⚠️ Nota de seguridad
Para producción real, considera crear un backend (Next.js API route, Express, etc.)
que haga las llamadas a la API de Anthropic, para no exponer tu key en el frontend.
