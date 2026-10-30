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
    path: '',
    loadComponent: () => import('@layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Virtual Library · Inicio',
        loadComponent: () => import('@features/home/home').then((m) => m.Home),
      },
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
        path: 'libros',
        canActivate: [authGuard],
        title: 'Catálogo · Biblioteca Virtual',
        loadComponent: () => import('@features/books/book-list/book-list').then((m) => m.BookList),
      },
      {
        path: 'libros/nuevo',
        canActivate: [authGuard],
        title: 'Añadir libro · Biblioteca Virtual',
        loadComponent: () => import('@features/books/book-form/book-form').then((m) => m.BookForm),
      },
      {
        path: 'libros/:bookId',
        canActivate: [authGuard],
        title: 'Libro · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/books/book-detail/book-detail').then((m) => m.BookDetail),
      },
      {
        path: 'libros/:bookId/editar',
        canActivate: [authGuard],
        title: 'Editar libro · Biblioteca Virtual',
        loadComponent: () => import('@features/books/book-form/book-form').then((m) => m.BookForm),
      },
      {
        path: 'colecciones',
        canActivate: [authGuard],
        title: 'Colecciones · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/collections/collection-list/collection-list').then(
            (m) => m.CollectionList,
          ),
      },
      {
        path: 'colecciones/:collectionId',
        canActivate: [authGuard],
        title: 'Colección · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/collections/collection-detail/collection-detail').then(
            (m) => m.CollectionDetail,
          ),
      },
      {
        path: 'resenas',
        canActivate: [authGuard],
        title: 'Reseñas · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/reviews/review-list/review-list').then((m) => m.ReviewList),
      },
      {
        path: 'arbol',
        canActivate: [authGuard],
        title: 'Árbol de lectura · Biblioteca Virtual',
        loadComponent: () =>
          import('@features/reading-tree/reading-tree-page').then((m) => m.ReadingTreePage),
      },
      // La ruleta se reemplazó por el árbol de lectura.
      { path: 'ruleta', redirectTo: 'arbol' },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada · Biblioteca Virtual',
    loadComponent: () => import('@features/errors/not-found/not-found').then((m) => m.NotFound),
  },
];
