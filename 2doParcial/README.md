InventareameESTA API 🚀

Autor Yohan Michel Perez Monzon 3er año ingenieria Informatica
Parcial de Programacion Web Avanzada

Sistema de gestión de logística, inventario y despachos desarrollado con Node.js, Express, TypeScript y Prisma ORM.
Requisitos Previos

    Node.js (v18 o superior)

Instalación y Ejecución (Paso a Paso)

    Instalar dependencias:

    npm install

    Generar el cliente de Prisma:
    bash
     
      
     
     
    npx prisma generate
     
     

    Crear la base de datos y las tablas (Migraciones):
    bash
     
      
     
     
    npm run migrate
     
     

    Cargar datos iniciales (Seed):
    bash
     
      
     
     
    npm run seed
     
     

    Iniciar el servidor en modo desarrollo:
    bash
     
      
     
     
    npm run dev
     
     

    Acceder al sistema:
    Abre tu navegador y ve a: http://localhost:3000

Credenciales de Prueba

     

    Administrador (Gestión de inventario):
         Email: admin@inventareameesta.com
         Contraseña: admin123
     

    Operador (Gestión de despachos):
         Email: oper@inventareameesta.com
         Contraseña: oper123

