# 🍔 POS Restaurant App

Sistema POS completo estilo Shake Shack, con panel de administración, carrito de compras animado e integración Square.

## 🚀 Cómo iniciar

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma
npx prisma generate

# 3. Crear base de datos y datos iniciales
npx tsx prisma/seed.ts

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre **http://localhost:3000**

## 🔐 Acceso Admin

- URL: http://localhost:3000/admin
- Email: `admin@posapp.com`
- Contraseña: `admin123`

## 💳 Integración con Square

1. Ve a https://developer.squareup.com
2. Crea una aplicación
3. Copia tu **Access Token** y **Location ID**
4. En el admin → Configuración → ingresa tus credenciales Square
5. Cambia el ambiente de "Sandbox" a "Producción" cuando estés listo

## 📱 Compatible con

- 📱 Android (Chrome, Samsung Browser)
- 🍎 iPhone/iPad (Safari, Chrome)
- 💻 Windows (Chrome, Firefox, Edge)
- 📟 Tabletas

## ✨ Características

- **Kiosko**: Pantalla de ordenar estilo Shake Shack con animaciones
- **Menú**: Categorías, productos con imágenes y personalización
- **Carrito**: Agregar/quitar items, ver subtotal con impuestos
- **Checkout**: Selección de método de pago (tarjeta, efectivo, móvil)
- **Admin Dashboard**: Estadísticas, ventas, pedidos recientes
- **Gestión de Menú**: Crear/editar/eliminar items, activar/desactivar
- **Gestión de Categorías**: Con emojis e íconos
- **Pedidos**: Ver y actualizar estados (pendiente → preparando → listo → completado)
- **Configuración**: Square API, tasa de impuesto, nombre del restaurante

## 🛠️ Tecnologías

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Framer Motion** (animaciones)
- **Prisma 7** + SQLite (base de datos)
- **Zustand** (estado del carrito)
- **Square SDK** (pagos)
- **Lucide Icons**
