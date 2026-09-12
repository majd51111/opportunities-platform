import ar from "./ar";
import en from "./en";
import es from "./es";
import fr from "./fr";
import de from "./de";
import pt from "./pt";
import ja from "./ja";
import zh from "./zh";

export type LanguageDictionary = {
  common: {
    signIn: string;
    signOut: string;
    opportunities: string;
    search: string;
    favorites: string;
    profile: string;
    reports: string;
    admin: string;
    overview: string;
    users: string;
    backToHome: string;
    deleteOpportunity: string;
  };
  home: {
    label: string;
    title: string;
    description: string;
  };
  admin: {
    opportunities: {
      title: string;
      description: string;
    };
    users: {
      title: string;
      description: string;
    };
    reports: {
      title: string;
      description: string;
      refresh: string;
      loading: string;
      noReports: string;
      updateError: string;
      notSpecified: string;
      noMessage: string;
      table: {
        id: string;
        user: string;
        opportunity: string;
        type: string;
        message: string;
        status: string;
        date: string;
      };
      statusOptions: {
        pending: string;
        reviewed: string;
        resolved: string;
        rejected: string;
      };
    };
  };
  auth: {
    email: string;
    password: string;
    fullName: string;
    login: string;
    register: string;
  };
  profilePage: {
    title: string;
    loginRequired: string;
    loading: string;
    profileInformation: string;
    editProfile: string;
    saveProfile: string;
    saveChanges: string;
    cancel: string;
    fullName: string;
    email: string;
    profileUpdated: string;
    profileUpdateError: string;
    avatarUploadError: string;
    notifications: string;
    emailNotifications: string;
    opportunityUpdates: string;
    marketingNotifications: string;
    notificationSaveError: string;
    favorites: string;
    favoritesDescription: string;
    viewFavorites: string;
    startedOpportunities: string;
    noStartedOpportunities: string;
    viewOpportunity: string;
    payoutAccounts: string;
    addAccount: string;
    editAccount: string;
    deleteAccount: string;
    deleteAccountConfirmation: string;
    deleteAccountError: string;
    deleteAccountSuccess: string;
    accountType: string;
    bankAccount: string;
    paypal: string;
    payoneer: string;
    cryptocurrency: string;
    accountHolderName: string;
    bankName: string;
    iban: string;
    accountNumber: string;
    swiftBic: string;
    paypalEmail: string;
    payoneerEmail: string;
    walletAddress: string;
    network: string;
    selectNetwork: string;
    saveAccount: string;
    accountSaved: string;
    accountUpdated: string;
    accountDeleted: string;
    payoutAccountsEmpty: string;
    invalidEmail: string;
    saveBankAccount: string;
    editBankAccount: string;
    deleteBankAccount: string;
    bankAccountSaved: string;
    bankAccountDeleted: string;
    bankAccountEmpty: string;
    bankAccountError: string;
    addBankAccount: string;
    deleteConfirmation: string;
    requiredFields: string;
    invalidIban: string;
    signOut: string;
  };
  messages: {
    loginSuccess: string;
    logoutSuccess: string;
    registerSuccess: string;
    errorLabel: string;
  };
  opportunitiesPage: {
    title: string;
    loading: string;
    loadError: string;
    noPublished: string;
    discover: string;
    noDescription: string;
    viewOpportunity: string;
      startOpportunity: string;
    earnings: string;
    devices: string;
    verification: string;
  };
  searchPage: {
    title: string;
    subtitle: string;
    allCategories: string;
    allCountries: string;
    allDevices: string;
    placeholder: string;
    search: string;
    searching: string;
    noMatches: string;
    verified: string;
    devices: string;
    countries: string;
  };
  favoritesPage: {
    title: string;
    loading: string;
    pleaseLogin: string;
    loadError: string;
    subtitle: string;
    empty: string;
    noSaved: string;
    viewOpportunity: string;
    remove: string;
    earnings: string;
  };
  detailPage: {
    loading: string;
    notFound: string;
    backToOpportunities: string;
    loginFirst: string;
    backToPreviousPage: string;
    addFavorite: string;
    removeFavorite: string;
    reportOpportunity: string;
    alreadyReported: string;
    reportSubmitted: string;
    reportError: string;
    goToOpportunity: string;
    category: string;
    details: string;
    earnings: string;
    devices: string;
    countries: string;
    paymentMethods: string;
    requirements: string;
    verification: string;
    startOpportunity: string;
  };
};

export const languages = {
  ar,
  en,
  es,
  fr,
  de,
  pt,
  ja,
  zh,
} as const satisfies Record<string, LanguageDictionary>;

export type LanguageCode = keyof typeof languages;

export const languageNames: Record<LanguageCode, string> = {
  ar: "العربية",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ja: "日本語",
  zh: "中文",
};