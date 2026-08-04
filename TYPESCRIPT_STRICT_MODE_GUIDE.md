# TypeScript Strict Mode - Migration Guide

**Status:** ✅ Enabled (Parcialmente - Errores pendientes de fix)  
**Fecha:** 2026-08-04  
**Archivo:** `apps/api/tsconfig.json`

---

## ✅ CAMBIOS REALIZADOS

### tsconfig.json Updated

```json
{
  "compilerOptions": {
    // Strict Mode Enabled
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional Type Checking
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 🔧 ERRORES COMUNES Y SOLUCIONES

### Error #1: Property has no initializer (TS2564)

**Problema:**
```typescript
export class Usuario {
  @Column()
  id: string;  // ❌ Error: Property 'id' has no initializer
}
```

**Solución:**
```typescript
export class Usuario {
  @Column()
  id!: string;  // ✅ Usar ! para non-null assertion en entities
}
```

**Para DTOs:**
```typescript
export class LoginDto {
  @IsEmail()
  email!: string;  // ✅ DTO properties

  @IsString()
  password!: string;
}
```

---

### Error #2: Unused imports (TS6133)

**Problema:**
```typescript
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
// Error: 'ManyToOne' is declared but never used
```

**Solución:**
```typescript
import { Column, Entity } from 'typeorm';
// ✅ Eliminar imports no utilizados
```

---

### Error #3: Parameter implicitly has 'any' type (TS7006)

**Problema:**
```typescript
@Get('me')
async getProfile(@Request() req) {  // ❌ Error: 'req' has implicit 'any'
  const usuario = req.user;
}
```

**Solución:**
```typescript
import { Request } from '@nestjs/common';

@Get('me')
async getProfile(@Request() req: Request & { user: Usuario }) {
  const usuario = req.user;  // ✅ Properly typed
}
```

**Mejor Solución (Custom Decorator):**
```typescript
// auth/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../catalogos/entities/usuario.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Uso:
@Get('me')
async getProfile(@CurrentUser() usuario: Usuario) {
  return usuario;  // ✅ Type-safe
}
```

---

### Error #4: Implicit 'any' return type

**Problema:**
```typescript
async listAll() {  // ❌ Implicit return type
  return this.grupoRepository.find();
}
```

**Solución:**
```typescript
async listAll(): Promise<GrupoEntity[]> {  // ✅ Explicit return type
  return this.grupoRepository.find();
}
```

---

### Error #5: Nullable values not handled

**Problema:**
```typescript
const usuario = await this.usuariosRepo.findOne({ where: { id } });
console.log(usuario.nombre);  // ❌ Error: Object is possibly 'null'
```

**Solución:**
```typescript
const usuario = await this.usuariosRepo.findOne({ where: { id } });
if (!usuario) {
  throw new NotFoundException('Usuario no encontrado');
}
console.log(usuario.nombre);  // ✅ Type narrowing
```

---

## 📋 PLAN DE MIGRACIÓN

### Fase 1: Fix Entity Initializers (15 min)

Agregar `!` a todas las propiedades de entities:

```typescript
// Find: @Column\(\)\s+(\w+): (\w+);
// Replace: @Column()\n  $1!: $2;

export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({ unique: true })
  email!: string;
}
```

**Archivos a modificar:**
- `src/catalogos/entities/usuario.entity.ts`
- `src/grupos/grupo.entity.ts`
- `src/expedientes/expediente.entity.ts`
- `src/integrantes/integrante.entity.ts`
- `src/solicitudes/solicitud.entity.ts`
- `src/personas/persona.entity.ts`
- `src/codigos-postales/codigo-postal.entity.ts`

---

### Fase 2: Remove Unused Imports (10 min)

Ejecutar ESLint auto-fix:

```bash
cd apps/api
npx eslint --fix "src/**/*.ts"
```

O manualmente eliminar imports marcados como `never read`.

---

### Fase 3: Fix Implicit 'any' Parameters (30 min)

Buscar todos los parámetros sin tipo:

```bash
grep -r "(\w\+)" src/ | grep -v "\.d\.ts" | grep "=>"
```

Agregar tipos explícitos:

```typescript
// ❌ Antes
.map(async (grupo) => {
  ...
})

// ✅ Después
.map(async (grupo: GrupoEntity) => {
  ...
})
```

---

### Fase 4: Add Return Types (30 min)

Agregar tipos de retorno a todos los métodos públicos:

```typescript
export class GruposService {
  async create(dto: CreateGrupoDto): Promise<GrupoEntity> {
    // ...
  }

  async listAll(paginationDto: PaginationDto): Promise<PaginatedResponse<GrupoEntity>> {
    // ...
  }

  async getById(id: string): Promise<GrupoEntity | null> {
    // ...
  }
}
```

---

### Fase 5: Handle Nulls (45 min)

Agregar null checks en todos los lugares donde se accede a valores nullable:

```typescript
// ❌ Antes
const usuario = await this.usuariosRepo.findOne({ where: { id } });
return usuario.nombre;

// ✅ Después
const usuario = await this.usuariosRepo.findOne({ where: { id } });
if (!usuario) {
  throw new NotFoundException('Usuario no encontrado');
}
return usuario.nombre;
```

---

## 🚀 QUICK FIX SCRIPT

Crear un script para automatizar las fixes más comunes:

```bash
#!/bin/bash
# fix-strict-mode.sh

echo "Fixing TypeScript Strict Mode errors..."

# Fix 1: Add ! to entity properties
find apps/api/src -name "*.entity.ts" -exec sed -i 's/@Column()\s\+\(\w\+\): \(\w\+\);/@Column()\n  \1!: \2;/g' {} \;

# Fix 2: Add ! to DTO properties
find apps/api/src -name "*.dto.ts" -exec sed -i 's/@Is\w\+(.*)\s\+\(\w\+\): \(\w\+\);/@Is\1\n  \1!: \2;/g' {} \;

# Fix 3: Run ESLint autofix
cd apps/api && npx eslint --fix "src/**/*.ts"

echo "Done! Run 'npm run build' to check remaining errors."
```

---

## 📊 ERROR COUNT

```bash
# Check total errors
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Current: ~150 errors

# Breakdown:
# - TS2564 (no initializer): ~100 errors
# - TS6133 (unused imports): ~30 errors
# - TS7006 (implicit any): ~15 errors
# - Others: ~5 errors
```

---

## ⚠️ NOTAS IMPORTANTES

### 1. No Deshabilitar Strict Mode

Nunca hacer esto:
```json
{
  "compilerOptions": {
    "strict": false  // ❌ NO
  }
}
```

### 2. No Usar 'any' como Escape

Evitar:
```typescript
// ❌ BAD
const data: any = await fetch(...);
const user: any = req.user;

// ✅ GOOD
const data: ApiResponse = await fetch(...);
const user: Usuario = req.user as Usuario;
```

### 3. Usar Type Guards

```typescript
function isUsuario(obj: any): obj is Usuario {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

if (isUsuario(data)) {
  console.log(data.email);  // ✅ Type-safe
}
```

---

## 🎯 BENEFITS

Una vez completado:

- ✅ **Catch bugs at compile time** instead of runtime
- ✅ **Better IDE autocomplete** and IntelliSense
- ✅ **Safer refactoring** with confidence
- ✅ **Self-documenting code** through types
- ✅ **Reduced runtime errors** in production

---

## 📚 RECURSOS

- [TypeScript Strict Mode Docs](https://www.typescriptlang.org/tsconfig#strict)
- [NestJS TypeScript Best Practices](https://docs.nestjs.com/techniques/typescript)
- [TypeORM Entity Types](https://typeorm.io/entities)

---

**Status:** ⏳ **In Progress**  
**Next Step:** Execute Phase 1 (Fix Entity Initializers)

_Generado: 2026-08-04_
