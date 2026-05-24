-- Challenging pose seed — run after 004_poses.sql migration
-- All images sourced from Wikimedia Commons (public domain / CC)

INSERT INTO public.poses (id, title, artist, category, difficulty, image_url) VALUES

-- ── YOGA (9 poses) ──────────────────────────────────────────────────────────

('warrior-iii',
 'Guerrier III',
 'Yoga — Virabhadrasana III',
 'yoga', 4,
 'https://upload.wikimedia.org/wikipedia/commons/0/06/Tuladandasana_-_Virabhadrasana_III.jpg'),

('eagle-pose',
 'Pose de l''Aigle',
 'Yoga — Garudasana',
 'yoga', 4,
 'https://upload.wikimedia.org/wikipedia/commons/7/73/Garudasana_Yoga-Asana_Nina-Mel.jpg'),

('natarajasana',
 'Seigneur de la Danse',
 'Yoga — Natarajasana',
 'yoga', 5,
 'https://upload.wikimedia.org/wikipedia/commons/7/75/Natarajasana_Yoga-Asana_Nina-Mel.jpg'),

('crow-pose',
 'Pose du Corbeau',
 'Yoga — Bakasana',
 'yoga', 5,
 'https://upload.wikimedia.org/wikipedia/commons/7/70/Crow_pose.jpg'),

('boat-pose',
 'Pose du Bateau',
 'Yoga — Navasana',
 'yoga', 3,
 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Boat_pose.JPG'),

('revolved-triangle',
 'Triangle Renversé',
 'Yoga — Parivrtta Trikonasana',
 'yoga', 4,
 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Parivrtta-Trikonasana_Yoga-Asana_Nina-Mel.jpg'),

('standing-toe-hold',
 'Prise du Gros Orteil Debout',
 'Yoga — Utthita Hasta Padangusthasana',
 'yoga', 5,
 'https://upload.wikimedia.org/wikipedia/commons/5/56/Utthita-Hasta-Padangusthasana_Yoga-Asana_Nina-Mel.jpg'),

('hanumanasana',
 'Grand Écart Frontal',
 'Yoga — Hanumanasana',
 'yoga', 5,
 'https://upload.wikimedia.org/wikipedia/commons/7/77/Hanumanasana_-_Monkey_Pose_-_Side_view.jpg'),

('camel-pose',
 'Pose du Chameau',
 'Yoga — Ustrasana',
 'yoga', 3,
 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Ustrasana_Yoga-Asana_Nina-Mel.jpg'),

-- ── BALLET & DANSE (5 poses) ─────────────────────────────────────────────────

('arabesque-pointe',
 'Arabesque sur Pointe',
 'Ballet classique',
 'ballet', 5,
 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Arabesque_on_pointe.jpg'),

('attitude-ballet',
 'Attitude Croisée',
 'Ballet — Prix de Lausanne',
 'ballet', 4,
 'https://upload.wikimedia.org/wikipedia/commons/3/31/Hinano_Eto_-_Don_Quichotte%2C_Kitri_-_Prix_de_Lausanne_2010-5.jpg'),

('arabesque-swan-lake',
 'Arabesque — Lac des Cygnes',
 'Ballet — Nadja Sellrup',
 'ballet', 4,
 'https://upload.wikimedia.org/wikipedia/commons/2/27/Nadja_Sellrup_in_Swan_Lake_2008.jpg'),

('hopak-split-jump',
 'Saut Cosaques — Grand Écart',
 'Danse — Hopak',
 'ballet', 4,
 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Split_jump_in_Hopak_dance_performed_by_the_Kalyna_Performing_Art_Ensemble.jpg'),

('bharatanatyam',
 'Bharatanatyam — Pose Tribhanga',
 'Danse Classique Indienne',
 'ballet', 5,
 'https://upload.wikimedia.org/wikipedia/commons/2/23/Indian_dance_6_nataraja.jpg'),

-- ── ARTS MARTIAUX (4 poses) ──────────────────────────────────────────────────

('capoeira-tesoura',
 'Capoeira — Tesoura',
 'Capoeira Angola',
 'martial_arts', 4,
 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Tesoura_de_Angola_move.jpg'),

('capoeira-au',
 'Capoeira — Au (Roue)',
 'Capoeira Angola',
 'martial_arts', 4,
 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Capoeira_acrobatics.jpg'),

('capoeira-macaco',
 'Capoeira — Macaco',
 'Capoeira Angola',
 'martial_arts', 5,
 'https://upload.wikimedia.org/wikipedia/commons/7/7f/CapoeiraMacaco_ST_05.jpg'),

('sumo-dohyo',
 'Sumo — Dohyo-iri',
 'Sumo — Art Martial Japonais',
 'martial_arts', 3,
 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Ssunbiki_full_body_view.jpg'),

-- ── SCULPTURE & ART (6 poses) ────────────────────────────────────────────────

('laocoon',
 'Laocoon et ses Fils',
 'Atelier de Rhodes (Vatican)',
 'sculpture', 5,
 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Laocoon_and_His_Sons.jpg'),

('discobolus',
 'Discobole',
 'Myron — Copie romaine',
 'sculpture', 5,
 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Discobolus_in_National_Roman_Museum_Palazzo_Massimo_alle_Terme.JPG'),

('nataraja-bronze',
 'Nataraja — Shiva Dansant',
 'Art Chola — XIe siècle',
 'sculpture', 5,
 'https://upload.wikimedia.org/wikipedia/commons/c/cb/WLA_vanda_Shiva_Nataraja.jpg'),

('nataraja-cern',
 'Nataraja du CERN',
 'Réplique — Inde / CERN Genève',
 'sculpture', 5,
 'https://upload.wikimedia.org/wikipedia/commons/0/09/Shiva%27s_statue_at_CERN_engaging_in_the_Nataraja_dance.jpg'),

('vitruvian-man',
 'L''Homme de Vitruve',
 'Léonard de Vinci — 1490',
 'art', 3,
 'https://upload.wikimedia.org/wikipedia/commons/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg'),

('the-thinker',
 'Le Penseur',
 'Auguste Rodin',
 'sculpture', 2,
 'https://upload.wikimedia.org/wikipedia/commons/5/56/The_Thinker%2C_Rodin.jpg'),

-- ── SPORT & ACROBATIES (6 poses) ────────────────────────────────────────────

('pole-vault',
 'Saut à la Perche — Passage de Barre',
 'Athlétisme — Sandi Morris',
 'sport', 5,
 'https://upload.wikimedia.org/wikipedia/commons/7/73/Sandi_Morris_WCH_2022.jpg'),

('layback-spin',
 'Pirouette Cambrée (Layback)',
 'Patinage Artistique',
 'sport', 4,
 'https://upload.wikimedia.org/wikipedia/commons/2/27/Catch_foot_layback.jpg'),

('one-arm-handstand',
 'Appui Renversé — Un Bras',
 'Acrobatie Urbaine',
 'sport', 5,
 'https://upload.wikimedia.org/wikipedia/commons/2/2d/One_Arm_Handstand_Down_Town_San_Jose.jpg'),

('gymnastics-floor',
 'Gymnaste — Grand Écart Sauté',
 'Gym Artistique — JO Jeunesse 2018',
 'sport', 4,
 'https://upload.wikimedia.org/wikipedia/commons/c/cb/2018-10-12_Gymnastics_at_2018_Summer_Youth_Olympics_%E2%80%93_Girls%27_Artistic_Gymnastics_%E2%80%93_All-around_final_%E2%80%93_Floor_%28Martin_Rulsch%29_405.jpg'),

('side-crow',
 'Corbeau Latéral',
 'Yoga — Parshwa Kakasana',
 'yoga', 5,
 'https://upload.wikimedia.org/wikipedia/commons/f/fb/%C3%81sana_Parshwa_Kak%C3%A1sana_%28Fuerza%29.jpg'),

('headstand',
 'Sur la Tête — Sirsasana',
 'Yoga — Sirsasana',
 'yoga', 4,
 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Sirsasana_Yoga-Asana_Nina-Mel.jpg'),

-- ── CINÉMA CLASSIQUE (2 poses avec vraies images) ────────────────────────────

('singing-in-the-rain',
 'Singing in the Rain',
 'Gene Kelly — Stanley Donen, 1952',
 'cinema', 3,
 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Gene_Kelly_in_Singin%27_in_the_Rain_%28cropped%29.jpg'),

('rocky-victory',
 'Rocky — Victoire sur les Marches',
 'Statue Rocky — Philadelphie',
 'cinema', 2,
 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Rocky_statue_at_the_Philadelphia_Museum_of_Art.jpg')

ON CONFLICT (id) DO UPDATE SET
  title      = EXCLUDED.title,
  artist     = EXCLUDED.artist,
  category   = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  image_url  = EXCLUDED.image_url;
