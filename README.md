# UnbeatenBascal

Web no oficial del **unbeaten** del clan **JEWBASCAL** dentro de la
[All Rated Extreme Demons List (AREDL)](https://aredl.net/).

Reúne en un solo sitio los niveles de la demonlist, sus posiciones y la
evolución de la lista, con datos que se obtienen en directo de la API v2 de
AREDL.

**Demo:** https://draconplox.github.io/Unbeatenbascal/

## Funcionalidades

- **Home** con la presentación del proyecto y el changelog de la demonlist.
- **Demonlist** con dos modos:
  - **Clásico**: lista principal y niveles *pending*.
  - **Plataforma** (AREPL).
- **Ficha de cada nivel** con posición, puntos, Edel Enjoyment, GDDL Tier,
  NLW Tier, Two Player, canción, tags, descripción y estado de completado.
- **Buscador** por nombre (admite `^prefijo` y `sufijo$`).
- **Filtros**: rangos de posición, Edel Enjoyment y GDDL Tier, selección de
  tiers NLW y agrupación por tier.
- **Ordenación** ascendente/descendente por rank o por Edel Enjoyment.
- **Changelog** de la lista clásica y de plataforma, agrupado por día y
  paginado.
- **Interfaz responsive** con barra lateral colapsable.

## Estado del proyecto

| Sección | Estado |
| --- | --- |
| Home | ✅ |
| Demonlist clásica y de plataforma | ✅ |
| Changelog | ✅ |
| Filtros y búsqueda | ✅ |
| Estadísticas | 🚧 Próximamente |
| Récords por nivel | 🚧 Pendiente (la UI muestra un placeholder) |
| Login con Discord | 🚧 Oculto; el flujo OAuth aún no está conectado |

> El acceso con Discord está integrado a nivel de UI, pero el callback de
> autenticación todavía no está enrutado y el flujo no encaja con la API v2 de
> AREDL. Por eso el botón permanece oculto (`SHOW_NAVBAR_ACCESS` en
> `src/App.tsx`).

## Tecnologías

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/) (vía PostCSS)
- [ESLint](https://eslint.org/)
- Datos de la [API v2 de AREDL](https://api.aredl.net/v2/docs)

La navegación entre Home y Demonlist se hace por estado interno, sin router.

## Puesta en marcha

Requiere Node.js y npm instalados.

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173/`.

### Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR. |
| `npm run build` | Comprueba los tipos con `tsc -b` y genera `dist/`. |
| `npm run preview` | Sirve localmente el build de producción. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run deploy` | Compila y publica `dist/` en la rama `gh-pages`. |

## Despliegue

El sitio se publica con **GitHub Pages** desde la rama `gh-pages`:

```bash
npm run deploy
```

`predeploy` ejecuta el build automáticamente antes de publicar. En producción
Vite usa la base `/Unbeatenbascal/` (configurada en `vite.config.ts`), necesaria
porque el sitio vive en `https://<usuario>.github.io/Unbeatenbascal/`.

## Estructura del proyecto

```text
src/
├── assets/          Recursos estáticos
├── components/      Changelog, rutas protegidas
├── context/         Autenticación (AuthContext)
├── objects/         Tipos de la API (Level, User, Changelog)
├── pages/           Home, Demonlist, Login y callback OAuth
├── App.tsx          Layout y navegación
├── main.tsx         Punto de entrada
└── index.css        Estilos y tema (Tailwind)
public/              Favicon e iconos
```

## API utilizada

- `GET /api/aredl/levels` — niveles de la lista clásica.
- `GET /api/arepl/levels` — niveles de la lista de plataforma.
- `GET /api/aredl/changelog` — cambios de la lista clásica.
- `GET /api/arepl/changelog` — cambios de la lista de plataforma.
- `GET /api/auth/discord` — inicio de sesión con Discord (pendiente de integrar).

## Aviso

Proyecto personal sin relación oficial con AREDL ni con Discord. Los datos y
sus posibles errores pertenecen a la API de AREDL.
