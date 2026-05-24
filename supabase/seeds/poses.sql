-- Challenging pose seed — run after 004_poses.sql migration
-- All images sourced from Wikimedia Commons (public domain / CC)

DELETE FROM public.poses;

INSERT INTO public.poses (id, title, artist, category, difficulty, image_url) VALUES

-- ── YOGA (9 poses) ──────────────────────────────────────────────────────────

('warrior-iii',
 'Guerrier III',
 'Yoga — Virabhadrasana III',
 'yoga', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Tuladandasana_-_Virabhadrasana_III.jpg?width=640'),

('eagle-pose',
 'Pose de l''Aigle',
 'Yoga — Garudasana',
 'yoga', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Garudasana_Yoga-Asana_Nina-Mel.jpg?width=640'),

('natarajasana',
 'Seigneur de la Danse',
 'Yoga — Natarajasana',
 'yoga', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Natarajasana_Yoga-Asana_Nina-Mel.jpg?width=640'),

('crow-pose',
 'Pose du Corbeau',
 'Yoga — Bakasana',
 'yoga', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Crow_pose.jpg?width=640'),

('boat-pose',
 'Pose du Bateau',
 'Yoga — Navasana',
 'yoga', 3,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Boat_pose.JPG?width=640'),

('revolved-triangle',
 'Triangle Renversé',
 'Yoga — Parivrtta Trikonasana',
 'yoga', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Parivrtta-Trikonasana_Yoga-Asana_Nina-Mel.jpg?width=640'),

('standing-toe-hold',
 'Prise du Gros Orteil Debout',
 'Yoga — Utthita Hasta Padangusthasana',
 'yoga', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Utthita-Hasta-Padangusthasana_Yoga-Asana_Nina-Mel.jpg?width=640'),

('hanumanasana',
 'Grand Écart Frontal',
 'Yoga — Hanumanasana',
 'yoga', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Hanumanasana_-_Monkey_Pose_-_Side_view.jpg?width=640'),

('camel-pose',
 'Pose du Chameau',
 'Yoga — Ustrasana',
 'yoga', 3,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Ustrasana_Yoga-Asana_Nina-Mel.jpg?width=640'),

-- ── BALLET & DANSE (5 poses) ─────────────────────────────────────────────────

('arabesque-pointe',
 'Arabesque sur Pointe',
 'Ballet classique',
 'ballet', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Arabesque_on_pointe.jpg?width=640'),

('attitude-ballet',
 'Attitude Croisée',
 'Ballet — Prix de Lausanne',
 'ballet', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Hinano_Eto_-_Don_Quichotte%2C_Kitri_-_Prix_de_Lausanne_2010-5.jpg?width=640'),

('arabesque-swan-lake',
 'Arabesque — Lac des Cygnes',
 'Ballet — Nadja Sellrup',
 'ballet', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Nadja_Sellrup_in_Swan_Lake_2008.jpg?width=640'),

('hopak-split-jump',
 'Saut Cosaques — Grand Écart',
 'Danse — Hopak',
 'ballet', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Split_jump_in_Hopak_dance_performed_by_the_Kalyna_Performing_Art_Ensemble.jpg?width=640'),

('bharatanatyam',
 'Bharatanatyam — Pose Tribhanga',
 'Danse Classique Indienne',
 'ballet', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Indian_dance_6_nataraja.jpg?width=640'),

-- ── ARTS MARTIAUX (3 poses) ──────────────────────────────────────────────────

('capoeira-tesoura',
 'Capoeira — Tesoura',
 'Capoeira Angola',
 'martial_arts', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Tesoura_de_Angola_move.jpg?width=640'),

('capoeira-au',
 'Capoeira — Au (Roue)',
 'Capoeira Angola',
 'martial_arts', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Capoeira_acrobatics.jpg?width=640'),

('capoeira-macaco',
 'Capoeira — Macaco',
 'Capoeira Angola',
 'martial_arts', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/CapoeiraMacaco_ST_05.jpg?width=640'),

-- ── SCULPTURE & ART (6 poses) ────────────────────────────────────────────────

('laocoon',
 'Laocoon et ses Fils',
 'Atelier de Rhodes (Vatican)',
 'sculpture', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Laocoon_and_His_Sons.jpg?width=640'),

('discobolus',
 'Discobole',
 'Myron — Copie romaine',
 'sculpture', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Discobolus_in_National_Roman_Museum_Palazzo_Massimo_alle_Terme.JPG?width=640'),

('nataraja-bronze',
 'Nataraja — Shiva Dansant',
 'Art Chola — XIe siècle',
 'sculpture', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/WLA_vanda_Shiva_Nataraja.jpg?width=640'),

('nataraja-cern',
 'Nataraja du CERN',
 'Réplique — Inde / CERN Genève',
 'sculpture', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Shiva%27s_statue_at_CERN_engaging_in_the_Nataraja_dance.jpg?width=640'),

('vitruvian-man',
 'L''Homme de Vitruve',
 'Léonard de Vinci — 1490',
 'art', 3,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Da_Vinci_Vitruve_Luc_Viatour.jpg?width=640'),

('the-thinker',
 'Le Penseur',
 'Auguste Rodin',
 'sculpture', 2,
 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Thinker%2C_Rodin.jpg?width=640'),

-- ── SPORT & ACROBATIES (3 poses) ────────────────────────────────────────────

('layback-spin',
 'Pirouette Cambrée (Layback)',
 'Patinage Artistique',
 'sport', 4,
 'https://commons.wikimedia.org/wiki/Special:FilePath/Catch_foot_layback.jpg?width=640'),

('one-arm-handstand',
 'Appui Renversé — Un Bras',
 'Acrobatie Urbaine',
 'sport', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/One_Arm_Handstand_Down_Town_San_Jose.jpg?width=640'),

('side-crow',
 'Corbeau Latéral',
 'Yoga — Parshwa Kakasana',
 'yoga', 5,
 'https://commons.wikimedia.org/wiki/Special:FilePath/%C3%81sana_Parshwa_Kak%C3%A1sana_%28Fuerza%29.jpg?width=640');
