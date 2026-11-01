INSERT INTO public.sql_practice_messages (sender_id, content)
SELECT id, 'Hello, how are you?'
FROM public.sql_practice_users
WHERE username = 'Rishi Das'
RETURNING *;