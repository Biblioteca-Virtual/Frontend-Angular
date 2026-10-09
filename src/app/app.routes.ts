import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

/**
 * Rutas de la aplicacion.
 *
 * Todas las features se cargan de forma diferida con `loadComponent`, asi que
 * el bundle inicial solo incluye el shell y lo justo para la redireccion.
 *
 * Las rutas cuelgan de `Shell`, que aporta la barra de navegacion, salvo
 * login y registro, que se muestran sin ella.
 *
 * Sobre la proteccion: en el backend los blueprints `books`, `readings`,
 * `reviews` y `roulette` llevan `@login_required`, asi que todo lo que cuelga de
 * `authGuard` necesita sesion. El backend no tiene roles: no existen rutas de
 * administrador que distinguir.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Iniciar sesión · Biblioteca Virtual',
    loadComponent: () => import('@features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    title: 'Crear cuenta · Biblioteca Virtual',
    loadComponent: () => import('@features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('@layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'libros' },
      {
        path: 'libros',
        title: 'Catálogo · Biblioteca Virtual',
        loadComponent: () => import('@features/books/book-list/book-list').then((m) => m.BookList),
      },
      {
        path: 'libros/nuevo',
        title: 'Añadir libro · Biblioteca Virtual',
        loadComponent: () => import('@features/books/book-form/book-form').then((m) => m.BookForm),
      },
      {
        // El parametro se llama `bookId` y no `id` a proposito: con
        // `withComponentInputBinding()` el router rellena los inputs del
        // componente cuyo nombre coincide con el del parametro, y ademas
        // convierte el valor a `number` porque el input esta declarado como
        // tal. La URL visible no cambia.
        path: 'libros/:bookId',
        title: 'Libro · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/books/book-detail/book-detail').then((m) => m.BookDetail),
      },
      {
        path: 'libros/:bookId/editar',
        title: 'Editar libro · Biblioteca Virtual',
        loadComponent: () => import('@features/books/book-form/book-form').then((m) => m.BookForm),
      },
      {
        path: 'prestamos',
        title: 'Mis préstamos · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/readings/reading-list/reading-list').then((m) => m.ReadingList),
      },
      {
        path: 'resenas',
        title: 'Reseñas · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/reviews/review-list/review-list').then((m) => m.ReviewList),
      },
      {
        path: 'ruleta',
        title: 'Ruleta · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/roulette/roulette-page/roulette-page').then((m) => m.RoulettePage),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada · Biblioteca Virtual',
    loadComponent: () => import('@features/errors/not-found/not-found').then((m) => m.NotFound),
  },
];
