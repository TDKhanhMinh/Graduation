-- Seed events and wishes for testing

-- Create a mock owner
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nonowner@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"owner@example.com","email_verified":true,"phone_verified":false}', 'email', now(), now(), now()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '{"sub":"b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22","email":"nonowner@example.com","email_verified":true,"phone_verified":false}', 'email', now(), now(), now())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Insert events
INSERT INTO public.events (id, owner_id, slug, title, description, visibility, submission_mode)
VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'public-event-1', 'Public Event', 'Test public event', 'public', 'approval_required'),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'unlisted-event-1', 'Unlisted Event', 'Test unlisted event', 'unlisted', 'open'),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'private-event-1', 'Private Event', 'Test private event', 'private', 'closed'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'closed-event-1', 'Closed Public Event', 'Test closed public event', 'public', 'closed')
ON CONFLICT (id) DO NOTHING;

-- Insert wishes
INSERT INTO public.wishes (id, event_id, client_request_id, sender_name, content, moderation_status)
VALUES
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'Alice', 'Congratulations!', 'approved'),
('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'Bob', 'Pending wish', 'pending'),
('a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'Charlie', 'Spam wish', 'rejected'),
('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'Dana', 'Hidden wish', 'hidden')
ON CONFLICT (id) DO NOTHING;
