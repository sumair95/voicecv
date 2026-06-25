-- 007_italian_questions.sql
-- Adds the Italian (it) recording question set so the record flow works for
-- Italian users. Mirrors the 9-question English set (same field_keys + order).
-- Idempotent: clears any existing 'it' rows first.

delete from questions where language = 'it';

insert into questions (language, order_index, question_text, field_key) values
('it', 1, 'Dicci il tuo nome completo, la tua nazionalità, la città e il paese in cui vivi, e il tuo numero di cellulare e la tua email se ne hai una.', 'personal'),
('it', 2, 'Parlaci del tuo lavoro più recente o attuale — il nome dell''azienda, la tua mansione e per quanto tempo ci hai lavorato.', 'recent_job'),
('it', 3, 'Elenca eventuali lavori precedenti, anche temporanei o occasionali, e per quanto tempo li hai svolti.', 'previous_roles'),
('it', 4, 'Quali competenze, strumenti, attrezzature, patenti o software specifici sai usare? Sii il più preciso possibile.', 'skills'),
('it', 5, 'Quali lingue parli, leggi o scrivi? Per ognuna, sei principiante, intermedio o fluente?', 'spoken_languages'),
('it', 6, 'Qual è il tuo titolo di studio più alto e dove hai studiato?', 'education'),
('it', 7, 'Hai conseguito certificati o seguito corsi di formazione?', 'certificates'),
('it', 8, 'Quali sono i tuoi hobby e interessi nel tempo libero?', 'hobbies'),
('it', 9, 'Vuoi descrivere un risultato lavorativo con il metodo STAR? Raccontaci la Situazione, il Compito, l''Azione e il Risultato.', 'achievement');

-- Verify: should return 9.
-- select count(*) from questions where language = 'it';
