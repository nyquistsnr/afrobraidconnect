const fs = require('fs');

const dicts = ['en', 'de', 'fr'];

const content = {
  en: {
    contactUs: {
      title: "Contact Us",
      subtitle: "We'd love to hear from you. Fill out the form below and our team will get back to you shortly.",
      firstNameLabel: "First Name",
      firstNamePlaceholder: "e.g. Amara",
      lastNameLabel: "Last Name",
      lastNamePlaceholder: "e.g. Nwosu",
      emailLabel: "Email Address",
      emailPlaceholder: "hello@example.com",
      phoneLabel: "Phone Number",
      subjectLabel: "Subject (Optional)",
      subjectPlaceholder: "What is this regarding?",
      purposeLabel: "Reason for Contact",
      purposePlaceholder: "Select a reason...",
      purposes: {
        GENERAL: "General Inquiry",
        PARTNER: "Become a Partner",
        PRICING: "Pricing & Billing",
        FAQS: "Help & Support"
      },
      messageLabel: "Message",
      messagePlaceholder: "How can we help you?",
      submit: "Send Message",
      submitting: "Sending...",
      successTitle: "Message Sent!",
      rateLimited: "You've sent too many messages. Please try again later.",
      retryAfter: "Try again in {seconds}s"
    },
    sitemap: {
      title: "Sitemap",
      subtitle: "Find your way around Afrobraids Connect.",
      explore: "Explore",
      exploreDesc: "Find braiders, check availability, and book your next style.",
      company: "Company",
      companyDesc: "Learn more about us and our mission.",
      legal: "Legal",
      legalDesc: "Terms, privacy, and policies.",
      support: "Support",
      supportDesc: "Get help with your bookings or account.",
      links: {
        home: "Home",
        search: "Search Braiders",
        about: "About Us",
        partners: "For Partners",
        pricing: "Pricing",
        contact: "Contact Us",
        blog: "Blog",
        privacy: "Privacy Policy",
        terms: "Terms of Service"
      }
    }
  },
  de: {
    contactUs: {
      title: "Kontaktiere uns",
      subtitle: "Wir würden uns freuen, von dir zu hören. Fülle das Formular unten aus und unser Team wird sich in Kürze bei dir melden.",
      firstNameLabel: "Vorname",
      firstNamePlaceholder: "z.B. Amara",
      lastNameLabel: "Nachname",
      lastNamePlaceholder: "z.B. Nwosu",
      emailLabel: "E-Mail-Adresse",
      emailPlaceholder: "hallo@beispiel.de",
      phoneLabel: "Telefonnummer",
      subjectLabel: "Betreff (Optional)",
      subjectPlaceholder: "Worum geht es?",
      purposeLabel: "Grund der Kontaktaufnahme",
      purposePlaceholder: "Wähle einen Grund...",
      purposes: {
        GENERAL: "Allgemeine Anfrage",
        PARTNER: "Partner werden",
        PRICING: "Preise & Abrechnung",
        FAQS: "Hilfe & Support"
      },
      messageLabel: "Nachricht",
      messagePlaceholder: "Wie können wir dir helfen?",
      submit: "Nachricht senden",
      submitting: "Wird gesendet...",
      successTitle: "Nachricht gesendet!",
      rateLimited: "Du hast zu viele Nachrichten gesendet. Bitte versuche es später noch einmal.",
      retryAfter: "Versuche es in {seconds}s erneut"
    },
    sitemap: {
      title: "Sitemap",
      subtitle: "Finde dich auf Afrobraids Connect zurecht.",
      explore: "Entdecken",
      exploreDesc: "Finde Braider, prüfe Verfügbarkeiten und buche deinen nächsten Style.",
      company: "Unternehmen",
      companyDesc: "Erfahre mehr über uns und unsere Mission.",
      legal: "Rechtliches",
      legalDesc: "Bedingungen, Datenschutz und Richtlinien.",
      support: "Support",
      supportDesc: "Hol dir Hilfe bei deinen Buchungen oder deinem Konto.",
      links: {
        home: "Startseite",
        search: "Braider suchen",
        about: "Über uns",
        partners: "Für Partner",
        pricing: "Preise",
        contact: "Kontakt",
        blog: "Blog",
        privacy: "Datenschutzerklärung",
        terms: "Nutzungsbedingungen"
      }
    }
  },
  fr: {
    contactUs: {
      title: "Contactez-nous",
      subtitle: "Nous serions ravis de vous entendre. Remplissez le formulaire ci-dessous et notre équipe vous répondra sous peu.",
      firstNameLabel: "Prénom",
      firstNamePlaceholder: "ex: Amara",
      lastNameLabel: "Nom de famille",
      lastNamePlaceholder: "ex: Nwosu",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "bonjour@exemple.fr",
      phoneLabel: "Numéro de téléphone",
      subjectLabel: "Sujet (Facultatif)",
      subjectPlaceholder: "De quoi s'agit-il ?",
      purposeLabel: "Motif du contact",
      purposePlaceholder: "Sélectionnez un motif...",
      purposes: {
        GENERAL: "Demande générale",
        PARTNER: "Devenir partenaire",
        PRICING: "Tarification et facturation",
        FAQS: "Aide et support"
      },
      messageLabel: "Message",
      messagePlaceholder: "Comment pouvons-nous vous aider ?",
      submit: "Envoyer le message",
      submitting: "Envoi en cours...",
      successTitle: "Message envoyé !",
      rateLimited: "Vous avez envoyé trop de messages. Veuillez réessayer plus tard.",
      retryAfter: "Réessayez dans {seconds}s"
    },
    sitemap: {
      title: "Plan du site",
      subtitle: "Trouvez votre chemin sur Afrobraids Connect.",
      explore: "Explorer",
      exploreDesc: "Trouvez des coiffeurs, vérifiez la disponibilité et réservez votre prochain style.",
      company: "Entreprise",
      companyDesc: "En savoir plus sur nous et notre mission.",
      legal: "Légal",
      legalDesc: "Conditions, confidentialité et politiques.",
      support: "Support",
      supportDesc: "Obtenez de l'aide pour vos réservations ou votre compte.",
      links: {
        home: "Accueil",
        search: "Rechercher des coiffeurs",
        about: "À propos de nous",
        partners: "Pour les partenaires",
        pricing: "Tarifs",
        contact: "Contact",
        blog: "Blog",
        privacy: "Politique de confidentialité",
        terms: "Conditions de service"
      }
    }
  }
};

for (const lang of dicts) {
  const path = `app/[lang]/dictionaries/${lang}.json`;
  let data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data.contactUs = content[lang].contactUs;
  data.sitemap = content[lang].sitemap;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
