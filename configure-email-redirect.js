// Script de configuration de l'URL de redirection pour l'email de confirmation
// Exécutez ce script dans la console du navigateur ou ajoutez-le à votre page

(function() {
    console.log('🔗 Configuration de l\'URL de redirection pour l\'email de confirmation');
    
    // URL de production (remplacez par votre domaine)
    const productionUrl = 'https://ninjalinking.netlify.app';
    
    // Vérifier l'URL actuelle
    const currentUrl = localStorage.getItem('email-redirect-url');
    console.log('URL actuelle:', currentUrl || 'URL par défaut');
    
    // Configurer l'URL de production
    localStorage.setItem('email-redirect-url', productionUrl);
    console.log('✅ URL de redirection configurée:', productionUrl);
    
    // Afficher un message de confirmation
    alert(`✅ URL de redirection configurée avec succès !\n\nURL: ${productionUrl}\n\nLes nouveaux utilisateurs seront redirigés vers cette URL après confirmation de leur email.`);
    
    // Optionnel : Tester la configuration
    if (typeof window.SupabaseService !== 'undefined') {
        const testService = new window.SupabaseService();
        console.log('URL de redirection qui sera utilisée:', testService.getEmailRedirectUrl());
    }
})();

