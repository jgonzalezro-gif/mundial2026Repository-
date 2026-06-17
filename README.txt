# Mundial 2026 automático con GitHub Pages

Este proyecto está pensado para computador de empresa: no requiere instalar Node.js ni ejecutar terminal en tu equipo.

## Archivos

- `index.html`: página visual del Mundial.
- `data.json`: resultados y logs.
- `update.js`: script que GitHub Actions ejecuta en la nube para consultar APIs gratis.
- `.github/workflows/update-results.yml`: tarea automática cada 30 minutos.

## Pasos rápidos

1. Crea un repositorio público en GitHub llamado `mundial2026`.
2. Sube TODOS los archivos de este ZIP.
3. En GitHub entra a `Settings > Pages`.
4. En `Build and deployment`, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Guarda.
6. Entra a la pestaña `Actions` y ejecuta manualmente el workflow `Actualizar resultados Mundial 2026` con `Run workflow`.
7. Abre la URL de GitHub Pages, parecida a:
   `https://TU_USUARIO.github.io/mundial2026/`

## Importante

La página NO consulta APIs externas desde el navegador. La actualización la hace GitHub Actions en la nube y modifica `data.json`.
