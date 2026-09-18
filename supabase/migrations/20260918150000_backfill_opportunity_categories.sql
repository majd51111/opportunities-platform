update public.opportunities as opportunity
set category_id = category.id
from public.categories as category
where opportunity.category_id is null
  and (
    (opportunity.title ilike '%game%' and (category.slug = 'gaming' or category.name::text ilike '%الألعاب%' or category.name::text ilike '%gaming%'))
    or (opportunity.title ilike '%freelance%' and (category.slug = 'freelancing' or category.name::text ilike '%العمل الحر%' or category.name::text ilike '%freelanc%'))
    or (opportunity.title ilike '%survey%' and (category.slug = 'surveys' or category.name::text ilike '%الاستبيانات%' or category.name::text ilike '%survey%'))
    or (opportunity.title ilike '%research%' and (category.slug = 'surveys' or category.name::text ilike '%الاستبيانات%' or category.name::text ilike '%survey%'))
    or (opportunity.title ilike '%testing%' and (category.slug = 'apps-and-websites' or category.name::text ilike '%التطبيقات والمواقع%' or category.name::text ilike '%app%'))
    or (opportunity.title ilike '%transcription%' and (category.slug = 'remote-work' or category.name::text ilike '%العمل عن بعد%' or category.name::text ilike '%remote%'))
    or (opportunity.title ilike '%translation%' and (category.slug = 'remote-work' or category.name::text ilike '%العمل عن بعد%' or category.name::text ilike '%remote%'))
  );
