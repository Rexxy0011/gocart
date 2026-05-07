-- Reports can now carry up to 5 image URLs as evidence. Reporters upload
-- the files to the existing product-images bucket under their own folder
-- (path: "<userId>/report-<ts>-<rand>.<ext>") so the existing storage RLS
-- — owner-write, public read — already covers them. Admins viewing the
-- reports queue see the URLs and can click through.
--
-- Cap at 5 is arbitrary but stops a single report from becoming a photo
-- album. Server action enforces the same cap on insert.

alter table public.reports
    add column if not exists evidence_urls text[] not null default '{}';

alter table public.reports
    drop constraint if exists reports_evidence_count_max;

alter table public.reports
    add constraint reports_evidence_count_max
    check (cardinality(evidence_urls) <= 5);
