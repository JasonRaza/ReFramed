"use client";

import { useEffect, useState } from "react";

export type Locale = "fr" | "en";
const KEY   = "reframed_locale";
const EVENT = "reframed:locale";

const TRANSLATIONS = {
  fr: {
    // ── Settings ──────────────────────────────────────────────────────────────
    settings:         "Paramètres",
    appearance:       "Apparence",
    darkMode:         "Mode sombre",
    lightMode:        "Mode clair",
    account:          "Compte",
    changePassword:   "Changer le mot de passe",
    newPassword:      "Nouveau mot de passe",
    confirmPassword:  "Confirmer le mot de passe",
    update:           "Mettre à jour",
    updating:         "Mise à jour…",
    updated:          "Mot de passe mis à jour !",
    cancel:           "Annuler",
    language:         "Langue",
    passwordMin:      "Au moins 6 caractères",
    passwordMatch:    "Les mots de passe correspondent",
    passwordNoMatch:  "Les mots de passe ne correspondent pas",

    // ── Navigation ────────────────────────────────────────────────────────────
    home:             "Accueil",
    rankings:         "Classement",
    profile:          "Profil",

    // ── Home — profile setup ──────────────────────────────────────────────────
    createProfile:       "Crée ton profil",
    setupSubtitle:       "Choisis un avatar et un pseudo",
    animalLabel:         "Ton animal",
    colorLabel:          "Ta couleur",
    usernameLabel:       "Pseudo",
    usernamePlaceholder: "Ex: SuperPoseur",
    letsGo:              "C'est parti",

    // ── Home — mode select ────────────────────────────────────────────────────
    chooseMode: "Choisis un mode",
    editBtn:    "Modifier",

    // ── Game modes ────────────────────────────────────────────────────────────
    modeDuel:        "Duel",
    modeDuelSub:     "1v1 en temps réel",
    modeMirror:      "Miroir",
    modeMirrorSub:   "Crée ta pose, l'autre l'imite",
    modePractice:    "Entraînement",
    modePracticeSub: "Mode solo",
    modeRanked:      "Classé",
    modeRankedSub:   "Duel avec système de rang",
    modeRoyale:      "Battle Royale",
    modeRoyaleSub:   "8 joueurs — dernier debout",
    popular:         "Populaire",

    // ── Edit profile panel ────────────────────────────────────────────────────
    editProfileTitle: "Modifier le profil",
    animalSection:    "Animal",
    colorSection:     "Couleur",
    usernameSection:  "Pseudo",
    saveBtn:          "Enregistrer",

    // ── Rankings ──────────────────────────────────────────────────────────────
    rankPoints:      "Points de rang",
    globalTab:       "Global",
    friendsTab:      "Amis",
    searchPlaceholder: "Rechercher par courriel…",
    searchingLabel:  "Recherche…",
    noResults:       "Aucun résultat",
    noPlayersFound:  "Aucun joueur trouvé",
    yourPosition:    "Ta position",
    ofLabel:         "sur",
    playerSingular:  "joueur",
    playerPlural:    "joueurs",
    pointsLabel:     "Points",
    topLabel:        "Top",
    noFriendsTitle:  "Pas encore d'amis",
    noFriendsDesc:   "Recherche un joueur par email pour l'ajouter",
    friendLabel:     "Ami",
    addLabel:        "Ajouter",
    gamesLabel:      "parties",
    winsLabel:       "victoires",
    youLabel:        "toi",
    resultSingular:  "résultat",
    resultPlural:    "résultats",

    // ── Profile ───────────────────────────────────────────────────────────────
    progressLabel:    "Progression",
    nextRankLabel:    "prochain",
    maxRankLabel:     "Rang maximum ✦",
    statsLabel:       "Statistiques",
    gamesPlayed:      "Parties jouées",
    victories:        "Victoires",
    winRateLabel:     "Taux de victoire",
    bestScoreLabel:   "Meilleur score",
    rankHistoryLabel: "Historique de rang",
    firstGamePrompt:  "Joue ta première partie pour voir ton évolution 🎮",
    signOutBtn:       "Se déconnecter",

    // ── Tutorial ──────────────────────────────────────────────────────────────
    tutorialBtn:      "Tutoriel",
    skipAll:          "Passer tout",
    nextBtn:          "Suivant",
    finishBtn:        "Terminer",
    tutoWelcomeTitle: "Bienvenue sur ReFramed !",
    tutoWelcomeDesc:  "Voici un aperçu rapide de l'application. Clique sur Suivant pour avancer ou Passer tout pour quitter.",
    tutoNavTitle:     "Navigation",
    tutoNavDesc:      "Navigue entre les pages depuis ce menu : Accueil, Classement, Profil et Paramètres.",
    tutoModesTitle:   "Modes de jeu",
    tutoModesDesc:    "Choisis un mode pour lancer une partie. Duel 1v1, Entraînement solo, Classé et bien plus !",
    tutoTopbarTitle:  "Personnalisation",
    tutoTopbarDesc:   "Change la langue (FR/EN) ou bascule entre le thème clair et sombre à tout moment.",
    tutoFinishTitle:  "C'est parti !",
    tutoFinishDesc:   "Tu connais maintenant l'essentiel. Lance une partie et amuse-toi bien !",
  },

  en: {
    // ── Settings ──────────────────────────────────────────────────────────────
    settings:         "Settings",
    appearance:       "Appearance",
    darkMode:         "Dark mode",
    lightMode:        "Light mode",
    account:          "Account",
    changePassword:   "Change password",
    newPassword:      "New password",
    confirmPassword:  "Confirm password",
    update:           "Update",
    updating:         "Updating…",
    updated:          "Password updated!",
    cancel:           "Cancel",
    language:         "Language",
    passwordMin:      "At least 6 characters",
    passwordMatch:    "Passwords match",
    passwordNoMatch:  "Passwords do not match",

    // ── Navigation ────────────────────────────────────────────────────────────
    home:             "Home",
    rankings:         "Rankings",
    profile:          "Profile",

    // ── Home — profile setup ──────────────────────────────────────────────────
    createProfile:       "Create your profile",
    setupSubtitle:       "Choose an avatar and a username",
    animalLabel:         "Your animal",
    colorLabel:          "Your color",
    usernameLabel:       "Username",
    usernamePlaceholder: "E.g. SuperPoser",
    letsGo:              "Let's go",

    // ── Home — mode select ────────────────────────────────────────────────────
    chooseMode: "Choose a mode",
    editBtn:    "Edit",

    // ── Game modes ────────────────────────────────────────────────────────────
    modeDuel:        "Duel",
    modeDuelSub:     "Real-time 1v1",
    modeMirror:      "Mirror",
    modeMirrorSub:   "Create a pose, the other imitates",
    modePractice:    "Training",
    modePracticeSub: "Solo mode",
    modeRanked:      "Ranked",
    modeRankedSub:   "Duel with ranking system",
    modeRoyale:      "Battle Royale",
    modeRoyaleSub:   "8 players — last standing",
    popular:         "Popular",

    // ── Edit profile panel ────────────────────────────────────────────────────
    editProfileTitle: "Edit profile",
    animalSection:    "Animal",
    colorSection:     "Color",
    usernameSection:  "Username",
    saveBtn:          "Save",

    // ── Rankings ──────────────────────────────────────────────────────────────
    rankPoints:      "Rank points",
    globalTab:       "Global",
    friendsTab:      "Friends",
    searchPlaceholder: "Search by email…",
    searchingLabel:  "Searching…",
    noResults:       "No results",
    noPlayersFound:  "No players found",
    yourPosition:    "Your position",
    ofLabel:         "of",
    playerSingular:  "player",
    playerPlural:    "players",
    pointsLabel:     "Points",
    topLabel:        "Top",
    noFriendsTitle:  "No friends yet",
    noFriendsDesc:   "Search for a player by email to add them",
    friendLabel:     "Friend",
    addLabel:        "Add",
    gamesLabel:      "games",
    winsLabel:       "wins",
    youLabel:        "you",
    resultSingular:  "result",
    resultPlural:    "results",

    // ── Profile ───────────────────────────────────────────────────────────────
    progressLabel:    "Progress",
    nextRankLabel:    "next",
    maxRankLabel:     "Maximum rank ✦",
    statsLabel:       "Statistics",
    gamesPlayed:      "Games played",
    victories:        "Wins",
    winRateLabel:     "Win rate",
    bestScoreLabel:   "Best score",
    rankHistoryLabel: "Rank history",
    firstGamePrompt:  "Play your first game to see your progress 🎮",
    signOutBtn:       "Sign out",

    // ── Tutorial ──────────────────────────────────────────────────────────────
    tutorialBtn:      "Tutorial",
    skipAll:          "Skip all",
    nextBtn:          "Next",
    finishBtn:        "Finish",
    tutoWelcomeTitle: "Welcome to ReFramed!",
    tutoWelcomeDesc:  "Here's a quick overview of the app. Click Next to continue or Skip all to exit.",
    tutoNavTitle:     "Navigation",
    tutoNavDesc:      "Navigate between pages from this menu: Home, Rankings, Profile and Settings.",
    tutoModesTitle:   "Game modes",
    tutoModesDesc:    "Choose a mode to start a game. 1v1 Duel, Solo Training, Ranked and more!",
    tutoTopbarTitle:  "Customization",
    tutoTopbarDesc:   "Switch language (FR/EN) or toggle between light and dark theme at any time.",
    tutoFinishTitle:  "Ready to play!",
    tutoFinishDesc:   "You now know the essentials. Start a game and have fun!",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.fr;

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) ?? "fr") as Locale;
    setLocaleState(saved);
    document.documentElement.lang = saved;

    function handleChange(e: Event) {
      const next = (e as CustomEvent<Locale>).detail;
      setLocaleState(next);
      document.documentElement.lang = next;
    }
    window.addEventListener(EVENT, handleChange);
    return () => window.removeEventListener(EVENT, handleChange);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
    window.dispatchEvent(new CustomEvent<Locale>(EVENT, { detail: l }));
  }

  return { locale, setLocale, t: TRANSLATIONS[locale] };
}
