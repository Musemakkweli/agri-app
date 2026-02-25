import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type LanguageType = 'english' | 'kinyarwanda' | 'french';

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the translations type
interface Translations {
  [key: string]: string;
}

interface TranslationCollection {
  english: Translations;
  kinyarwanda: Translations;
  french: Translations;
}

// Translations
const translations: TranslationCollection = {
  english: {
    // Common
    'app.name': 'AgroCare',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'cancel': 'Cancel',
    'save': 'Save',
    'update': 'Update',
    'delete': 'Delete',
    'confirm': 'Confirm',
    'back': 'Back',
    
    // Navigation/Tabs
    'nav.home': 'Home',
    'nav.ai': 'AI Doctor',
    'nav.report': 'Report',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.farmOverview': 'Farm Overview',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.recentComplaints': 'Recent Complaints',
    'dashboard.viewAll': 'View All',
    'dashboard.fields': 'Fields',
    'dashboard.harvests': 'Harvests',
    'dashboard.pests': 'Pests',
    'dashboard.complaints': 'Complaints',
    'dashboard.addField': 'Add Field',
    'dashboard.scheduleHarvest': 'Schedule Harvest',
    'dashboard.reportPest': 'Report Pest',
    'dashboard.newComplaint': 'New Complaint',
    
    // AI Screen
    'ai.title': 'AI Plant Doctor',
    'ai.analyzing': 'Analyzing your image...',
    'ai.uploadImage': 'Upload an image of a plant leaf',
    'ai.gallery': 'Gallery',
    'ai.camera': 'Camera',
    'ai.addNotes': 'Add notes (optional)...',
    'ai.analyze': 'Analyze',
    'ai.imageReady': 'Image ready',
    'ai.chatHistory': 'Chat History',
    'ai.newChat': 'New Chat',
    'ai.noChats': 'No chats yet',
    'ai.loginToContinue': 'Login to continue',
    'ai.analysisComplete': 'Analysis complete',
    'ai.diseaseDetected': 'Disease detected',
    'ai.confidence': 'Confidence',
    'ai.severity': 'Severity',
    'ai.affectedParts': 'Affected parts',
    'ai.description': 'Description',
    'ai.recommendations': 'Recommendations',
    'ai.notPlant': 'This does not appear to be a plant',
    'ai.noDisease': 'No disease detected. Your plant looks healthy!',
    
    // Profile
    'profile.title': 'Farmer Profile',
    'profile.personalInfo': 'Personal Information',
    'profile.farmInfo': 'Farm Information',
    'profile.fullName': 'Full Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.district': 'District',
    'profile.farmLocation': 'Farm Location',
    'profile.mainCrops': 'Main Crops',
    'profile.edit': 'Edit',
    'profile.saveChanges': 'Save Changes',
    'profile.notProvided': 'Not provided',
    'profile.uploadSuccess': 'Profile updated successfully!',
    
    // Settings
    'settings.title': 'Settings',
    'settings.preferences': 'Preferences',
    'settings.notifications': 'Notifications',
    'settings.darkMode': 'Dark Mode',
    'settings.language': 'Language',
    'settings.account': 'Account',
    'settings.changePassword': 'Change Password',
    'settings.activityHistory': 'Activity History',
    'settings.privacySecurity': 'Privacy & Security',
    'settings.support': 'Support',
    'settings.faq': 'FAQ',
    'settings.contactSupport': 'Contact Support',
    'settings.termsConditions': 'Terms & Conditions',
    'settings.privacyPolicy': 'Privacy Policy',
    'settings.about': 'About',
    'settings.dangerZone': 'Danger Zone',
    'settings.logout': 'Logout',
    'settings.deleteAccount': 'Delete Account',
    'settings.version': 'Version 1.0.0',
    'settings.copyright': '© 2024 AgroCare. All rights reserved.',
    'settings.selectLanguage': 'Select Language',
    'settings.confirmLogout': 'Are you sure you want to logout?',
    'settings.accountDeleted': 'Your account has been deleted.',
    
    // Complaints
    'complaint.title': 'Farm Complaints',
    'complaint.search': 'Search complaints...',
    'complaint.filter': 'Filter',
    'complaint.total': 'Total',
    'complaint.pending': 'Pending',
    'complaint.inProgress': 'In Progress',
    'complaint.resolved': 'Resolved',
    'complaint.rejected': 'Rejected',
    'complaint.noComplaints': 'No complaints found',
    'complaint.reportFirst': 'Report Your First Issue',
    'complaint.viewDetails': 'View Details',
    'complaint.edit': 'Edit',
    'complaint.delete': 'Delete',
    'complaint.confirmDelete': 'Are you sure you want to delete this complaint?',
    'complaint.form.title': 'Complaint Title',
    'complaint.form.type': 'Type of Issue',
    'complaint.form.location': 'Location',
    'complaint.form.description': 'Description',
    'complaint.form.image': 'Upload Image (Optional)',
    'complaint.form.submit': 'Submit Complaint',
    'complaint.form.update': 'Update Complaint',
    'complaint.form.placeholder.title': 'e.g., Maize leaves turning yellow',
    'complaint.form.placeholder.location': 'e.g., Field A, North Section',
    'complaint.form.placeholder.description': 'Describe the issue in detail...',
    
    // Fields
    'fields.title': 'My Fields',
    'fields.addField': 'Add New Field',
    'fields.editField': 'Edit Field',
    'fields.name': 'Field Name',
    'fields.area': 'Area (hectares)',
    'fields.cropType': 'Crop Type',
    'fields.location': 'Location',
    'fields.placeholder.name': 'e.g., Field A',
    'fields.placeholder.area': 'e.g., 5',
    'fields.placeholder.crop': 'e.g., Maize',
    'fields.placeholder.location': 'e.g., North Section',
    'fields.noFields': 'No fields added yet',
    'fields.addFirst': 'Add Your First Field',
    'fields.view': 'View',
    'fields.edit': 'Edit',
    'fields.delete': 'Delete',
    'fields.csv': 'CSV',
    'fields.confirmDelete': 'Are you sure you want to delete this field?',
    
    // Harvests
    'harvests.title': 'My Harvests',
    'harvests.schedule': 'Schedule Harvest',
    'harvests.edit': 'Edit Harvest',
    'harvests.selectField': 'Select Field',
    'harvests.cropType': 'Crop Type',
    'harvests.date': 'Harvest Date',
    'harvests.status': 'Status',
    'harvests.upcoming': 'Upcoming',
    'harvests.completed': 'Completed',
    'harvests.noHarvests': 'No harvests scheduled yet',
    'harvests.scheduleFirst': 'Schedule Your First Harvest',
    'harvests.addFieldFirst': 'You need to add a field first',
    'harvests.goToFields': 'Go to Fields',
    'harvests.view': 'View',
    'harvests.edite': 'Edit',
    'harvests.delete': 'Delete',
    'harvests.csv': 'CSV',
    'harvests.confirmDelete': 'Are you sure you want to delete this harvest?',
    
    // Pests
    'pests.title': 'Pest Alerts',
    'pests.report': 'Report Pest Alert',
    'pests.edit': 'Edit Pest Alert',
    'pests.selectField': 'Select Field',
    'pests.type': 'Pest Type',
    'pests.severity': 'Severity',
    'pests.low': 'Low',
    'pests.medium': 'Medium',
    'pests.high': 'High',
    'pests.description': 'Description',
    'pests.detected': 'Detected',
    'pests.noPests': 'No pest alerts reported yet',
    'pests.reportFirst': 'Report Your First Pest Alert',
    'pests.view': 'View',
    'pests.edite': 'Edit',
    'pests.delete': 'Delete',
    'pests.csv': 'CSV',
    'pests.confirmDelete': 'Are you sure you want to delete this pest alert?',
    'pests.placeholder.type': 'e.g., Aphids, Armyworms',
    'pests.placeholder.description': 'Describe the pest issue in detail...',
  },
  
  kinyarwanda: {
    // Common
    'app.name': 'AgroCare',
    'loading': 'Biratwara...',
    'error': 'Ikosa',
    'success': 'Byakunze',
    'cancel': 'Guhagarika',
    'save': 'Kubika',
    'update': 'Kuvugurura',
    'delete': 'Gusiba',
    'confirm': 'Emeza',
    'back': 'Subira Inyuma',
    
    // Navigation/Tabs
    'nav.home': 'Ahabanza',
    'nav.ai': "Muganga w'Ibihingwa",
    'nav.report': 'Raporo',
    'nav.profile': 'Umwirondoro',
    'nav.settings': 'Igenamiterere',
    
    // Dashboard
    'dashboard.welcome': 'Murakaza neza',
    'dashboard.farmOverview': "Incamake y'Umusaruro",
    'dashboard.quickActions': 'Ibikorwa Byihuse',
    'dashboard.recentComplaints': 'Ibitaraga Biheruka',
    'dashboard.viewAll': 'Reba Byose',
    'dashboard.fields': 'Imirima',
    'dashboard.harvests': 'Isarura',
    'dashboard.pests': 'Udusimba',
    'dashboard.complaints': 'Ibitaraga',
    'dashboard.addField': 'Ongeramo Umurima',
    'dashboard.scheduleHarvest': 'Guteganya Isarura',
    'dashboard.reportPest': 'Menyesha Udusimba',
    'dashboard.newComplaint': 'Itaraga Rishya',
    
    // AI Screen
    'ai.title': "Muganga w'Ibihingwa",
    'ai.analyzing': 'Kugenzura ifoto yawe...',
    'ai.uploadImage': "Shyiramo ifoto y'ikibabi cy'igihingwa",
    'ai.gallery': 'Ibikubo',
    'ai.camera': 'Kamera',
    'ai.addNotes': "Ongeraho ibisobanuro (by'amahitamo)...",
    'ai.analyze': 'Kugenzura',
    'ai.imageReady': 'Ifoto iteganijwe',
    'ai.chatHistory': "Amateka y'Ikiganiro",
    'ai.newChat': 'Ikiganiro Gishya',
    'ai.noChats': 'Nta kiganiro kirahari',
    'ai.loginToContinue': 'Injira kugira ukomeze',
    'ai.analysisComplete': 'Isuzuzwe ryuzuye',
    'ai.diseaseDetected': 'Indwara yabonetse',
    'ai.confidence': 'Kwizera',
    'ai.severity': 'Uburemere',
    'ai.affectedParts': 'Ibice Byakomotse',
    'ai.description': 'Ibisobanuro',
    'ai.recommendations': 'Inama',
    'ai.notPlant': 'Ibi ntabwo ari igihingwa',
    'ai.noDisease': 'Nta ndwara yabonetse. Igihingwa cyawe kirazima!',
    
    // Profile
    'profile.title': "Umwirondoro w'Umuhinzi",
    'profile.personalInfo': 'Amakuru Yihariye',
    'profile.farmInfo': "Amakuru y'Umusaruro",
    'profile.fullName': 'Amazina Yuzuye',
    'profile.email': 'Imeri',
    'profile.phone': 'Terefone',
    'profile.district': 'Akarere',
    'profile.farmLocation': 'Aho Umurima uherereye',
    'profile.mainCrops': 'Imyaka Ikomeye',
    'profile.edit': 'Hindura',
    'profile.saveChanges': 'Bika Ibyahinduwe',
    'profile.notProvided': 'Ntabwo byatanzwe',
    'profile.uploadSuccess': 'Umwirondoro wavuguruwe neza!',
    
    // Settings
    'settings.title': 'Igenamiterere',
    'settings.preferences': "Iby'amahitamo",
    'settings.notifications': 'Amatangazo',
    'settings.darkMode': 'Uko bigaragara',
    'settings.language': 'Ururimi',
    'settings.account': 'Konti',
    'settings.changePassword': "Hindura ijambo'ibanga",
    'settings.activityHistory': "Amateka y'ibikorwa",
    'settings.privacySecurity': "Ibanga n'Umutekano",
    'settings.support': 'Ubufasha',
    'settings.faq': 'Ibibazo Bikunze',
    'settings.contactSupport': 'Twandikire',
    'settings.termsConditions': "Amategeko n'Amabwiriza",
    'settings.privacyPolicy': "Politiki y'Ibanga",
    'settings.about': 'Ibyerekeye',
    'settings.dangerZone': 'Ahantu K\'akaga',
    'settings.logout': 'Sohoka',
    'settings.deleteAccount': 'Siba Konti',
    'settings.version': 'Verisiyo 1.0.0',
    'settings.copyright': '© 2024 AgroCare. Uburenganzira bwose burubitswe.',
    'settings.selectLanguage': 'Hitamo Ururimi',
    'settings.confirmLogout': 'Uzi neza ko ushaka gusohoka?',
    'settings.accountDeleted': 'Konti yawe yasibwe.',
    
    // Complaints
    'complaint.title': "Ibitaraga by'Umusaruro",
    'complaint.search': 'Shakisha ibitaraga...',
    'complaint.filter': 'Yungurura',
    'complaint.total': 'Zose',
    'complaint.pending': 'Zitegereje',
    'complaint.inProgress': 'Zirimo gukorwa',
    'complaint.resolved': 'Zakemuriwe',
    'complaint.rejected': 'Zatanzwe',
    'complaint.noComplaints': 'Nta bitaraga byabonetse',
    'complaint.reportFirst': 'Tangaza Ikibazo cya Mbere',
    'complaint.viewDetails': 'Reba Ibisobanuro',
    'complaint.edit': 'Hindura',
    'complaint.delete': 'Siba',
    'complaint.confirmDelete': 'Uzi neza ko ushaka gusiba iki bitaraga?',
    'complaint.form.title': "Umutwe w'Itaraga",
    'complaint.form.type': "Ubwoko bw'Ikibazo",
    'complaint.form.location': 'Aho giherereye',
    'complaint.form.description': 'Ibisobanuro',
    'complaint.form.image': "Shyiramo Ifoto (By'amahitamo)",
    'complaint.form.submit': 'Ohereza Itaraga',
    'complaint.form.update': 'Vugurura Itaraga',
    'complaint.form.placeholder.title': "Urugero: Ibibabi by'ibigori bihindutse umuhondo",
    'complaint.form.placeholder.location': "Urugero: Umurima A, Umujyi w'Amajyaruguru",
    'complaint.form.placeholder.description': 'Sobanura ikibazo mu buryo bwimbitse...',
    
    // Fields
    'fields.title': 'Imirima Yanjye',
    'fields.addField': 'Ongeraho Umurima',
    'fields.editField': 'Hindura Umurima',
    'fields.name': "Izina ry'Umurima",
    'fields.area': 'Ubuso (hectare)',
    'fields.cropType': "Ubwoko bw'Imyaka",
    'fields.location': 'Aho uherereye',
    'fields.placeholder.name': 'Urugero: Umurima A',
    'fields.placeholder.area': 'Urugero: 5',
    'fields.placeholder.crop': 'Urugero: Ibigori',
    'fields.placeholder.location': "Urugero: Umujyi w'Amajyaruguru",
    'fields.noFields': 'Nta mirima yongerwaho',
    'fields.addFirst': 'Ongeraho Umurima wa Mbere',
    'fields.view': 'Reba',
    'fields.edit': 'Hindura',
    'fields.delete': 'Siba',
    'fields.csv': 'CSV',
    'fields.confirmDelete': 'Uzi neza ko ushaka gusiba uyu murima?',
    
    // Harvests
    'harvests.title': 'Isarura Yanjye',
    'harvests.schedule': 'Guteganya Isarura',
    'harvests.edit': 'Hindura Isarura',
    'harvests.selectField': 'Hitamo Umurima',
    'harvests.cropType': "Ubwoko bw'Imyaka",
    'harvests.date': "Itariki y'Isarura",
    'harvests.status': 'Imyanya',
    'harvests.upcoming': 'Irizaza',
    'harvests.completed': 'Yarangiye',
    'harvests.noHarvests': 'Nta sarura iteganyijwe',
    'harvests.scheduleFirst': 'Teganya Isarura ya Mbere',
    'harvests.addFieldFirst': 'Ukeneye kongeramo umurima mbere',
    'harvests.goToFields': 'Jya ku Mirima',
    'harvests.view': 'Reba',
    'harvests.edite': 'Hindura',
    'harvests.delete': 'Siba',
    'harvests.csv': 'CSV',
    'harvests.confirmDelete': 'Uzi neza ko ushaka gusiba iyi sarura?',
    
    // Pests
    'pests.title': 'Udusimba',
    'pests.report': 'Menyesha Udusimba',
    'pests.edit': 'Hindura Udusimba',
    'pests.selectField': 'Hitamo Umurima',
    'pests.type': "Ubwoko bw'Udusimba",
    'pests.severity': 'Uburemere',
    'pests.low': 'Bucye',
    'pests.medium': 'Buringaniye',
    'pests.high': 'Bikabije',
    'pests.description': 'Ibisobanuro',
    'pests.detected': 'Byagaragaye',
    'pests.noPests': 'Nta dusimba twamenyeshejwe',
    'pests.reportFirst': 'Menyesha Udusimba bwa Mbere',
    'pests.view': 'Reba',
    'pests.edite': 'Hindura',
    'pests.delete': 'Siba',
    'pests.csv': 'CSV',
    'pests.confirmDelete': 'Uzi neza ko ushaka gusiba ubu dusimba?',
    'pests.placeholder.type': 'Urugero: Inswa, Iminyorogoto',
    'pests.placeholder.description': "Sobanura ikibazo cy'udusimba mu buryo bwimbitse...",
  },
  
  french: {
    // Common
    'app.name': 'AgroCare',
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'cancel': 'Annuler',
    'save': 'Enregistrer',
    'update': 'Mettre à jour',
    'delete': 'Supprimer',
    'confirm': 'Confirmer',
    'back': 'Retour',
    
    // Navigation/Tabs
    'nav.home': 'Accueil',
    'nav.ai': 'Docteur IA',
    'nav.report': 'Signaler',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    
    // Dashboard
    'dashboard.welcome': 'Bon retour',
    'dashboard.farmOverview': 'Aperçu de la Ferme',
    'dashboard.quickActions': 'Actions Rapides',
    'dashboard.recentComplaints': 'Réclamations Récentes',
    'dashboard.viewAll': 'Voir Tout',
    'dashboard.fields': 'Champs',
    'dashboard.harvests': 'Récoltes',
    'dashboard.pests': 'Ravageurs',
    'dashboard.complaints': 'Réclamations',
    'dashboard.addField': 'Ajouter un Champ',
    'dashboard.scheduleHarvest': 'Planifier Récolte',
    'dashboard.reportPest': 'Signaler Ravageur',
    'dashboard.newComplaint': 'Nouvelle Réclamation',
    
    // AI Screen
    'ai.title': 'Docteur IA des Plantes',
    'ai.analyzing': 'Analyse de votre image...',
    'ai.uploadImage': 'Téléchargez une photo de feuille de plante',
    'ai.gallery': 'Galerie',
    'ai.camera': 'Appareil Photo',
    'ai.addNotes': 'Ajouter des notes (optionnel)...',
    'ai.analyze': 'Analyser',
    'ai.imageReady': 'Image prête',
    'ai.chatHistory': 'Historique des Conversations',
    'ai.newChat': 'Nouvelle Conversation',
    'ai.noChats': 'Aucune conversation',
    'ai.loginToContinue': 'Connectez-vous pour continuer',
    'ai.analysisComplete': 'Analyse terminée',
    'ai.diseaseDetected': 'Maladie détectée',
    'ai.confidence': 'Confiance',
    'ai.severity': 'Gravité',
    'ai.affectedParts': 'Parties affectées',
    'ai.description': 'Description',
    'ai.recommendations': 'Recommandations',
    'ai.notPlant': 'Ceci ne semble pas être une plante',
    'ai.noDisease': 'Aucune maladie détectée. Votre plante est saine!',
    
    // Profile
    'profile.title': 'Profil de l\'Agriculteur',
    'profile.personalInfo': 'Informations Personnelles',
    'profile.farmInfo': 'Informations de la Ferme',
    'profile.fullName': 'Nom Complet',
    'profile.email': 'Email',
    'profile.phone': 'Téléphone',
    'profile.district': 'District',
    'profile.farmLocation': 'Emplacement de la Ferme',
    'profile.mainCrops': 'Cultures Principales',
    'profile.edit': 'Modifier',
    'profile.saveChanges': 'Enregistrer les Modifications',
    'profile.notProvided': 'Non fourni',
    'profile.uploadSuccess': 'Profil mis à jour avec succès!',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.preferences': 'Préférences',
    'settings.notifications': 'Notifications',
    'settings.darkMode': 'Mode Sombre',
    'settings.language': 'Langue',
    'settings.account': 'Compte',
    'settings.changePassword': 'Changer le Mot de Passe',
    'settings.activityHistory': 'Historique d\'Activité',
    'settings.privacySecurity': 'Confidentialité et Sécurité',
    'settings.support': 'Support',
    'settings.faq': 'FAQ',
    'settings.contactSupport': 'Contacter le Support',
    'settings.termsConditions': 'Termes et Conditions',
    'settings.privacyPolicy': 'Politique de Confidentialité',
    'settings.about': 'À Propos',
    'settings.dangerZone': 'Zone Dangereuse',
    'settings.logout': 'Déconnexion',
    'settings.deleteAccount': 'Supprimer le Compte',
    'settings.version': 'Version 1.0.0',
    'settings.copyright': '© 2024 AgroCare. Tous droits réservés.',
    'settings.selectLanguage': 'Sélectionner la Langue',
    'settings.confirmLogout': 'Êtes-vous sûr de vouloir vous déconnecter?',
    'settings.accountDeleted': 'Votre compte a été supprimé.',
    
    // Complaints
    'complaint.title': 'Réclamations de la Ferme',
    'complaint.search': 'Rechercher des réclamations...',
    'complaint.filter': 'Filtrer',
    'complaint.total': 'Total',
    'complaint.pending': 'En Attente',
    'complaint.inProgress': 'En Cours',
    'complaint.resolved': 'Résolu',
    'complaint.rejected': 'Rejeté',
    'complaint.noComplaints': 'Aucune réclamation trouvée',
    'complaint.reportFirst': 'Signaler Votre Premier Problème',
    'complaint.viewDetails': 'Voir les Détails',
    'complaint.edit': 'Modifier',
    'complaint.delete': 'Supprimer',
    'complaint.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cette réclamation?',
    'complaint.form.title': 'Titre de la Réclamation',
    'complaint.form.type': 'Type de Problème',
    'complaint.form.location': 'Emplacement',
    'complaint.form.description': 'Description',
    'complaint.form.image': 'Télécharger une Image (Optionnel)',
    'complaint.form.submit': 'Soumettre la Réclamation',
    'complaint.form.update': 'Mettre à Jour la Réclamation',
    'complaint.form.placeholder.title': 'ex: Feuilles de maïs jaunissent',
    'complaint.form.placeholder.location': 'ex: Champ A, Section Nord',
    'complaint.form.placeholder.description': 'Décrivez le problème en détail...',
    
    // Fields
    'fields.title': 'Mes Champs',
    'fields.addField': 'Ajouter un Champ',
    'fields.editField': 'Modifier le Champ',
    'fields.name': 'Nom du Champ',
    'fields.area': 'Superficie (hectares)',
    'fields.cropType': 'Type de Culture',
    'fields.location': 'Emplacement',
    'fields.placeholder.name': 'ex: Champ A',
    'fields.placeholder.area': 'ex: 5',
    'fields.placeholder.crop': 'ex: Maïs',
    'fields.placeholder.location': 'ex: Section Nord',
    'fields.noFields': 'Aucun champ ajouté',
    'fields.addFirst': 'Ajouter Votre Premier Champ',
    'fields.view': 'Voir',
    'fields.edit': 'Modifier',
    'fields.delete': 'Supprimer',
    'fields.csv': 'CSV',
    'fields.confirmDelete': 'Êtes-vous sûr de vouloir supprimer ce champ?',
    
    // Harvests
    'harvests.title': 'Mes Récoltes',
    'harvests.schedule': 'Planifier une Récolte',
    'harvests.edit': 'Modifier la Récolte',
    'harvests.selectField': 'Sélectionner un Champ',
    'harvests.cropType': 'Type de Culture',
    'harvests.date': 'Date de Récolte',
    'harvests.status': 'Statut',
    'harvests.upcoming': 'À Venir',
    'harvests.completed': 'Terminé',
    'harvests.noHarvests': 'Aucune récolte planifiée',
    'harvests.scheduleFirst': 'Planifier Votre Première Récolte',
    'harvests.addFieldFirst': 'Vous devez d\'abord ajouter un champ',
    'harvests.goToFields': 'Aller aux Champs',
    'harvests.view': 'Voir',
    'harvests.edite': 'Modifier',
    'harvests.delete': 'Supprimer',
    'harvests.csv': 'CSV',
    'harvests.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cette récolte?',
    
    // Pests
    'pests.title': 'Alertes de Ravageurs',
    'pests.report': 'Signaler un Ravageur',
    'pests.edit': 'Modifier l\'Alerte',
    'pests.selectField': 'Sélectionner un Champ',
    'pests.type': 'Type de Ravageur',
    'pests.severity': 'Gravité',
    'pests.low': 'Faible',
    'pests.medium': 'Moyenne',
    'pests.high': 'Élevée',
    'pests.description': 'Description',
    'pests.detected': 'Détecté',
    'pests.noPests': 'Aucune alerte de ravageur signalée',
    'pests.reportFirst': 'Signaler Votre Premier Ravageur',
    'pests.view': 'Voir',
    'pests.edite': 'Modifier',
    'pests.delete': 'Supprimer',
    'pests.csv': 'CSV',
    'pests.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cette alerte?',
    'pests.placeholder.type': 'ex: Pucerons, Chenilles',
    'pests.placeholder.description': 'Décrivez le problème de ravageur en détail...',
  },
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageType>('english');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user_language');
      if (savedLanguage === 'english' || savedLanguage === 'kinyarwanda' || savedLanguage === 'french') {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: LanguageType) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('user_language', lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    // Type-safe access
    const langTranslations = translations[language];
    if (!langTranslations) {
      console.warn(`Language ${language} not found`);
      return key;
    }
    
    const translation = langTranslations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      // Fallback to English
      const englishTranslation = translations.english[key];
      return englishTranslation || key;
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};