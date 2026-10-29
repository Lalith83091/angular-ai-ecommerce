create or replace function public.place_order(
  p_customer_name text,
  p_email text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
  p_state_region text,
  p_postal_code text,
  p_country text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_subtotal numeric(12, 2);
begin
  if v_user_id is null then
    raise exception 'Authentication is required to place an order.';
  end if;

  if char_length(trim(p_customer_name)) not between 1 and 120
    or char_length(trim(p_email)) not between 3 and 320
    or char_length(trim(p_address_line1)) not between 1 and 200
    or char_length(p_address_line2) > 200
    or char_length(trim(p_city)) not between 1 and 120
    or char_length(p_state_region) > 120
    or char_length(trim(p_postal_code)) not between 1 and 32
    or char_length(trim(p_country)) not between 2 and 120 then
    raise exception 'Please provide valid shipping details.';
  end if;

  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Order items must be provided as a list.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Cannot place an order with an empty cart.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      product_id text,
      product_name text,
      unit_price numeric,
      quantity integer
    )
    where item.product_id is null
      or item.product_name is null
      or item.unit_price is null
      or item.quantity is null
      or char_length(trim(item.product_id)) not between 1 and 100
      or char_length(trim(item.product_name)) not between 1 and 200
      or item.unit_price < 0
      or item.quantity not between 1 and 99
  ) then
    raise exception 'One or more order items are invalid.';
  end if;

  if exists (
    select trim(item.product_id)
    from jsonb_to_recordset(p_items) as item(
      product_id text,
      product_name text,
      unit_price numeric,
      quantity integer
    )
    group by trim(item.product_id)
    having count(*) > 1
  ) then
    raise exception 'An order cannot contain duplicate product lines.';
  end if;

  select sum(round(item.unit_price, 2) * item.quantity)::numeric(12, 2)
    into v_subtotal
  from jsonb_to_recordset(p_items) as item(
    product_id text,
    product_name text,
    unit_price numeric,
    quantity integer
  );

  insert into public.orders (
    user_id,
    status,
    customer_name,
    email,
    address_line1,
    address_line2,
    city,
    state_region,
    postal_code,
    country,
    subtotal,
    shipping_amount,
    total_amount
  )
  values (
    v_user_id,
    'placed',
    trim(p_customer_name),
    trim(p_email),
    trim(p_address_line1),
    trim(p_address_line2),
    trim(p_city),
    trim(p_state_region),
    trim(p_postal_code),
    trim(p_country),
    v_subtotal,
    0,
    v_subtotal
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    unit_price,
    quantity
  )
  select
    v_order_id,
    trim(item.product_id),
    trim(item.product_name),
    round(item.unit_price, 2),
    item.quantity
  from jsonb_to_recordset(p_items) as item(
    product_id text,
    product_name text,
    unit_price numeric,
    quantity integer
  );

  delete from public.cart_items cart_item
  using public.carts cart
  where cart_item.cart_id = cart.id
    and cart.user_id = v_user_id;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(
  text, text, text, text, text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.place_order(
  text, text, text, text, text, text, text, text, jsonb
) to authenticated;
