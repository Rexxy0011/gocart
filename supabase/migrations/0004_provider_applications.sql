-- Provider verification applications. One row per user max — submitting
-- the /pro/apply form inserts here, admin reviews via /admin/providers,
-- and the row's status drives whether /pro dashboard unlocks for that user.
--
-- Storage: id_document_url and selfie_url point at the private provider-docs
-- Storage bucket. They're paths within the bucket, not public URLs — admins
-- generate signed URLs server-side at view time.

create table if not exists public.provider_applications (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null unique references public.profiles(id) on delete cascade,
    full_name         text not null,
    phone             text not null,
    id_type           text,                                -- nin | passport | license | voter
    id_document_url   text,                                -- path in provider-docs bucket
    selfie_url        text,
    primary_category  text not null,
    specialties       text[] not null default '{}',
    location          text,
    area_covered      text,
    years_experience  integer,
    bio               text,
    certifications    text,
    status            text not null default 'pending',     -- pending | approved | rejected
    rejection_reason  text,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create index if not exists provider_applications_status_idx
    on public.provider_applications(status);

drop trigger if exists provider_applications_touch on public.provider_applications;
create trigger provider_applications_touch
    before update on public.provider_applications
    for each row execute procedure public.touch_updated_at();
