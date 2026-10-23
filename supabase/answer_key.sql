-- Seed the answer key. Format: (test_code, question_no, correct_option)
-- Transcribe from the "अंक निर्धारण कुंजी" pages (filled bubbles). Example rows:
insert into answer_keys (test_code, question_no, correct_option) values
('LA', 1, 'A'), ('LA', 2, 'C')
on conflict do nothing;
