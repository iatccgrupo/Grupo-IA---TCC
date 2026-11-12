import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, Nunito} from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aventura do Saber | Plataforma Educacional Lúdica',
  description:
    'Plataforma educacional lúdica e interativa para crianças com trilha de aventuras, atividades de fonemas e letras, gamificação com medalhas e área do responsável alinhada à BNCC.',
  openGraph: {
    title: 'Aventura do Saber | Plataforma Educacional Lúdica',
    description:
      'Plataforma educacional lúdica e interativa para crianças com trilha de aventuras, atividades de fonemas e letras, gamificação com medalhas e área do responsável alinhada à BNCC.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aventura do Saber | Plataforma Educacional Lúdica',
    description:
      'Plataforma educacional lúdica e interativa para crianças com trilha de aventuras, atividades de fonemas e letras, gamificação com medalhas e área do responsável alinhada à BNCC.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} ${nunito.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased selection:bg-amber-300 selection:text-amber-950">
        {children}
      </body>
    </html>
  );
}

