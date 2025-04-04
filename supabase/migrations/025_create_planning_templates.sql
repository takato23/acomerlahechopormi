-- Create planning_templates table
create table public.planning_templates (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    template_data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on user_id for better query performance
create index planning_templates_user_id_idx on public.planning_templates(user_id);

-- Enable Row Level Security
alter table public.planning_templates enable row level security;

-- Create policies
-- Allow users to view only their own templates
create policy "Users can view their own templates"
    on public.planning_templates for select
    using (auth.uid() = user_id);

-- Allow users to insert their own templates
create policy "Users can insert their own templates"
    on public.planning_templates for insert
    with check (auth.uid() = user_id);

-- Allow users to update their own templates
create policy "Users can update their own templates"
    on public.planning_templates for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow users to delete their own templates
create policy "Users can delete their own templates"
    on public.planning_templates for delete
    using (auth.uid() = user_id);

-- Grant necessary permissions
grant all on public.planning_templates to authenticated;