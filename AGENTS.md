# Convención de commits

Todo commit de este usuario DEBE seguir este formato exacto:

```
[ETIQUETA] contexto
```

## Etiquetas

| Cambio en los archivos                  | Etiqueta               |
|-----------------------------------------|------------------------|
| Solo archivos nuevos                    | `[CREATE]`             |
| Solo archivos modificados               | `[UPDATE]`             |
| Solo archivos eliminados                | `[DELETE]`             |
| Nuevos + modificados                    | `[CREATE-UPDATE]`      |
| Nuevos + eliminados                     | `[CREATE-DELETE]`      |
| Modificados + eliminados                | `[UPDATE-DELETE]`      |
| Nuevos + modificados + eliminados       | `[CREATE-UPDATE-DELETE]` |

Reglas de la etiqueta:
- El orden es siempre **CREATE → UPDATE → DELETE**, unidos con guion `-`.
- Siempre en MAYÚSCULAS y entre corchetes.
- Un archivo renombrado o movido cuenta como `UPDATE`.

## Cómo decidir la etiqueta (no adivinar)

1. Si no hay nada en staging, ejecuta `git add -A`.
2. Ejecuta `git diff --cached --name-status` y clasifica cada línea:
   - `A` → CREATE
   - `M`, `R`, `C`, `T` → UPDATE
   - `D` → DELETE
3. Junta las categorías presentes en el orden CREATE-UPDATE-DELETE.

## Cómo escribir el contexto

1. Lee el diff real (`git diff --cached`) para entender QUÉ cambió y PARA QUÉ.
2. Escribe el contexto en español, breve y concreto (idealmente ≤ 72 caracteres en total).
3. Describe el cambio funcional, no la lista de archivos.
   - ✅ `[CREATE-UPDATE] formulario de login y validación de email en registro`
   - ❌ `[CREATE-UPDATE] cambios varios` / `[UPDATE] update files`
4. Sin punto final. Sin emojis. Sin prefijos adicionales (nada de `feat:`, `fix:`).
5. No agregues trailers como `Co-Authored-By` ni firmas de IA.

## Flujo completo

```bash
git add -A                                   # si no había nada en staging
git diff --cached --name-status              # decidir etiqueta
git diff --cached                            # entender el contexto
git commit -m "[ETIQUETA] contexto"
git push                                     # a la rama actual
```

- Si la rama no tiene upstream: `git push -u origin <rama-actual>`.
- Si el push falla por cambios remotos, haz `git pull --rebase` y vuelve a intentar; si hay conflictos, detente y avisa al usuario.
- Nunca uses `--force` sin que el usuario lo pida.

## Ejemplos

```
[CREATE] componente Navbar con menú responsive
[UPDATE] corrige cálculo de total con descuentos en carrito
[DELETE] elimina endpoints obsoletos de la API v1
[CREATE-UPDATE] servicio de pagos y conexión desde checkout
[UPDATE-DELETE] migra estilos a Tailwind y quita CSS antiguo
[CREATE-UPDATE-DELETE] reestructura módulo de usuarios
```
