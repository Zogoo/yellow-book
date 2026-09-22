import { Routes } from '@angular/router';

import { accessGuard } from './core/guards/access.guard';

/** Paths mirror the original Nuxt site one-to-one (including `/catagory`). */
export const routes: Routes = [
  {
    path: '',
    canActivateChild: [accessGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./layouts/default-layout').then((m) => m.DefaultLayout),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./features/public/home').then((m) => m.HomePage),
          },
          {
            path: 'about',
            loadComponent: () => import('./features/public/about').then((m) => m.AboutPage),
          },
          {
            path: 'contact',
            loadComponent: () => import('./features/public/contact').then((m) => m.ContactPage),
          },
          {
            path: 'business/signup',
            loadComponent: () => import('./features/auth/register').then((m) => m.RegisterPage),
          },
          { path: 'auth/register', redirectTo: 'business/signup' },
          {
            path: 'auth/forgot-password',
            loadComponent: () =>
              import('./features/auth/forgot-password').then((m) => m.ForgotPasswordPage),
          },
          {
            path: 'auth/reset-password',
            loadComponent: () =>
              import('./features/auth/reset-password').then((m) => m.ResetPasswordPage),
          },
          {
            path: 'auth/oauth/callback',
            loadComponent: () =>
              import('./features/auth/oauth-callback').then((m) => m.OauthCallbackPage),
          },
        ],
      },
      {
        path: '',
        loadComponent: () => import('./layouts/info-page-layout').then((m) => m.InfoPageLayout),
        children: [
          {
            path: 'faq',
            loadComponent: () => import('./features/public/faq').then((m) => m.FaqPage),
          },
          {
            path: 'popular-list',
            loadComponent: () =>
              import('./features/public/popular-list').then((m) => m.PopularListPage),
          },
          {
            path: 'catagory',
            loadComponent: () => import('./features/public/catagory').then((m) => m.CatagoryPage),
          },
        ],
      },
      {
        path: 'agency',
        loadComponent: () => import('./features/public/agency').then((m) => m.AgencyPage),
      },
      {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
      },
      {
        path: 'auth/signup',
        data: { mode: 'signup' },
        loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
      },
      // One credential, one door: the old role-specific pages lead there now.
      { path: 'auth/company/login', redirectTo: 'auth/login' },
      { path: 'auth/staff/login', redirectTo: 'auth/login' },
      // The category page has always been reachable at a misspelled path; keep it working.
      { path: 'category', redirectTo: 'catagory' },
      {
        path: 'user',
        loadComponent: () => import('./layouts/user-panel-layout').then((m) => m.UserPanelLayout),
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/user/dashboard').then((m) => m.UserDashboardPage),
          },
          {
            path: 'my-reviews',
            loadComponent: () => import('./features/user/my-reviews').then((m) => m.MyReviewsPage),
          },
          {
            path: 'favourite-companies',
            loadComponent: () =>
              import('./features/user/favourite-companies').then((m) => m.FavouriteCompaniesPage),
          },
          {
            path: 'my-profile',
            loadComponent: () =>
              import('./features/user/my-profile').then((m) => m.UserProfilePage),
          },
          {
            path: '**',
            loadComponent: () =>
              import('./features/public/panel-not-found').then((m) => m.PanelNotFoundPage),
            data: { panel: 'user profile' },
          },
        ],
      },
      {
        path: 'company',
        loadComponent: () =>
          import('./layouts/company-panel-layout').then((m) => m.CompanyPanelLayout),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/company/dashboard').then((m) => m.CompanyDashboardPage),
          },
          {
            path: 'my-company',
            loadComponent: () =>
              import('./features/company/my-company').then((m) => m.MyCompanyPage),
          },
          {
            path: 'review',
            loadComponent: () =>
              import('./features/company/review-list').then((m) => m.CompanyReviewListPage),
          },
          {
            path: 'review/:id',
            loadComponent: () =>
              import('./features/company/review-detail').then((m) => m.CompanyReviewDetailPage),
          },
          {
            path: 'my-profile',
            loadComponent: () =>
              import('./features/company/my-profile').then((m) => m.CompanyProfilePage),
          },
          {
            path: 'notification',
            loadComponent: () =>
              import('./features/company/notification').then((m) => m.CompanyNotificationPage),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/company/settings').then((m) => m.CompanySettingsPage),
          },
          {
            path: '**',
            loadComponent: () =>
              import('./features/public/panel-not-found').then((m) => m.PanelNotFoundPage),
            data: { panel: 'company' },
          },
        ],
      },
      {
        path: 'admin',
        loadComponent: () => import('./layouts/admin-panel-layout').then((m) => m.AdminPanelLayout),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/admin/dashboard').then((m) => m.AdminDashboardPage),
          },
          {
            path: 'manage-companies',
            loadComponent: () =>
              import('./features/admin/manage-companies').then((m) => m.ManageCompaniesPage),
          },
          {
            path: 'manage-users',
            loadComponent: () =>
              import('./features/admin/manage-users').then((m) => m.ManageUsersPage),
          },
          {
            path: 'manage-review',
            loadComponent: () =>
              import('./features/admin/manage-review').then((m) => m.ManageReviewPage),
          },
          {
            path: 'admin-management',
            loadComponent: () =>
              import('./features/admin/admin-management').then((m) => m.AdminManagementPage),
          },
          {
            path: 'create-sub-admin',
            loadComponent: () =>
              import('./features/admin/create-sub-admin').then((m) => m.CreateSubAdminPage),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/admin/settings').then((m) => m.AdminSettingsPage),
          },
          {
            path: '**',
            loadComponent: () =>
              import('./features/public/panel-not-found').then((m) => m.PanelNotFoundPage),
            data: { panel: 'admin' },
          },
        ],
      },
      {
        path: 'agent',
        loadComponent: () => import('./layouts/agent-panel-layout').then((m) => m.AgentPanelLayout),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/agent/dashboard').then((m) => m.AgentDashboardPage),
          },
          {
            path: 'assign-companies',
            loadComponent: () =>
              import('./features/agent/assign-companies').then((m) => m.AssignCompaniesPage),
          },
          {
            path: 'review-approval',
            loadComponent: () =>
              import('./features/agent/review-approval').then((m) => m.ReviewApprovalPage),
          },
          {
            path: 'my-profile',
            loadComponent: () =>
              import('./features/agent/my-profile').then((m) => m.AgentProfilePage),
          },
          {
            path: '**',
            loadComponent: () =>
              import('./features/public/panel-not-found').then((m) => m.PanelNotFoundPage),
            data: { panel: 'agent' },
          },
        ],
      },
      {
        path: '**',
        loadComponent: () => import('./features/public/not-found').then((m) => m.NotFoundPage),
      },
    ],
  },
];
