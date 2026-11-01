SELECT
    u.id,
    u.username,
    m.content
FROM public.sql_practice_users u
LEFT JOIN public.sql_practice_messages m
ON u.id = m.sender_id;