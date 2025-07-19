-- Create users table with auth integration
create table public.users (
  user_id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('customer', 'vendor', 'admin')) not null,
  phone_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create menu_items table
create table public.menu_items (
  item_id uuid default uuid_generate_v4() not null primary key,
  name text not null,
  description text,
  price decimal(10,2) not null,
  category text not null,
  is_available boolean default true,
  vendor_id uuid references public.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create carts table
create table public.carts (
  cart_id uuid default uuid_generate_v4() not null primary key,
  user_id uuid references public.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Create cart_items table
create table public.cart_items (
  cart_item_id uuid default uuid_generate_v4() not null primary key,
  cart_id uuid references public.carts not null,
  menu_item_id uuid references public.menu_items not null,
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cart_id, menu_item_id)
);

-- Create orders table
create table public.orders (
  order_id uuid default uuid_generate_v4() not null primary key,
  customer_id uuid references public.users not null,
  total_amount decimal(10,2) not null,
  status text check (status in ('pending', 'preparing', 'ready', 'delivered', 'cancelled')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table public.order_items (
  order_item_id uuid default uuid_generate_v4() not null primary key,
  order_id uuid references public.orders not null,
  menu_item_id uuid references public.menu_items not null,
  quantity integer not null check (quantity > 0),
  price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.users enable row level security;
alter table public.menu_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Users policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = user_id);

-- Menu items policies
create policy "Anyone can view available menu items"
  on public.menu_items for select
  using (is_available = true);

create policy "Vendors can manage their own menu items"
  on public.menu_items for all
  using (auth.uid() = vendor_id);

-- Carts policies
create policy "Users can view their own cart"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "Users can update their own cart"
  on public.carts for all
  using (auth.uid() = user_id);

-- Cart items policies
create policy "Users can manage their own cart items"
  on public.cart_items for all
  using (cart_id in (select cart_id from public.carts where user_id = auth.uid()));

-- Orders policies
create policy "Customers can view their own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

create policy "Vendors can view orders for their menu items"
  on public.orders for select
  using (exists (
    select 1 from public.order_items oi
    join public.menu_items mi on oi.menu_item_id = mi.item_id
    where oi.order_id = orders.order_id and mi.vendor_id = auth.uid()
  ));

-- Order items policies
create policy "Users can view their own order items"
  on public.order_items for select
  using (order_id in (select order_id from public.orders where customer_id = auth.uid()));

create policy "Vendors can view order items for their menu items"
  on public.order_items for select
  using (menu_item_id in (select item_id from public.menu_items where vendor_id = auth.uid()));
