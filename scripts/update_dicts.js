const fs = require('fs');

const dicts = ['en', 'de', 'fr'];

const content = {
  en: {
    comingSoon: {
      title: "Coming Soon",
      subtitle: "We're working hard to bring you this feature. Check back soon!",
      backToHome: "Return to Home",
      exploreBraiders: "Explore Braiders"
    },
    aboutUs: {
      title: "About Us",
      heroHeadline: "Redefining Afro Hair Care in Europe",
      heroSubtitle: "Connecting you with the best afro hair braiders seamlessly, reliably, and beautifully.",
      missionTitle: "Our Mission",
      missionText: "We believe everyone deserves access to top-tier afro hair care. Finding a skilled braider shouldn't be a hassle. We created Afrobraids Connect to bridge the gap between talented braiders and clients looking for the perfect style.",
      whyChooseUsTitle: "Why Choose Us",
      whyLocation: "Location-based Search",
      whyLocationText: "Find verified braiders right in your neighborhood or destination.",
      whyPortfolios: "Verified Portfolios",
      whyPortfoliosText: "Browse genuine photos and reviews before you book.",
      whyEstherAI: "Esther AI",
      whyEstherAIText: "Not sure what you want? Let our AI assistant generate personalized style recommendations.",
      ctaTitle: "Ready for your next look?",
      ctaButton: "Start searching",
      ctaPartner: "Become a partner"
    }
  },
  de: {
    comingSoon: {
      title: "Demnächst",
      subtitle: "Wir arbeiten hart daran, Ihnen diese Funktion bereitzustellen. Schauen Sie bald wieder vorbei!",
      backToHome: "Zurück zur Startseite",
      exploreBraiders: "Braider entdecken"
    },
    aboutUs: {
      title: "Über uns",
      heroHeadline: "Wir definieren Afro-Haarpflege in Europa neu",
      heroSubtitle: "Verbindet Sie nahtlos, zuverlässig und auf wunderschöne Weise mit den besten Afro-Haar-Braidern.",
      missionTitle: "Unsere Mission",
      missionText: "Wir glauben, dass jeder Zugang zu erstklassiger Afro-Haarpflege verdient. Einen erfahrenen Braider zu finden, sollte kein Problem sein. Wir haben Afrobraids Connect gegründet, um die Lücke zwischen talentierten Braidern und Kunden zu schließen, die den perfekten Style suchen.",
      whyChooseUsTitle: "Warum wir?",
      whyLocation: "Standortbasierte Suche",
      whyLocationText: "Finden Sie verifizierte Braider direkt in Ihrer Nähe oder an Ihrem Zielort.",
      whyPortfolios: "Verifizierte Portfolios",
      whyPortfoliosText: "Sehen Sie sich echte Fotos und Bewertungen an, bevor Sie buchen.",
      whyEstherAI: "Esther AI",
      whyEstherAIText: "Unsicher, was Sie wollen? Lassen Sie unseren KI-Assistenten personalisierte Style-Empfehlungen erstellen.",
      ctaTitle: "Bereit für Ihren nächsten Look?",
      ctaButton: "Suche starten",
      ctaPartner: "Partner werden"
    }
  },
  fr: {
    comingSoon: {
      title: "Bientôt disponible",
      subtitle: "Nous travaillons dur pour vous offrir cette fonctionnalité. Revenez bientôt !",
      backToHome: "Retour à l'accueil",
      exploreBraiders: "Explorer les coiffeurs"
    },
    aboutUs: {
      title: "À propos",
      heroHeadline: "Redéfinir le soin des cheveux afro en Europe",
      heroSubtitle: "Vous connecter avec les meilleurs coiffeurs afro de manière fluide, fiable et esthétique.",
      missionTitle: "Notre Mission",
      missionText: "Nous pensons que tout le monde mérite d'avoir accès à des soins capillaires afro de premier ordre. Trouver un coiffeur qualifié ne devrait pas être compliqué. Nous avons créé Afrobraids Connect pour combler le fossé entre les coiffeurs talentueux et les clients à la recherche du style parfait.",
      whyChooseUsTitle: "Pourquoi nous choisir",
      whyLocation: "Recherche basée sur la localisation",
      whyLocationText: "Trouvez des coiffeurs vérifiés directement dans votre quartier ou votre destination.",
      whyPortfolios: "Portfolios vérifiés",
      whyPortfoliosText: "Parcourez des photos et des avis authentiques avant de réserver.",
      whyEstherAI: "Esther AI",
      whyEstherAIText: "Vous ne savez pas ce que vous voulez ? Laissez notre assistant IA générer des recommandations de style personnalisées.",
      ctaTitle: "Prêt pour votre prochain look ?",
      ctaButton: "Commencer la recherche",
      ctaPartner: "Devenir partenaire"
    }
  }
};

for (const lang of dicts) {
  const path = `app/[lang]/dictionaries/${lang}.json`;
  let data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data.comingSoonPage = content[lang].comingSoon;
  data.aboutUs = content[lang].aboutUs;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
