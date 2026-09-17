import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  Bell,
  Building,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Hourglass,
  Laptop,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  PawPrint,
  Pencil,
  Plane,
  Search,
  Sparkles,
  Star,
  Stethoscope,
  Trash2,
  User,
  Users,
  Utensils,
  XCircle,
} from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
      fallbackLang: environment.defaultLocale,
      lang: environment.defaultLocale,
    }),
    importProvidersFrom(
      LucideAngularModule.pick({
        Bell,
        Building,
        Building2,
        CheckCircle,
        Clock,
        DollarSign,
        ExternalLink,
        Eye,
        Globe,
        GraduationCap,
        Heart,
        Home,
        Hourglass,
        Laptop,
        LayoutDashboard,
        LogOut,
        MapPin,
        Megaphone,
        MessageCircle,
        MessageSquare,
        MoreHorizontal,
        PawPrint,
        Pencil,
        Plane,
        Search,
        Sparkles,
        Star,
        Stethoscope,
        Trash2,
        User,
        Users,
        Utensils,
        XCircle,
      }),
    ),
  ],
};
